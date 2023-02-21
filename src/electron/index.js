import electron from 'electron';
import path from 'path';
import url from 'url';

import actions from './actions';

const { app, ipcMain, systemPreferences, BrowserWindow } = electron;

// Force color space
app.commandLine.appendSwitch('force-color-profile', 'srgb');

let mainWindow;

function createWindow() {
    if (systemPreferences.askForMediaAccess) {
        systemPreferences.askForMediaAccess('camera');
    }

    const isDev = process.env.ENV && process.env.ENV === 'development';

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 1024,
        minHeight: 576,
        title: 'Eagle Animation',
        webPreferences: {
            webSecurity: false,
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, '../../dist/electron/preload.js')
        }
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:8282/');
    } else {
        mainWindow.setMenuBarVisibility(false);
        mainWindow.loadURL(
            process.env.ELECTRON_START_URL
            || url.format({
                pathname: path.join(__dirname, '../../dist/electron/renderer/index.html'),
                protocol: 'file:',
                slashes: true
            })
        );
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.whenReady().then(() => {
    Object.keys(actions).forEach((name) => {
        ipcMain.handle(name, (evt, args) => {
            console.log('[IPC]', name, args || {});
            return actions[name](evt, args);
        })
    })

    if (mainWindow === null) {
        createWindow();
    }
})
