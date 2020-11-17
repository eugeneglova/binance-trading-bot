const electron = require('electron')
const log = require('electron-log')
const Store = require('electron-store')
const events = require('events')

Object.assign(console, log.functions)

const bot = require('./bot')
const test = require('./test')
const tgbot = require('./tgbot')

const { start, connect, cancelOrders, addStopOrder } = bot
const { start: startTelegramBot } = tgbot

const em = new events.EventEmitter()

const store = new Store({
  defaults: {
    POSITIONS: [
      {
        SYMBOL: 'BTCUSDT',
        SIDE: 'LONG',
        AMOUNT: 0.002,
        PRICE_TYPE: 'distance',
        PRICE: 10000,
        PRICE_DISTANCE: 2,
        GRID: [
          { PRICE_STEP: 20, X_AMOUNT: 1 },
          { PRICE_STEP: 20, X_AMOUNT: 3 },
          { PRICE_STEP: 50, X_AMOUNT: 3 },
          { PRICE_STEP: 60, X_AMOUNT: 1.6 },
          { PRICE_STEP: 80, X_AMOUNT: 1.6 },
          { PRICE_STEP: 120, X_AMOUNT: 2 },
        ],
        TP_GRID: [
          { MIN_PERCENT: 0.25, MAX_PERCENT: 0.6, MAX_COUNT: 6 },
          { MIN_PERCENT: 0.2, MAX_PERCENT: 0.6, MAX_COUNT: 6 },
          { MIN_PERCENT: 0.18, MAX_PERCENT: 0.6, MAX_COUNT: 5 },
          { MIN_PERCENT: 0.14, MAX_PERCENT: 0.5, MAX_COUNT: 4 },
          { MIN_PERCENT: 0.11, MAX_PERCENT: 0.4, MAX_COUNT: 3 },
          { MIN_PERCENT: 0.1, MAX_PERCENT: 0.3, MAX_COUNT: 3 },
        ],
        SP_GRID: [
          { TRIGGER_PERCENT: 0.25, MIN_PERCENT: 0.2 },
          { TRIGGER_PERCENT: 0.2, MIN_PERCENT: 0.15 },
          { TRIGGER_PERCENT: 0.2, MIN_PERCENT: 0.13 },
          { TRIGGER_PERCENT: 0.2, MIN_PERCENT: 0.12 },
          { TRIGGER_PERCENT: 0.13, MIN_PERCENT: 0.1 },
          { TRIGGER_PERCENT: 0.12, MIN_PERCENT: 0.1 },
        ],
        SL_PERCENT: -3,
        TRADES_COUNT: 0,
        TRADES_TILL_STOP: 1000,
        DATETIME_RANGE: ['2020-10-01T00:00:00.000Z', '2030-01-01T00:00:00.000Z'],
      },
      {
        SYMBOL: 'BTCUSDT',
        SIDE: 'SHORT',
        AMOUNT: 0.002,
        PRICE_TYPE: 'distance',
        PRICE: 10000,
        PRICE_DISTANCE: 2,
        GRID: [
          { PRICE_STEP: 20, X_AMOUNT: 1 },
          { PRICE_STEP: 20, X_AMOUNT: 3 },
          { PRICE_STEP: 50, X_AMOUNT: 3 },
          { PRICE_STEP: 60, X_AMOUNT: 1.6 },
          { PRICE_STEP: 80, X_AMOUNT: 1.6 },
          { PRICE_STEP: 120, X_AMOUNT: 2 },
        ],
        TP_GRID: [
          { MIN_PERCENT: 0.25, MAX_PERCENT: 0.6, MAX_COUNT: 6 },
          { MIN_PERCENT: 0.2, MAX_PERCENT: 0.6, MAX_COUNT: 6 },
          { MIN_PERCENT: 0.18, MAX_PERCENT: 0.6, MAX_COUNT: 5 },
          { MIN_PERCENT: 0.14, MAX_PERCENT: 0.5, MAX_COUNT: 4 },
          { MIN_PERCENT: 0.11, MAX_PERCENT: 0.4, MAX_COUNT: 3 },
          { MIN_PERCENT: 0.1, MAX_PERCENT: 0.3, MAX_COUNT: 3 },
        ],
        SP_GRID: [
          { TRIGGER_PERCENT: 0.25, MIN_PERCENT: 0.2 },
          { TRIGGER_PERCENT: 0.2, MIN_PERCENT: 0.15 },
          { TRIGGER_PERCENT: 0.2, MIN_PERCENT: 0.13 },
          { TRIGGER_PERCENT: 0.2, MIN_PERCENT: 0.12 },
          { TRIGGER_PERCENT: 0.13, MIN_PERCENT: 0.1 },
          { TRIGGER_PERCENT: 0.12, MIN_PERCENT: 0.1 },
        ],
        SL_PERCENT: -3,
        TRADES_COUNT: 0,
        TRADES_TILL_STOP: 1000,
        DATETIME_RANGE: ['2020-10-01T00:00:00.000Z', '2030-01-01T00:00:00.000Z'],
      },
    ],
  }
})

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    idth: 900,
    height: 680,
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true
    }
  });
  mainWindow.loadURL(isDev ? 'http://localhost:3009' : `file://${path.join(__dirname, '../../build/index.html')}`);
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

