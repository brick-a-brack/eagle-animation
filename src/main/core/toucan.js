import fs from 'node:fs';
import path from 'node:path';

import { spawn } from 'child_process';

function getPlatformKey() {
  switch (process.platform) {
    case 'win32':
      return 'windows';
    case 'darwin':
      return 'macos';
    default:
      return null;
  }
}

const findBinaryPath = () => {
  const platform = getPlatformKey();
  const binaryName = platform === 'windows' ? 'toucan-camera-server.exe' : 'toucan-camera-server';

  const allowedPaths = [
    path.join(__dirname, binaryName), // Same folder for debug purposes
    path.join(__dirname.replace('app.asar', 'app.asar.unpacked'), '../../toucan-camera-server/bin/', platform, binaryName), // Release path
    path.join(__dirname, '../../toucan-camera-server/bin', platform, binaryName), // Local path during development
  ];

  console.log(`Looking for toucan-camera-server binary in allowed paths:`, allowedPaths);

  for (const path of allowedPaths) {
    if (fs.existsSync(path)) {
      console.log(`Binary found for toucan-camera-server at "${path}"`);
      return path;
    }
  }

  return null;
};

export const runToucanCameraServer = () => {
  const binaryPath = findBinaryPath();
  if (!binaryPath) {
    console.log(`Binary not found for toucan-camera-server`);
    return null;
  }
  console.log(`Starting toucan-camera-server from ${binaryPath}...`);

  let process;
  const startServer = () => {
    process = spawn(binaryPath, [], {
      stdio: 'inherit',
      detached: false,
    });

    console.log(`toucan-camera-server started with PID ${process.pid}`);

    // Relaunch if crashed
    process.on('exit', (code, signal) => {
      console.log(`toucan-camera-server exited with code ${code} (signal: ${signal})`);
      console.log(`Restarting toucan-camera-server in 2 seconds...`);
      setTimeout(() => startServer(), 2000);
    });

    process.on('error', (err) => {
      console.error(`Error starting toucan-camera-server:`, err);
    });
  };

  startServer();
  return process;
};
