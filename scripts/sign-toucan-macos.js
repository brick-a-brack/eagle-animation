const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

// electron-builder "afterPack" hook.
//
// The toucan-camera-server bundle ships with many prebuilt Mach-O binaries next
// to the executable (Canon's EDSDK.framework, Sony's CrAdapter dylibs, the
// libgphoto2 camlibs/iolibs plugins, Royalmile.framework, ...). Once the app is
// packaged into a .app bundle, macOS/dyld refuses to load some of them because
// their embedded code signature is invalid in this context ("code signature
// invalid", errno=1), so the server aborts (SIGABRT) on launch and the camera
// list stays empty.
//
// We fix this by re-signing EVERY Mach-O file in the toucan tree so dyld will
// load them. The set of shipped binaries changes between toucan releases, so we
// discover them dynamically rather than hardcode a list.
//
// We sign the versioned Mach-O binaries directly rather than the .framework /
// .bundle directories. The frameworks are extracted from a zip, which flattens
// their Versions/ symlinks into real duplicate files; `codesign` on such a bundle
// fails with "bundle format is ambiguous (could be app or framework)". Since dyld
// validates the signature of the individual Mach-O it loads (not the bundle's
// CodeResources seal), per-file signing is what actually fixes the runtime load.
//
// Identity:
//   - ad-hoc ("-") by default: no Apple Developer account needed. Fixes the crash
//     but the .app is still quarantined on download (users need `xattr -cr` once).
//   - Developer ID if one is found (or forced via TOUCAN_CODESIGN_IDENTITY):
//     signs with hardened runtime + entitlements so the build can be notarized.
//
// NOTE: when a real Developer ID identity is used, electron-builder re-signs the
// app after this hook. For a fully notarizable pipeline you'll also want proper
// mac signing config; ad-hoc (the current CI case) is final because electron-builder
// skips its own signing when no identity is available.

const ENTITLEMENTS = path.join(__dirname, 'entitlements.toucan.mac.plist');

// Mach-O / universal binary magic numbers (big-endian read).
const MACHO_MAGICS = new Set([0xfeedface, 0xfeedfacf, 0xcefaedfe, 0xcffaedfe, 0xcafebabe, 0xbebafeca, 0xcafebabf]);

function detectIdentity() {
  if (process.env.TOUCAN_CODESIGN_IDENTITY) {
    return process.env.TOUCAN_CODESIGN_IDENTITY;
  }
  try {
    const out = execFileSync('security', ['find-identity', '-v', '-p', 'codesigning'], { encoding: 'utf8' });
    const match = out.match(/"(Developer ID Application:[^"]+)"/);
    if (match) {
      return match[1];
    }
  } catch {
    // security not available or no identities — fall through to ad-hoc
  }
  return '-'; // ad-hoc
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function isMachO(file) {
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const buf = Buffer.alloc(4);
    if (fs.readSync(fd, buf, 0, 4, 0) < 4) {
      return false;
    }
    return MACHO_MAGICS.has(buf.readUInt32BE(0));
  } catch {
    return false;
  } finally {
    if (fd !== undefined) {
      fs.closeSync(fd);
    }
  }
}

// codesign fails when a bundle contains .DS_Store / resource-fork detritus.
function stripDetritus(root) {
  for (const file of walk(root)) {
    if (path.basename(file) === '.DS_Store') {
      fs.rmSync(file, { force: true });
    }
  }
}

function sign(target, identity, { entitlements } = {}) {
  const args = ['--force', '--sign', identity];

  if (identity !== '-') {
    // Hardened runtime + timestamp are required for notarization.
    args.push('--options', 'runtime', '--timestamp');
    if (entitlements) {
      args.push('--entitlements', entitlements);
    }
  }

  args.push(target);
  console.log(`🐦 [afterPack] codesign ${args.join(' ')}`);
  execFileSync('codesign', args, { stdio: 'inherit' });
}

exports.default = async function afterPack(context) {
  const { appOutDir, electronPlatformName, packager } = context;

  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = `${packager.appInfo.productFilename}.app`;
  const binDir = path.join(appOutDir, appName, 'Contents', 'Resources', 'app.asar.unpacked', 'toucan-camera-server', 'bin', 'macos');
  const binary = path.join(binDir, 'toucan-camera-server');

  if (!fs.existsSync(binary)) {
    console.warn(`🐦 [afterPack] toucan-camera-server not found (${binary}) — skipping signing`);
    return;
  }

  const identity = detectIdentity();
  console.log(`🐦 [afterPack] signing toucan-camera-server with identity: ${identity === '-' ? 'ad-hoc' : identity}`);

  stripDetritus(binDir);

  // Sign every Mach-O file individually (standalone dylibs/.so plugins as well as
  // the binaries nested inside frameworks/bundles), then the main executable last
  // since it is the loader and carries the entitlements.
  const machos = walk(binDir).filter((f) => f !== binary && isMachO(f));
  for (const f of machos) {
    sign(f, identity);
  }
  sign(binary, identity, { entitlements: ENTITLEMENTS });

  // Best-effort verification (non blocking).
  try {
    execFileSync('codesign', ['--verify', '--verbose=2', binary], { stdio: 'inherit' });
  } catch {
    console.warn('🐦 [afterPack] codesign --verify failed (non blocking)');
  }

  console.log(`🐦 [afterPack] signed ${machos.length} Mach-O files + main executable`);
};
