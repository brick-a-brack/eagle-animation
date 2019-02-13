const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

let mainWindow

function createWindow() {

  const isDev = process.env.ENV && process.env.ENV === 'development';

  const disableSecurity = (isDev) ? {
    webPreferences: {
      webSecurity: false,
    }
  } : {}

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    ...disableSecurity
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000/');
  } else {
    mainWindow.loadURL(
      process.env.ELECTRON_START_URL ||
      url.format({
        pathname: path.join(__dirname, '/../build/index.html'),
        protocol: 'file:',
        slashes: true
      })
    )
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})