import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';

import { spawn } from 'child_process';

// Options the binary is launched with — owned by the renderer through SET_CONFIG.
let TOUCAN_CAMERA_SERVER_OPTIONS = { expose: false, background: false, token: null };

// Runtime values announced by the running server on stdout.
let TOUCAN_CAMERA_SERVER_RUNTIME = { port: null, token: null };

let TOUCAN_CHILD_PROCESS = null;
let TOUCAN_IS_SHUTTING_DOWN = false;
let TOUCAN_IS_STOPPED = false;
let TOUCAN_START_SERVER = null;
let TOUCAN_RESTART_TIMER = null;
let TOUCAN_RESTART_IMMEDIATELY = false;
let TOUCAN_CONFIG_WAITERS = [];

const TOUCAN_READY_TIMEOUT = 15000;
const TOUCAN_RESTART_DELAY = 2000;

// Address other devices can reach when the server is exposed. The binary binds on
// 0.0.0.0, which is not dialable, so the first non-internal IPv4 is reported.
const getLanHostname = () => {
  for (const addresses of Object.values(os.networkInterfaces())) {
    for (const address of addresses || []) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }
  return '127.0.0.1';
};

/**
 * Always returns the full shape. `port` and `token` are null while no server is
 * listening — which is the case until the renderer has sent a first SET_CONFIG.
 */
export const getToucanCameraServerConfig = () => ({
  hostname: TOUCAN_CAMERA_SERVER_OPTIONS.expose ? getLanHostname() : '127.0.0.1',
  expose: TOUCAN_CAMERA_SERVER_OPTIONS.expose,
  background: TOUCAN_CAMERA_SERVER_OPTIONS.background,
  port: TOUCAN_CAMERA_SERVER_RUNTIME.port,
  token: TOUCAN_CAMERA_SERVER_RUNTIME.token,
  secure: false, // the binary serves plain HTTP
});

const isServerListening = () => !!TOUCAN_CAMERA_SERVER_RUNTIME.port && !!TOUCAN_CAMERA_SERVER_RUNTIME.token;

// Releases every pending waiter with whatever the config currently is. Called when
// the server is stopped on purpose, so a concurrent SET does not hang until timeout.
const flushConfigWaiters = () => {
  if (TOUCAN_CONFIG_WAITERS.length === 0) {
    return;
  }
  const waiters = TOUCAN_CONFIG_WAITERS;
  TOUCAN_CONFIG_WAITERS = [];
  waiters.forEach((resolve) => resolve(getToucanCameraServerConfig()));
};

// The port and the token are only known once the freshly spawned server prints them
// on stdout, so callers wait for that instead of reading a stale config.
const resolveConfigWaiters = () => {
  if (isServerListening()) {
    flushConfigWaiters();
  }
};

const waitForServer = () =>
  new Promise((resolve) => {
    if (isServerListening()) {
      resolve(getToucanCameraServerConfig());
      return;
    }
    const waiter = (config) => {
      clearTimeout(timer);
      resolve(config);
    };
    const timer = setTimeout(() => {
      TOUCAN_CONFIG_WAITERS = TOUCAN_CONFIG_WAITERS.filter((e) => e !== waiter);
      resolve(getToucanCameraServerConfig());
    }, TOUCAN_READY_TIMEOUT);
    TOUCAN_CONFIG_WAITERS.push(waiter);
  });

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

  for (const candidate of allowedPaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
};

/**
 * Builds the spawn/supervision closure once. Nothing is launched here: the binary
 * only ever starts from setToucanCameraServerConfig(), so the app boots without a
 * camera server until the renderer asks for one.
 */
