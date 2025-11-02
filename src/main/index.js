import 'source-map-support/register';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import url from 'node:url';

import { electronApp, is, optimizer } from '@electron-toolkit/utils';
import { app, BrowserWindow, ipcMain, net, protocol, shell } from 'electron';
import sharp from 'sharp';

import icon from '../../resources/icon.png?asset';
import { parseResizeArguments } from '../common/resizer';
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

  protocol.handle('ea-data', async (request) => {
    // Parse URL and parameters
    const urlObj = new URL(request.url);

    // Get disk path
    const diskPath = `${PROJECTS_PATH}/${request.url.slice('ea-data://'.length).split('?')[0]}`;

    // Options
    const { w, h, m, f, q, i } = parseResizeArguments(urlObj.searchParams);

    // No changes needed
    if (!w && !h && !f && !q && !m && !i) {
      return net.fetch(url.pathToFileURL(diskPath).toString());
    }

    try {
      // Create a Sharp instance
      const inputBuf = await readFile(diskPath);
      let img = sharp(inputBuf);

      // Metadata only
      if (i === 'json') {
        const size = await img.metadata();
        return new Response(
          JSON.stringify({
            width: size.width,
            height: size.height,
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=31536000',
            },
          }
        );
      }

      // Resize
      if (w || h) {
        img = img.resize(w ? parseInt(w, 10) : null, h ? parseInt(h, 10) : null, {
          fit: m === 'cover' ? 'cover' : 'contain',
          withoutEnlargement: true,
        });
      }

      // Format conversion
      const quality = q ? parseInt(q, 10) : 80;
      let outputBuffer = null;
      let mimeType = null;
      if (!outputBuffer && f === 'png') {
        outputBuffer = await img.png({ quality }).toBuffer();
        mimeType = 'image/png';
      }
      if (!outputBuffer && f === 'webp') {
        outputBuffer = await img.webp({ quality }).toBuffer();
        mimeType = 'image/webp';
      }
      if (!outputBuffer && f === 'avif') {
        outputBuffer = await img.avif({ quality }).toBuffer();
        mimeType = 'image/avif';
      }
      if (!outputBuffer) {
        outputBuffer = await img.jpeg({ quality }).toBuffer();
        mimeType = 'image/jpeg';
      }

      return new Response(outputBuffer, {
        headers: {
          'content-type': mimeType,
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    } catch (err) {
      console.error('ea-data handler error', err);
      return net.fetch(url.pathToFileURL(diskPath).toString());
    }
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
