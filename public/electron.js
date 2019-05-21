const electron = require('electron');

const { app } = electron;
const { BrowserWindow } = electron;

const path = require('path');
const url = require('url');

let mainWindow;

function createWindow() {
    const isDev = process.env.ENV && process.env.ENV === 'development';

    const disableSecurity = (isDev) ? {
        webSecurity: false
    } : {};

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 1024,
        minHeight: 576,
        title: 'Eagle Animation',
        webPreferences: {
            ...disableSecurity,
            nodeIntegration: true
        }
    });

    if (isDev)
        mainWindow.loadURL('http://localhost:3000/');
    else {
        mainWindow.loadURL(
            process.env.ELECTRON_START_URL
            || url.format({
                pathname: path.join(__dirname, '/../build/index.html'),
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
    if (process.platform !== 'darwin')
        app.quit();
});

app.on('activate', () => {
    if (mainWindow === null)
        createWindow();
});