const createServerRunner = () => {
  if (TOUCAN_START_SERVER) {
    return TOUCAN_START_SERVER;
  }

  if (import.meta.env.VITE_TOUCAN_CAMERA_SERVER_URL) {
    console.log(`🐦 Using existing toucan-camera-server at ${import.meta.env.VITE_TOUCAN_CAMERA_SERVER_URL}`);
    return null;
  }

  const binaryPath = findBinaryPath();
  if (!binaryPath) {
    console.log(`🐦 Binary not found for toucan-camera-server`);
    return null;
  }

  const handleLogLine = (line) => {
    const portMatch = line.match(/^\[config\]\s+PORT=(\d+)$/);
    if (portMatch) {
      TOUCAN_CAMERA_SERVER_RUNTIME.port = Number(portMatch[1]);
      resolveConfigWaiters();
    }

    const tokenMatch = line.match(/^\[config\]\s+TOKEN=(.+)$/);
    if (tokenMatch) {
      TOUCAN_CAMERA_SERVER_RUNTIME.token = tokenMatch[1];
      resolveConfigWaiters();
    }
  };

  const startServer = () => {
    if (TOUCAN_IS_SHUTTING_DOWN || TOUCAN_IS_STOPPED) {
      return;
    }

    // A retry may already be scheduled — never end up with two servers.
    if (TOUCAN_RESTART_TIMER) {
      clearTimeout(TOUCAN_RESTART_TIMER);
      TOUCAN_RESTART_TIMER = null;
    }

    // `--expose` is a presence flag, not a valued one: passing `--expose false`
    // still enables it, so the flag has to be omitted to bind on 127.0.0.1 only.
    // `background` is not forwarded: it is an Android concern (keeping the camera
    // service alive) and the desktop binary has no such option.
    const args = [];
    if (TOUCAN_CAMERA_SERVER_OPTIONS.expose) {
      args.push('--expose');
    }
    if (TOUCAN_CAMERA_SERVER_OPTIONS.token) {
      args.push('--token', TOUCAN_CAMERA_SERVER_OPTIONS.token);
    }

    console.log(`🐦 Starting toucan-camera-server from ${binaryPath} (expose=${TOUCAN_CAMERA_SERVER_OPTIONS.expose})...`);

    const child = spawn(binaryPath, args, {
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
      TOUCAN_CAMERA_SERVER_RUNTIME = { port: null, token: null };
      stdoutReader.close();
      stderrReader.close();
      if (TOUCAN_CHILD_PROCESS === child) {
        TOUCAN_CHILD_PROCESS = null;
      }
      if (TOUCAN_IS_SHUTTING_DOWN || TOUCAN_IS_STOPPED) {
        console.log(`🐦 toucan-camera-server exited with code ${code} (signal: ${signal})`);
        return;
      }
      // An option change restarts at once; an unexpected exit backs off.
      const delay = TOUCAN_RESTART_IMMEDIATELY ? 0 : TOUCAN_RESTART_DELAY;
      TOUCAN_RESTART_IMMEDIATELY = false;
      console.log(`🐦 toucan-camera-server exited with code ${code} (signal: ${signal}), restarting in ${delay}ms...`);
      TOUCAN_RESTART_TIMER = setTimeout(() => {
        TOUCAN_RESTART_TIMER = null;
        startServer();
      }, delay);
    });

    child.on('error', (err) => {
      console.error(`Error starting toucan-camera-server:`, err);
    });
  };

  TOUCAN_START_SERVER = startServer;
  return startServer;
};

/**
 * Applies the sharing options and makes sure a server is running with them:
 *  - expose: bind on 0.0.0.0 (reachable from other devices) instead of 127.0.0.1
 *  - background: Android-only, stored and reported back but unused here
 *  - token: bearer token clients must present; null lets the server generate one
 *
 * The binary reads its options at startup only, so it is restarted when they change.
 * This is also the only entry point that ever launches it. Resolves with the config
 * of the server actually listening.
 */
export const setToucanCameraServerConfig = async ({ expose = false, background = false, token = null } = {}) => {
  const options = { expose: !!expose, background: !!background, token: token || null };
  // `background` never reaches the process, so it alone does not warrant a restart.
  const needsRestart = options.expose !== TOUCAN_CAMERA_SERVER_OPTIONS.expose || options.token !== TOUCAN_CAMERA_SERVER_OPTIONS.token;
  TOUCAN_CAMERA_SERVER_OPTIONS = options;

  if (TOUCAN_IS_SHUTTING_DOWN) {
    return getToucanCameraServerConfig();
  }

  // Asking for a configuration lifts a previous stop
  TOUCAN_IS_STOPPED = false;

  // Nothing to drive: external VITE_TOUCAN_CAMERA_SERVER_URL, or missing binary.
  const startServer = createServerRunner();
  if (!startServer) {
    return getToucanCameraServerConfig();
  }

  const child = TOUCAN_CHILD_PROCESS;
  const isRunning = !!child && child.exitCode === null && child.signalCode === null;

  if (isRunning && needsRestart) {
    console.log(`🐦 Restarting toucan-camera-server (expose=${options.expose})...`);
    // Invalidate right away so waiters block until the new server announces itself
    // instead of resolving with the config of the process being killed.
    TOUCAN_CAMERA_SERVER_RUNTIME = { port: null, token: null };
    TOUCAN_RESTART_IMMEDIATELY = true;
    try {
      child.kill('SIGTERM');
    } catch {
      // ignore
    }
  } else if (!isRunning) {
    // First SET, or the server crashed: bring it up now rather than waiting.
    startServer();
  }

  return waitForServer();
};

const killServer = () => {
  if (TOUCAN_RESTART_TIMER) {
    clearTimeout(TOUCAN_RESTART_TIMER);
    TOUCAN_RESTART_TIMER = null;
  }
  const child = TOUCAN_CHILD_PROCESS;
  TOUCAN_CHILD_PROCESS = null;
  TOUCAN_CAMERA_SERVER_RUNTIME = { port: null, token: null };
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

/**
 * Stops the server without preventing a later restart: the next
 * setToucanCameraServerConfig() brings it back up. Used when the user turns the
 * camera server off. Safe to call when nothing is running.
 */
export const stopToucanCameraServer = () => {
  if (!TOUCAN_IS_STOPPED) {
    console.log('🐦 Stopping toucan-camera-server...');
  }
  TOUCAN_IS_STOPPED = true;
  killServer();
  flushConfigWaiters();
  return getToucanCameraServerConfig();
};

/** Definitive stop, on Electron exit — nothing can restart the server afterwards. */
export const shutdownToucanCameraServer = () => {
  TOUCAN_IS_SHUTTING_DOWN = true;
  killServer();
  flushConfigWaiters();
};
