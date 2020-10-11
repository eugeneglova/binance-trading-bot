const electron = require('electron');
const { LocalStorage } = require('node-localstorage')

const { lsGet, lsSet } = require('./functions')
const start = require('./bot')

global.localStorage = new LocalStorage('./data')
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const { ipcMain } = electron

ipcMain.on('getConfig', (event) => {
  const config = lsGet('config')
  const defaultConfig = {
    SIDE: 'LONG',
    AMOUNT: 0.002,
    GRID: [
      { PRICE_STEP: 20, X_AMOUNT: 1 },
      { PRICE_STEP: 20, X_AMOUNT: 3 },
      { PRICE_STEP: 50, X_AMOUNT: 3 },
      { PRICE_STEP: 60, X_AMOUNT: 1.6 },
      { PRICE_STEP: 80, X_AMOUNT: 1.6 },
      { PRICE_STEP: 120, X_AMOUNT: 2 },
    ],
    TP_PERCENT: 0.4,
    SP_PERCENT: 0.1,
    SP_PERCENT_TRIGGER: 0.2,
    SL_PERCENT: -3,
    TRADES_TILL_STOP: 1000,
    SYMBOL: 'BTCUSDT',
  }
  event.returnValue = { ...defaultConfig, ...config }
})

ipcMain.on('setConfig', (event, value) => {
  lsSet('config', value)
})

let stop
ipcMain.on('start', () => {
  stop = start()
})
ipcMain.on('stop', () => {
  stop && stop()
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
