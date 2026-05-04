const https = require('https');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const extract = require('extract-zip');

const TOUCAN_CAMERA_SERVER_VERSION = '0.0.5';

const RELEASES = {
  windows: `https://github.com/brick-a-brack/toucan-camera-server/releases/download/v${TOUCAN_CAMERA_SERVER_VERSION}/toucan-camera-server-windows.zip`,
  macos: `https://github.com/brick-a-brack/toucan-camera-server/releases/download/v${TOUCAN_CAMERA_SERVER_VERSION}/toucan-camera-server-macos.zip`,
  linux: `https://github.com/brick-a-brack/toucan-camera-server/releases/download/v${TOUCAN_CAMERA_SERVER_VERSION}/toucan-camera-server-linux.tar.gz`,
};

function getPlatformKey() {
  switch (process.platform) {
    case 'win32':
      return 'windows';
    case 'darwin':
      return 'macos';
    case 'linux':
      return 'linux';
    default:
      return null;
  }
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const request = (requestUrl) => {
      https
        .get(requestUrl, (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            request(res.headers.location);
            return;
          }
          if (res.statusCode !== 200) {
            fs.unlink(dest, () => {});
            reject(new Error(`Download failed with status ${res.statusCode}`));
            return;
          }
          const file = fs.createWriteStream(dest);
          res.pipe(file);
          file.on('finish', () => file.close(resolve));
          file.on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
          });
        })
        .on('error', (err) => {
          fs.unlink(dest, () => {});
          reject(err);
        });
    };
    request(url);
  });
}

async function main() {
  const platform = getPlatformKey();
  if (!platform) {
    console.warn(`toucan-camera-server: unsupported platform "${process.platform}", skipping binary download.`);
    return;
  }

  const url = RELEASES[platform];
  const binDir = path.join(__dirname, '../', 'toucan-camera-server/bin', platform);
  const archiveExt = platform === 'linux' ? 'tar.gz' : 'zip';
  const archivePath = path.join(__dirname, '../', 'toucan-camera-server/', `toucan-camera-server-${platform}.${archiveExt}`);

  fs.mkdirSync(binDir, { recursive: true });

  console.log(`🐦 toucan-camera-server: downloading binaries for ${platform}...`);
  await download(url, archivePath);

  console.log(`🐦 toucan-camera-server: extracting to /bin/${platform}/...`);
  if (platform === 'linux') {
    execFileSync('tar', ['-xzf', archivePath, '-C', binDir]);
  } else {
    await extract(archivePath, { dir: binDir });
  }
  // Ensure the extracted binary is executable on Unix-like systems
  let extractedBinaryPath = null;
  try {
    const binaryName = process.platform === 'win32' ? 'toucan-camera-server.exe' : 'toucan-camera-server';
    extractedBinaryPath = path.join(binDir, binaryName);
    if (process.platform !== 'win32' && fs.existsSync(extractedBinaryPath)) {
      fs.chmodSync(extractedBinaryPath, 0o755);
      if (process.platform === 'darwin') {
        try {
          require('child_process').execFileSync('xattr', ['-d', 'com.apple.quarantine', extractedBinaryPath]);
        } catch (e) {
          // ignore if xattr not available or fails
        }
      }
    }
  } catch (err) {
    console.warn('Could not set executable permission on', extractedBinaryPath, err);
  }

  fs.unlinkSync(archivePath);
  console.log(`🐦 toucan-camera-server: done.`);
}

main()
  .catch((err) => {
    console.error('🐦 toucan-camera-server: install failed:', err.message);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
