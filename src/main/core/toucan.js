import fs from 'node:fs';
import readline from 'node:readline';
import path from 'node:path';

import { spawn } from 'child_process';

let TOUCAN_CAMERA_SERVER_CONFIG = { port: null, token: null };

export const getToucanCameraServerConfig = () => {
  return TOUCAN_CAMERA_SERVER_CONFIG.token && TOUCAN_CAMERA_SERVER_CONFIG.port ? TOUCAN_CAMERA_SERVER_CONFIG : null;
};


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

  for (const path of allowedPaths) {
    if (fs.existsSync(path)) {
      return path;
    }
  }

  return null;
};

export const runToucanCameraServer = (callback = () => {}) => {
  const handleLogLine = (line) => {
    const portMatch = line.match(/^\[config\]\s+PORT=(\d+)$/);
    if (portMatch) {
      const capturedPort = Number(portMatch[1]);
      TOUCAN_CAMERA_SERVER_CONFIG.port = capturedPort;
      callback(getToucanCameraServerConfig());
    }

    const tokenMatch = line.match(/^\[config\]\s+TOKEN=(.+)$/);
    if (tokenMatch) {
      const capturedToken = tokenMatch[1];
      TOUCAN_CAMERA_SERVER_CONFIG.token = capturedToken;
      callback(getToucanCameraServerConfig());
    }
  };

  const binaryPath = findBinaryPath();
  if (!binaryPath) {
    console.log(`🐦 Binary not found for toucan-camera-server`);
    return null;
  }
  console.log(`🐦 Starting toucan-camera-server from ${binaryPath}...`);

  let process;
  const startServer = () => {
    process = spawn(binaryPath, [], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    console.log(`🐦 toucan-camera-server started with PID ${process.pid}`);

    const stdoutReader = readline.createInterface({ input: process.stdout });
    const stderrReader = readline.createInterface({ input: process.stderr });

    stdoutReader.on('line', (line) => {
      console.log(line);
      handleLogLine(line);
    });
    stderrReader.on('line', (line) => {
      console.error(line);
      handleLogLine(line);
    });

    // Relaunch if crashed
    process.on('exit', (code, signal) => {
      TOUCAN_CAMERA_SERVER_CONFIG.token = null;
      TOUCAN_CAMERA_SERVER_CONFIG.port = null;
      callback(getToucanCameraServerConfig());
      stdoutReader.close();
      stderrReader.close();
      console.log(`🐦 toucan-camera-server exited with code ${code} (signal: ${signal}), restarting in 2 seconds...`);
      setTimeout(() => startServer(), 2000);
    });

    process.on('error', (err) => {
      console.error(`Error starting toucan-camera-server:`, err);
    });
  };

  startServer();

  return process;
};
