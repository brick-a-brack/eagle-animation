const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

// electron-builder "afterPack" hook.
//
// The toucan-camera-server bundle ships with many prebuilt Mach-O binaries next
// to the executable (Canon's EDSDK.framework, Sony's CrAdapter dylibs, the
// libgphoto2 camlibs/iolibs plugins, Nikon's Royalmile.framework, ...). Once the
// app is packaged into a .app bundle, macOS/dyld refuses to load some of them
// because their embedded code signature is invalid in this context ("code
// signature invalid", errno=1), so the server aborts (SIGABRT) on launch and the
// camera list stays empty.
//
// We fix this by re-signing everything in the toucan tree. The set of shipped
// binaries changes between toucan releases, so we discover them dynamically
// rather than hardcode a list:
//   - standalone dylibs/.so plugins are signed individually,
//   - frameworks/bundles are signed as bundles with --deep.
//
// The frameworks are extracted from a zip, which flattens their Versions/
// symlinks into real duplicate files. `codesign` then rejects the framework with
// "bundle format is ambiguous (could be app or framework)" — and it refuses to
// sign the inner Mach-O on its own too, since it always resolves a binary to its
// enclosing bundle. So we first rebuild the canonical framework symlink layout
// (normalizeFramework) and only then sign the framework directory.
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

const BUNDLE_SUFFIX = /\.(framework|bundle)$/;
const isInsideBundle = (p) => /\.(framework|bundle)[\\/]/.test(p);

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

// Recursively collect regular files (symlinks are reported as neither file nor
// directory by withFileTypes, so they are skipped — which is what we want).
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

// The outermost .framework/.bundle for every path (so nested bundles are handled
// by --deep on their parent instead of signed twice).
function topLevelBundles(binDir) {
  const set = new Set();
  for (const file of walk(binDir)) {
    const parts = path.relative(binDir, file).split(path.sep);
    const idx = parts.findIndex((p) => BUNDLE_SUFFIX.test(p));
    if (idx !== -1) {
      set.add(parts.slice(0, idx + 1).join(path.sep));
    }
  }
  return [...set].map((rel) => path.join(binDir, rel));
}

// Rebuild the canonical symlink layout of a versioned .framework whose Versions/
// symlinks were flattened into real duplicate files by the zip extraction.
function normalizeFramework(fw) {
  const versionsDir = path.join(fw, 'Versions');
  if (!fs.existsSync(versionsDir)) {
    return; // not a versioned framework, nothing to fix
  }

  const name = path.basename(fw).replace(/\.framework$/, '');
  const versions = fs.readdirSync(versionsDir).filter((v) => v !== 'Current');
  const concrete = versions.includes('A') ? 'A' : versions[0];
  if (!concrete) {
    return;
  }

  const relink = (linkPath, target) => {
    if (fs.existsSync(linkPath) && fs.lstatSync(linkPath).isSymbolicLink()) {
      return; // already a symlink
    }
    fs.rmSync(linkPath, { recursive: true, force: true });
    fs.symlinkSync(target, linkPath);
  };

  // Versions/Current -> A
  relink(path.join(versionsDir, 'Current'), concrete);
  // <Framework>.framework/<Name> -> Versions/Current/<Name>
  if (fs.existsSync(path.join(versionsDir, concrete, name))) {
    relink(path.join(fw, name), path.join('Versions', 'Current', name));
  }
  // <Framework>.framework/Resources -> Versions/Current/Resources
  if (fs.existsSync(path.join(versionsDir, concrete, 'Resources'))) {
    relink(path.join(fw, 'Resources'), path.join('Versions', 'Current', 'Resources'));
  }
}

function sign(target, identity, { deep = false, entitlements } = {}) {
  const args = ['--force'];
  if (deep) {
    args.push('--deep');
  }
  args.push('--sign', identity);

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

  const bundles = topLevelBundles(binDir);
  for (const b of bundles) {
    if (b.endsWith('.framework')) {
      normalizeFramework(b);
    }
  }

  // 1. Standalone Mach-O libraries/plugins (dylibs, .so) — not inside a bundle
  //    and not the main executable. dyld dlopen's these by path, so each needs
  //    its own valid signature.
  const standalone = walk(binDir).filter((f) => f !== binary && !isInsideBundle(f) && isMachO(f));
  for (const f of standalone) {
    sign(f, identity);
  }

  // 2. Frameworks/bundles — signed as bundles (--deep covers their internal
  //    binaries and nested bundles in one pass).
  for (const b of bundles) {
    sign(b, identity, { deep: true });
  }

  // 3. Main executable last — it's the loader, and it carries the entitlements.
  sign(binary, identity, { entitlements: ENTITLEMENTS });

  // Best-effort verification (non blocking).
  try {
    execFileSync('codesign', ['--verify', '--verbose=2', binary], { stdio: 'inherit' });
  } catch {
    console.warn('🐦 [afterPack] codesign --verify failed (non blocking)');
  }

  console.log(`🐦 [afterPack] signed ${standalone.length} libraries + ${bundles.length} bundles + main executable`);
};
