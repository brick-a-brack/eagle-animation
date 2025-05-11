import { join } from 'node:path';

import { electronApp, is, optimizer } from '@electron-toolkit/utils';
import { app, BrowserWindow, ipcMain, net, protocol, shell } from 'electron';
const url = require('node:url');

import icon from '../../resources/icon.png?asset';
import actions from './actions';
import { PROJECTS_PATH } from './config';

let sendToRenderer = () => null;

protocol.registerSchemesAsPrivileged([{ scheme: 'ea-data', privileges: { bypassCSP: true, standard: true, secure: true, supportFetchAPI: true } }]);

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1080,
    minHeight: 450,
    title: 'Eagle Animation by Brick à Brack (Brickfilms.com)',
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      webSecurity: true,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  sendToRenderer = (channel, value) => mainWindow.webContents.send(channel, value);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  protocol.handle('ea-data', (request) => {
    const relativePath = request.url.slice('ea-data://'.length);
    const diskPath = `${PROJECTS_PATH}/${relativePath}`;
    return net.fetch(url.pathToFileURL(diskPath).toString());
  });

  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
app.whenReady().then(() => {
  Object.keys(actions).forEach((name) => {
    ipcMain.handle(name, (evt, args) => {
      return actions[name](evt, args, sendToRenderer);
    });
  });
});
