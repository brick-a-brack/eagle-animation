import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

import { spawn } from 'child_process';

let TOUCAN_CAMERA_SERVER_CONFIG = { port: null, token: null };
let TOUCAN_CHILD_PROCESS = null;
let TOUCAN_IS_SHUTTING_DOWN = false;

export const getToucanCameraServerConfig = () => {
  return TOUCAN_CAMERA_SERVER_CONFIG.token && TOUCAN_CAMERA_SERVER_CONFIG.port ? TOUCAN_CAMERA_SERVER_CONFIG : null;
};

export const stopToucanCameraServer = () => {
  TOUCAN_IS_SHUTTING_DOWN = true;
  const child = TOUCAN_CHILD_PROCESS;
  TOUCAN_CHILD_PROCESS = null;
  if (!child || child.exitCode !== null || child.signalCode !== null) {
    return;
  }
  try {
    child.kill('SIGTERM');
  } catch {
    // ignore
  }
  // SIGKILL fallback if it didn't exit cleanly within 1s
  setTimeout(() => {
    try {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGKILL');
      }
    } catch {
      // ignore
    }
  }, 1000).unref?.();
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

const findBinaryPath = () => {
  const platform = getPlatformKey();
  if (!platform) {
    return null;
  }

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

  if (import.meta.env.VITE_TOUCAN_CAMERA_SERVER_URL) {
    console.log(`🐦 Using existing toucan-camera-server at ${import.meta.env.VITE_TOUCAN_CAMERA_SERVER_URL}`);
    return null;
  }

  const binaryPath = findBinaryPath();
  if (!binaryPath) {
    console.log(`🐦 Binary not found for toucan-camera-server`);
    return null;
  }
  console.log(`🐦 Starting toucan-camera-server from ${binaryPath}...`);

  const startServer = () => {
    if (TOUCAN_IS_SHUTTING_DOWN) {
      return;
    }

    const child = spawn(binaryPath, [], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });
    TOUCAN_CHILD_PROCESS = child;

    console.log(`🐦 toucan-camera-server started with PID ${child.pid}`);

    const stdoutReader = readline.createInterface({ input: child.stdout });
    const stderrReader = readline.createInterface({ input: child.stderr });

    stdoutReader.on('line', (line) => {
      console.log(line);
      handleLogLine(line);
    });
    stderrReader.on('line', (line) => {
      console.error(line);
      handleLogLine(line);
    });

    child.on('exit', (code, signal) => {
      TOUCAN_CAMERA_SERVER_CONFIG.token = null;
      TOUCAN_CAMERA_SERVER_CONFIG.port = null;
      callback(getToucanCameraServerConfig());
      stdoutReader.close();
      stderrReader.close();
      if (TOUCAN_CHILD_PROCESS === child) {
        TOUCAN_CHILD_PROCESS = null;
      }
      if (TOUCAN_IS_SHUTTING_DOWN) {
        console.log(`🐦 toucan-camera-server exited with code ${code} (signal: ${signal})`);
        return;
      }
      console.log(`🐦 toucan-camera-server exited with code ${code} (signal: ${signal}), restarting in 2 seconds...`);
      setTimeout(() => startServer(), 2000);
    });

    child.on('error', (err) => {
      console.error(`Error starting toucan-camera-server:`, err);
    });
  };

  startServer();

  return TOUCAN_CHILD_PROCESS;
};
