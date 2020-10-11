const electron = require('electron');
const { LocalStorage } = require('node-localstorage')

const { lsGet, lsSet } = require('./functions')

global.localStorage = new LocalStorage('./data')
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const { ipcMain } = electron
ipcMain.on('getConfig', (event) => {
  event.returnValue = lsGet('config')
})

ipcMain.on('setConfig', (event, value) => {
  lsSet('config', value)
})

const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    idth: 900,
    height: 680,
    webPreferences: {
      nodeIntegration: true
    }
  });
  mainWindow.loadURL(isDev ? 'http://localhost:3009' : `file://${path.join(__dirname, '../build/index.html')}`);
  if (isDev) {
    // Open the DevTools.
    //BrowserWindow.addDevToolsExtension('<location to your react chrome extension>');
    mainWindow.webContents.openDevTools();
  }
  mainWindow.on('closed', () => mainWindow = null);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