// communication
const { ipcMain } = electron

let disconnectWSFunction
let isWSConnected = false
ipcMain.on('connect', async (event) => {
  isWSConnected = true
  event.reply('onChangeIsWSConnected', JSON.stringify(isWSConnected))
  disconnectWSFunction = await connect(em)
})
ipcMain.on('disconnect', (event) => {
  disconnectWSFunction && disconnectWSFunction()
  isWSConnected = false
  event.reply('onChangeIsWSConnected', JSON.stringify(isWSConnected))
})

ipcMain.on('getIsWSConnected', (event) => {
  event.returnValue = JSON.stringify(isWSConnected)
})

let stopTelegramBotFunction
let isTelegramBotStarted = false
ipcMain.on('startTelegramBot', async (event) => {
  isTelegramBotStarted = true
  event.reply('onChangeIsTelegramBotStarted', JSON.stringify(isTelegramBotStarted))
  stopTelegramBotFunction = startTelegramBot(em)
})
ipcMain.on('stopTelegramBot', (event) => {
  stopTelegramBotFunction && stopTelegramBotFunction()
  isTelegramBotStarted = false
  event.reply('onChangeIsTelegramBotStarted', JSON.stringify(isTelegramBotStarted))
})

ipcMain.on('getIsTelegramBotStarted', (event) => {
  event.returnValue = JSON.stringify(isTelegramBotStarted)
})

const stopFunctions = []
const isRunning = []
ipcMain.on('start', async (event, index) => {
  isRunning[index] = true
  event.reply('onChangeIsRunning', JSON.stringify(isRunning))
  stopFunctions[index] = await start(em, index, mainWindow.webContents)
})
ipcMain.on('stop', (event, index) => {
  stopFunctions[index] && stopFunctions[index]()
  isRunning[index] = false
  event.reply('onChangeIsRunning', JSON.stringify(isRunning))
})

ipcMain.on('getIsRunning', (event) => {
  event.returnValue = JSON.stringify(isRunning)
})

ipcMain.on('cancelOrders', (event, index) => {
  cancelOrders(index, mainWindow.webContents)
})

ipcMain.on('addStopOrder', (event, index) => {
  addStopOrder(index, mainWindow.webContents)
})

ipcMain.on('test', async (event) => {
  em.emit('testmessage')
  store.set(`POSITIONS[1].TRADES_COUNT`, 1)
  const data = await test()
  event.reply('test-done', data)
})

const autoStart = async () => {
  isWSConnected = true
  disconnectWSFunction = await connect(em)
  store.get('POSITIONS').forEach(async (config, index) => {
    if (!config.AUTO_START) return
    isRunning[index] = true
    stopFunctions[index] = await start(em, index, mainWindow.webContents)
  })
  if (store.get('TELEGRAM_AUTO_START')) {
    isTelegramBotStarted = true
    stopTelegramBot = startTelegramBot(em)
  }
}

app.on('ready', autoStart)
