const electron = require('electron')
const log = require('electron-log')
const Store = require('electron-store')
const events = require('events')

Object.assign(console, log.functions)

const bot = require('./bot')
const test = require('./test')
const tgbot = require('./tgbot')

const { start, connect, cancelOrders, addStopOrder, takeProfitOrder } = bot
const { start: startTelegramBot } = tgbot

const em = new events.EventEmitter()

const store = new Store({
  defaults: {
    POSITIONS: [
      {
        SYMBOL: 'BTCUSDT',
        SIDE: 'LONG',
        AMOUNT: '0.02',
        PRICE_TYPE: 'distance',
        PRICE: '11000',
        PRICE_DISTANCE: '5',
        GRID: [
          {
            PRICE_STEP: '40',
            X_AMOUNT: 1,
          },
          {
            PRICE_STEP: '40',
            X_AMOUNT: 3,
          },
          {
            PRICE_STEP: '100',
            X_AMOUNT: 3,
          },
          {
            PRICE_STEP: '120',
            X_AMOUNT: 1.6,
          },
          {
            PRICE_STEP: '160',
            X_AMOUNT: 1.6,
          },
          {
            PRICE_STEP: '240',
            X_AMOUNT: 2,
          },
        ],
        TP_MIN_PERCENT: '0.15',
        TP_MAX_PERCENT: '0.6',
        TP_MAX_COUNT: 6,
        SP_PERCENT: 0.1,
        SP_PERCENT_TRIGGER: 0.2,
        SL_PERCENT: '-4',
        TRADES_COUNT: 0,
        TRADES_TILL_STOP: '1000',
        DATETIME_RANGE: ['2020-10-01T20:22:34.022Z', '2020-11-26T20:22:34.022Z'],
        TP_GRID: [
          {
            MIN_PERCENT: '0.3',
            MAX_PERCENT: '2',
            MAX_COUNT: '5',
          },
          {
            MIN_PERCENT: '0.25',
            MAX_PERCENT: '1.5',
            MAX_COUNT: '5',
          },
          {
            MIN_PERCENT: '0.22',
            MAX_PERCENT: '1',
            MAX_COUNT: 5,
          },
          {
            MIN_PERCENT: '0.15',
            MAX_PERCENT: '0.7',
            MAX_COUNT: 4,
          },
          {
            MIN_PERCENT: 0.11,
            MAX_PERCENT: '0.5',
            MAX_COUNT: '4',
          },
          {
            MIN_PERCENT: 0.1,
            MAX_PERCENT: '0.4',
            MAX_COUNT: 3,
          },
        ],
        SP_GRID: [
          {
            TRIGGER_PERCENT: '1.2',
            MIN_PERCENT: '0.1',
          },
          {
            TRIGGER_PERCENT: '0.75',
            MIN_PERCENT: '0.1',
          },
          {
            TRIGGER_PERCENT: '0.44',
            MIN_PERCENT: '0.1',
          },
          {
            TRIGGER_PERCENT: '0.5',
            MIN_PERCENT: '0.1',
          },
          {
            TRIGGER_PERCENT: '0.15',
            MIN_PERCENT: 0.1,
          },
          {
            TRIGGER_PERCENT: '0.13',
            MIN_PERCENT: 0.1,
          },
        ],
        AUTO_START: false,
      },
      {
        SYMBOL: 'BTCUSDT',
        SIDE: 'SHORT',
        AMOUNT: '0.005',
        PRICE_TYPE: 'distance',
        PRICE: 10000,
        PRICE_DISTANCE: 2,
        GRID: [
          {
            PRICE_STEP: '40',
            X_AMOUNT: 1,
          },
          {
            PRICE_STEP: '40',
            X_AMOUNT: 3,
          },
          {
            PRICE_STEP: '100',
            X_AMOUNT: 3,
          },
          {
            PRICE_STEP: '120',
            X_AMOUNT: 1.6,
          },
          {
            PRICE_STEP: '160',
            X_AMOUNT: 1.6,
          },
          {
            PRICE_STEP: '240',
            X_AMOUNT: 2,
          },
        ],
        TP_MIN_PERCENT: '0.11',
        TP_MAX_PERCENT: 0.6,
        TP_MAX_COUNT: 6,
        SP_PERCENT: 0.1,
        SP_PERCENT_TRIGGER: 0.2,
        SL_PERCENT: '-5',
        TRADES_COUNT: 0,
        TRADES_TILL_STOP: 1000,
        DATETIME_RANGE: ['2020-10-01T20:22:34.022Z', '2020-11-26T20:22:34.022Z'],
        TP_GRID: [
          {
            MIN_PERCENT: '0.3',
            MAX_PERCENT: '1',
            MAX_COUNT: 6,
          },
          {
            MIN_PERCENT: '0.25',
            MAX_PERCENT: '0.9',
            MAX_COUNT: 6,
          },
          {
            MIN_PERCENT: 0.18,
            MAX_PERCENT: 0.6,
            MAX_COUNT: 5,
          },
          {
            MIN_PERCENT: 0.14,
            MAX_PERCENT: 0.5,
            MAX_COUNT: 4,
          },
          {
            MIN_PERCENT: 0.11,
            MAX_PERCENT: 0.4,
            MAX_COUNT: 3,
          },
          {
            MIN_PERCENT: 0.1,
            MAX_PERCENT: 0.3,
            MAX_COUNT: 3,
          },
        ],
        SP_GRID: [
          {
            TRIGGER_PERCENT: '0.32',
            MIN_PERCENT: 0.2,
          },
          {
            TRIGGER_PERCENT: '0.28',
            MIN_PERCENT: '0.2',
          },
          {
            TRIGGER_PERCENT: 0.2,
            MIN_PERCENT: 0.13,
          },
          {
            TRIGGER_PERCENT: 0.2,
            MIN_PERCENT: 0.12,
          },
          {
            TRIGGER_PERCENT: 0.13,
            MIN_PERCENT: 0.1,
          },
          {
            TRIGGER_PERCENT: 0.12,
            MIN_PERCENT: 0.1,
          },
        ],
        AUTO_START: false,
      },
      {
        SYMBOL: 'LINKUSDT',
        AMOUNT: '10',
        SIDE: 'LONG',
        GRID: [
          {
            PRICE_STEP: '0.1',
            X_AMOUNT: 1,
          },
          {
            PRICE_STEP: '0.15',
            X_AMOUNT: 3,
          },
          {
            PRICE_STEP: '0.28',
            X_AMOUNT: 3,
          },
          {
            PRICE_STEP: '0.38',
            X_AMOUNT: 1.6,
          },
          {
            PRICE_STEP: '0.5',
            X_AMOUNT: 1.6,
          },
          {
            PRICE_STEP: '0.8',
            X_AMOUNT: 2,
          },
        ],
        TP_GRID: [
          {
            MIN_PERCENT: '0.6',
            MAX_PERCENT: '2.6',
            MAX_COUNT: 6,
          },
          {
            MIN_PERCENT: '0.45',
            MAX_PERCENT: '2.2',
            MAX_COUNT: 6,
          },
          {
            MIN_PERCENT: '0.3',
            MAX_PERCENT: '1.5',
            MAX_COUNT: 5,
          },
          {
            MIN_PERCENT: '0.2',
            MAX_PERCENT: '1',
            MAX_COUNT: 4,
          },
          {
            MIN_PERCENT: '0.17',
            MAX_PERCENT: '0.8',
            MAX_COUNT: 3,
          },
          {
            MIN_PERCENT: '0.15',
            MAX_PERCENT: '0.6',
            MAX_COUNT: 3,
          },
        ],
        SP_GRID: [
          {
            TRIGGER_PERCENT: '0.7',
            MIN_PERCENT: '0.2',
          },
          {
            TRIGGER_PERCENT: '0.6',
            MIN_PERCENT: '0.2',
          },
          {
            TRIGGER_PERCENT: '0.4',
            MIN_PERCENT: '0.2',
          },
          {
            TRIGGER_PERCENT: '0.3',
            MIN_PERCENT: '0.2',
          },
          {
            TRIGGER_PERCENT: '0.25',
            MIN_PERCENT: '0.2',
          },
          {
            TRIGGER_PERCENT: '0.2',
            MIN_PERCENT: '0.18',
          },
        ],
        SL_PERCENT: '-8',
        TRADES_TILL_STOP: '1000',
        DATETIME_RANGE: ['2020-11-05T20:41:54.129Z', '2024-05-29T20:41:54.129Z'],
        PRICE_TYPE: 'distance',
        PRICE_DISTANCE: '0.005',
        AUTO_START: false,
        TRADES_COUNT: 0,
      },
      {
        SYMBOL: 'BCHUSDT',
        AMOUNT: '0.2',
        PRICE_TYPE: 'bb-mid',
        PRICE_DISTANCE: '0.02',
        SIDE: 'LONG',
        GRID: [
          {
            PRICE_STEP: '2',
            X_AMOUNT: 1,
          },
          {
            PRICE_STEP: '2',
            X_AMOUNT: 3,
          },
          {
            PRICE_STEP: '5',
            X_AMOUNT: 3,
          },
          {
            PRICE_STEP: '6',
            X_AMOUNT: 1.6,
          },
          {
            PRICE_STEP: '8',
            X_AMOUNT: 1.6,
          },
          {
            PRICE_STEP: '12',
            X_AMOUNT: 2,
          },
        ],
        TP_GRID: [
          {
            MIN_PERCENT: 0.25,
            MAX_PERCENT: '1',
            MAX_COUNT: '5',
          },
          {
            MIN_PERCENT: 0.2,
            MAX_PERCENT: '1',
            MAX_COUNT: '5',
          },
          {
            MIN_PERCENT: 0.18,
            MAX_PERCENT: 0.6,
            MAX_COUNT: '4',
          },
          {
            MIN_PERCENT: 0.14,
            MAX_PERCENT: 0.5,
            MAX_COUNT: 4,
          },
          {
            MIN_PERCENT: 0.11,
            MAX_PERCENT: 0.4,
            MAX_COUNT: 3,
          },
          {
            MIN_PERCENT: 0.1,
            MAX_PERCENT: 0.3,
            MAX_COUNT: 3,
          },
        ],
        SP_GRID: [
          {
            TRIGGER_PERCENT: '0.5',
            MIN_PERCENT: 0.2,
          },
          {
            TRIGGER_PERCENT: '0.5',
            MIN_PERCENT: 0.15,
          },
          {
            TRIGGER_PERCENT: '0.5',
            MIN_PERCENT: 0.13,
          },
          {
            TRIGGER_PERCENT: 0.2,
            MIN_PERCENT: 0.12,
          },
          {
            TRIGGER_PERCENT: 0.13,
            MIN_PERCENT: 0.1,
          },
          {
            TRIGGER_PERCENT: 0.12,
            MIN_PERCENT: 0.1,
          },
        ],
        SL_PERCENT: '-8',
        TRADES_TILL_STOP: '1000',
        DATETIME_RANGE: ['2020-11-01T08:17:25.310Z', '2022-11-30T08:17:25.310Z'],
        AUTO_START: false,
        TRADES_COUNT: 0,
      },
      {
        SYMBOL: 'LINKUSDT',
        SIDE: 'SHORT',
        AMOUNT: '0.5',
        PRICE_TYPE: 'distance',
        PRICE_DISTANCE: '0.01',
        GRID: [
          {
            PRICE_STEP: '0.15',
            X_AMOUNT: 1,
          },
          {
            PRICE_STEP: '0.16',
            X_AMOUNT: 3,
          },
          {
            PRICE_STEP: '0.32',
            X_AMOUNT: 3,
          },
          {
            PRICE_STEP: '0.45',
            X_AMOUNT: 1.6,
          },
          {
            PRICE_STEP: '0.6',
            X_AMOUNT: 1.6,
          },
          {
            PRICE_STEP: '0.9',
            X_AMOUNT: 2,
          },
        ],
        TP_GRID: [
          {
            MIN_PERCENT: '0.2',
            MAX_PERCENT: '1',
            MAX_COUNT: '6',
          },
          {
            MIN_PERCENT: '0.18',
            MAX_PERCENT: '0.9',
            MAX_COUNT: '5',
          },
          {
            MIN_PERCENT: '0.15',
            MAX_PERCENT: '0.8',
            MAX_COUNT: '4',
          },
          {
            MIN_PERCENT: '0.15',
            MAX_PERCENT: '0.65',
            MAX_COUNT: '4',
          },
          {
            MIN_PERCENT: '0.15',
            MAX_PERCENT: '0.55',
            MAX_COUNT: '3',
          },
          {
            MIN_PERCENT: '0.12',
            MAX_PERCENT: '0.3',
            MAX_COUNT: '2',
          },
        ],
        SP_GRID: [
          {
            TRIGGER_PERCENT: '0.6',
            MIN_PERCENT: 0.2,
          },
          {
            TRIGGER_PERCENT: '0.6',
            MIN_PERCENT: 0.15,
          },
          {
            TRIGGER_PERCENT: '0.6',
            MIN_PERCENT: 0.13,
          },
          {
            TRIGGER_PERCENT: '0.6',
            MIN_PERCENT: 0.12,
          },
          {
            TRIGGER_PERCENT: '0.6',
            MIN_PERCENT: 0.1,
          },
          {
            TRIGGER_PERCENT: '0.6',
            MIN_PERCENT: 0.1,
          },
        ],
        SL_PERCENT: '-9',
        TRADES_TILL_STOP: '1000',
        DATETIME_RANGE: ['2020-11-03T15:04:54.081Z', '2020-11-19T15:04:54.081Z'],
        AUTO_START: false,
        TRADES_COUNT: 0,
      },
      {
        SYMBOL: 'ETHUSDT',
        AMOUNT: '0.2',
        PRICE_TYPE: 'bb-mid',
        SIDE: 'LONG',
        GRID: [
          {
            PRICE_STEP: '2',
            X_AMOUNT: 1,
          },
          {
            PRICE_STEP: '2',
            X_AMOUNT: 3,
          },
          {
            PRICE_STEP: '5',
            X_AMOUNT: 3,
          },
          {
            PRICE_STEP: '6',
            X_AMOUNT: 1.6,
          },
          {
            PRICE_STEP: '8',
            X_AMOUNT: 1.6,
          },
          {
            PRICE_STEP: '12',
            X_AMOUNT: 2,
          },
        ],
        TP_GRID: [
          {
            MIN_PERCENT: 0.25,
            MAX_PERCENT: '2',
            MAX_COUNT: '5',
          },
          {
            MIN_PERCENT: 0.2,
            MAX_PERCENT: '1.5',
            MAX_COUNT: '5',
          },
          {
            MIN_PERCENT: 0.18,
            MAX_PERCENT: '1.3',
            MAX_COUNT: '4',
          },
          {
            MIN_PERCENT: 0.14,
            MAX_PERCENT: '1',
            MAX_COUNT: 4,
          },
          {
            MIN_PERCENT: 0.11,
            MAX_PERCENT: '0.6',
            MAX_COUNT: 3,
          },
          {
            MIN_PERCENT: 0.1,
            MAX_PERCENT: 0.3,
            MAX_COUNT: 3,
          },
        ],
        SP_GRID: [
          {
            TRIGGER_PERCENT: '0.5',
            MIN_PERCENT: '0.4',
          },
          {
            TRIGGER_PERCENT: '0.4',
            MIN_PERCENT: '0.3',
          },
          {
            TRIGGER_PERCENT: '0.3',
            MIN_PERCENT: '0.2',
          },
          {
            TRIGGER_PERCENT: '0.25',
            MIN_PERCENT: '0.15',
          },
          {
            TRIGGER_PERCENT: 0.13,
            MIN_PERCENT: 0.1,
          },
          {
            TRIGGER_PERCENT: 0.12,
            MIN_PERCENT: 0.1,
          },
        ],
        SL_PERCENT: '-4',
        TRADES_TILL_STOP: '1000',
        DATETIME_RANGE: ['2020-11-10T05:34:21.023Z', '2021-11-30T05:34:21.023Z'],
        PRICE_DISTANCE: '0.05',
        AUTO_START: false,
        TRADES_COUNT: 0,
      },
      {
        SYMBOL: 'KAVAUSDT',
        AMOUNT: '5',
        PRICE_TYPE: 'distance',
        PRICE_DISTANCE: '0.0001',
        SIDE: 'LONG',
        GRID: [
          {
            PRICE_STEP: '0.025',
            X_AMOUNT: 1,
          },
          {
            PRICE_STEP: '0.03',
            X_AMOUNT: '2',
          },
          {
            PRICE_STEP: '0.04',
            X_AMOUNT: '3',
          },
          {
            PRICE_STEP: '0.07',
            X_AMOUNT: '1.6',
          },
          {
            PRICE_STEP: '0.09',
            X_AMOUNT: '1.6',
          },
          {
            PRICE_STEP: '0.12',
            X_AMOUNT: 2,
          },
        ],
        TP_GRID: [
          {
            MIN_PERCENT: '0.5',
            MAX_PERCENT: '5',
            MAX_COUNT: '4',
          },
          {
            MIN_PERCENT: '0.4',
            MAX_PERCENT: '3',
            MAX_COUNT: '4',
          },
          {
            MIN_PERCENT: '0.3',
            MAX_PERCENT: '2.5',
            MAX_COUNT: '4',
          },
          {
            MIN_PERCENT: '0.25',
            MAX_PERCENT: '2',
            MAX_COUNT: 4,
          },
          {
            MIN_PERCENT: 0.11,
            MAX_PERCENT: '1',
            MAX_COUNT: 3,
          },
          {
            MIN_PERCENT: 0.1,
            MAX_PERCENT: '0.5',
            MAX_COUNT: 3,
          },
        ],
        SP_GRID: [
          {
            TRIGGER_PERCENT: '2',
            MIN_PERCENT: '0.1',
          },
          {
            TRIGGER_PERCENT: '2',
            MIN_PERCENT: '0.1',
          },
          {
            TRIGGER_PERCENT: '2',
            MIN_PERCENT: '0.1',
          },
          {
            TRIGGER_PERCENT: '1.5',
            MIN_PERCENT: '0.1',
          },
          {
            TRIGGER_PERCENT: 0.13,
            MIN_PERCENT: 0.1,
          },
          {
            TRIGGER_PERCENT: 0.12,
            MIN_PERCENT: 0.1,
          },
        ],
        SL_PERCENT: '-7',
        TRADES_TILL_STOP: '1000',
        DATETIME_RANGE: ['2020-11-01T05:59:44.638Z', '2021-11-30T05:59:44.638Z'],
        AUTO_START: false,
        TRADES_COUNT: 0,
      },
      {
        SYMBOL: 'SUSHIUSDT',
        SIDE: 'LONG',
        AMOUNT: '2',
        PRICE_TYPE: 'bb',
        PRICE_DISTANCE: '0.0002',
        GRID: [
          {
            PRICE_STEP: '0.025',
            X_AMOUNT: 1,
          },
          {
            PRICE_STEP: '0.025',
            X_AMOUNT: 3,
          },
          {
            PRICE_STEP: '0.05',
            X_AMOUNT: 3,
          },
          {
            PRICE_STEP: '0.09',
            X_AMOUNT: 1.6,
          },
          {
            PRICE_STEP: '0.1',
            X_AMOUNT: 1.6,
          },
          {
            PRICE_STEP: '0.13',
            X_AMOUNT: 2,
          },
        ],
        TP_GRID: [
          {
            MIN_PERCENT: '0.25',
            MAX_PERCENT: '1.5',
            MAX_COUNT: 6,
          },
          {
            MIN_PERCENT: 0.2,
            MAX_PERCENT: '2',
            MAX_COUNT: 6,
          },
          {
            MIN_PERCENT: 0.18,
            MAX_PERCENT: '1',
            MAX_COUNT: 5,
          },
          {
            MIN_PERCENT: 0.14,
            MAX_PERCENT: '0.8',
            MAX_COUNT: 4,
          },
          {
            MIN_PERCENT: 0.11,
            MAX_PERCENT: 0.4,
            MAX_COUNT: 3,
          },
          {
            MIN_PERCENT: 0.1,
            MAX_PERCENT: 0.3,
            MAX_COUNT: 3,
          },
        ],
        SP_GRID: [
          {
            TRIGGER_PERCENT: 0.25,
            MIN_PERCENT: 0.2,
          },
          {
            TRIGGER_PERCENT: 0.2,
            MIN_PERCENT: 0.15,
          },
          {
            TRIGGER_PERCENT: 0.2,
            MIN_PERCENT: 0.13,
          },
          {
            TRIGGER_PERCENT: 0.2,
            MIN_PERCENT: 0.12,
          },
          {
            TRIGGER_PERCENT: 0.13,
            MIN_PERCENT: 0.1,
          },
          {
            TRIGGER_PERCENT: 0.12,
            MIN_PERCENT: 0.1,
          },
        ],
        SL_PERCENT: '-15',
        TRADES_TILL_STOP: '1000',
        DATETIME_RANGE: ['2020-11-01T08:18:27.674Z', '2021-11-30T08:18:27.674Z'],
        AUTO_START: false,
      },
      {
        SYMBOL: 'ZECUSDT',
        SIDE: 'LONG',
        AMOUNT: '0.5',
        PRICE_TYPE: 'distance',
        PRICE_DISTANCE: '0.01',
        GRID: [
          {
            PRICE_STEP: '0.45',
            X_AMOUNT: 1,
          },
          {
            PRICE_STEP: '0.6',
            X_AMOUNT: 3,
          },
          {
            PRICE_STEP: '1',
            X_AMOUNT: 3,
          },
          {
            PRICE_STEP: '1.5',
            X_AMOUNT: 1.6,
          },
          {
            PRICE_STEP: '2.1',
            X_AMOUNT: 1.6,
          },
          {
            PRICE_STEP: '4',
            X_AMOUNT: 2,
          },
        ],
        TP_GRID: [
          {
            MIN_PERCENT: '0.3',
            MAX_PERCENT: '2',
            MAX_COUNT: 6,
          },
          {
            MIN_PERCENT: '0.3',
            MAX_PERCENT: '1.5',
            MAX_COUNT: 6,
          },
          {
            MIN_PERCENT: '0.25',
            MAX_PERCENT: '1',
            MAX_COUNT: 5,
          },
          {
            MIN_PERCENT: 0.14,
            MAX_PERCENT: 0.5,
            MAX_COUNT: 4,
          },
          {
            MIN_PERCENT: 0.11,
            MAX_PERCENT: 0.4,
            MAX_COUNT: 3,
          },
          {
            MIN_PERCENT: 0.1,
            MAX_PERCENT: 0.3,
            MAX_COUNT: 3,
          },
        ],
        SP_GRID: [
          {
            TRIGGER_PERCENT: '0.6',
            MIN_PERCENT: 0.2,
          },
          {
            TRIGGER_PERCENT: '0.5',
            MIN_PERCENT: 0.15,
          },
          {
            TRIGGER_PERCENT: '0.4',
            MIN_PERCENT: 0.13,
          },
          {
            TRIGGER_PERCENT: 0.2,
            MIN_PERCENT: 0.12,
          },
          {
            TRIGGER_PERCENT: 0.13,
            MIN_PERCENT: 0.1,
          },
          {
            TRIGGER_PERCENT: 0.12,
            MIN_PERCENT: 0.1,
          },
        ],
        SL_PERCENT: '-7',
        TRADES_TILL_STOP: '1000',
        DATETIME_RANGE: ['2020-11-09T19:07:54.091Z', '2021-11-18T19:07:54.091Z'],
        AUTO_START: false,
        TRADES_COUNT: 0,
      },
      {
        SYMBOL: 'BNBUSDT',
        SIDE: 'LONG',
        AMOUNT: '0.5',
        PRICE_TYPE: 'distance',
        PRICE_DISTANCE: '0.01',
        GRID: [
          {
            PRICE_STEP: '0.13',
            X_AMOUNT: 1,
          },
          {
            PRICE_STEP: '0.16',
            X_AMOUNT: 3,
          },
          {
            PRICE_STEP: '0.3',
            X_AMOUNT: 3,
          },
          {
            PRICE_STEP: '0.5',
            X_AMOUNT: 1.6,
          },
          {
            PRICE_STEP: '0.6',
            X_AMOUNT: 1.6,
          },
          {
            PRICE_STEP: '0.9',
            X_AMOUNT: 2,
          },
        ],
        TP_GRID: [
          {
            MIN_PERCENT: 0.25,
            MAX_PERCENT: '3',
            MAX_COUNT: 6,
          },
          {
            MIN_PERCENT: 0.2,
            MAX_PERCENT: '2',
            MAX_COUNT: 6,
          },
          {
            MIN_PERCENT: 0.18,
            MAX_PERCENT: '1',
            MAX_COUNT: 5,
          },
          {
            MIN_PERCENT: 0.14,
            MAX_PERCENT: 0.5,
            MAX_COUNT: 4,
          },
          {
            MIN_PERCENT: 0.11,
            MAX_PERCENT: 0.4,
            MAX_COUNT: 3,
          },
          {
            MIN_PERCENT: 0.1,
            MAX_PERCENT: 0.3,
            MAX_COUNT: 3,
          },
        ],
        SP_GRID: [
          {
            TRIGGER_PERCENT: '0.5',
            MIN_PERCENT: 0.2,
          },
          {
            TRIGGER_PERCENT: '0.4',
            MIN_PERCENT: 0.15,
          },
          {
            TRIGGER_PERCENT: '0.3',
            MIN_PERCENT: 0.13,
          },
          {
            TRIGGER_PERCENT: 0.2,
            MIN_PERCENT: 0.12,
          },
          {
            TRIGGER_PERCENT: 0.13,
            MIN_PERCENT: 0.1,
          },
          {
            TRIGGER_PERCENT: 0.12,
            MIN_PERCENT: 0.1,
          },
        ],
        SL_PERCENT: '-5',
        TRADES_TILL_STOP: '1000',
        DATETIME_RANGE: ['2020-11-01T19:56:49.603Z', '2021-11-01T19:56:49.603Z'],
        AUTO_START: false,
        TRADES_COUNT: 0,
      },
      {
        SYMBOL: 'BNBUSDT',
        SIDE: 'SHORT',
        AMOUNT: '0.5',
        PRICE_TYPE: 'distance',
        PRICE_DISTANCE: '0.01',
        GRID: [
          {
            PRICE_STEP: '0.13',
            X_AMOUNT: 1,
          },
          {
            PRICE_STEP: '0.16',
            X_AMOUNT: 3,
          },
          {
            PRICE_STEP: '0.3',
            X_AMOUNT: 3,
          },
          {
            PRICE_STEP: '0.5',
            X_AMOUNT: 1.6,
          },
          {
            PRICE_STEP: '0.6',
            X_AMOUNT: 1.6,
          },
          {
            PRICE_STEP: '0.9',
            X_AMOUNT: 2,
          },
        ],
        TP_GRID: [
          {
            MIN_PERCENT: 0.25,
            MAX_PERCENT: '3',
            MAX_COUNT: 6,
          },
          {
            MIN_PERCENT: 0.2,
            MAX_PERCENT: '2',
            MAX_COUNT: 6,
          },
          {
            MIN_PERCENT: 0.18,
            MAX_PERCENT: '1',
            MAX_COUNT: 5,
          },
          {
            MIN_PERCENT: 0.14,
            MAX_PERCENT: 0.5,
            MAX_COUNT: 4,
          },
          {
            MIN_PERCENT: 0.11,
            MAX_PERCENT: 0.4,
            MAX_COUNT: 3,
          },
          {
            MIN_PERCENT: 0.1,
            MAX_PERCENT: 0.3,
            MAX_COUNT: 3,
          },
        ],
        SP_GRID: [
          {
            TRIGGER_PERCENT: '0.5',
            MIN_PERCENT: 0.2,
            TRAILING: true,
          },
          {
            TRIGGER_PERCENT: '0.4',
            MIN_PERCENT: 0.15,
            TRAILING: true,
          },
          {
            TRIGGER_PERCENT: '0.3',
            MIN_PERCENT: 0.13,
            TRAILING: true,
          },
          {
            TRIGGER_PERCENT: 0.2,
            MIN_PERCENT: 0.12,
            TRAILING: true,
          },
          {
            TRIGGER_PERCENT: 0.13,
            MIN_PERCENT: 0.1,
            TRAILING: true,
          },
          {
            TRIGGER_PERCENT: 0.12,
            MIN_PERCENT: 0.1,
            TRAILING: true,
          },
        ],
        SL_PERCENT: '-5',
        TRADES_TILL_STOP: '1000',
        DATETIME_RANGE: ['2020-11-01T19:56:49.603Z', '2021-11-01T19:56:49.603Z'],
        AUTO_START: false,
        TRADES_COUNT: 0,
      },
    ],
    APIKEY: '',
    APISECRET: '',
    TELEGRAM_BOT_TOKEN: '',
    TELEGRAM_USER_ID: '',
    TELEGRAM_AUTO_START: false,
    STOP_LONG: false,
    STOP_SHORT: false,
    TELEGRAM_NOTIFY_NEW_POS: true,
    TELEGRAM_NOTIFY_INCREASE_POS: true,
    TELEGRAM_NOTIFY_DECREASE_POS: true,
    TELEGRAM_NOTIFY_CLOSE_POS: true,
  },
})

const app = electron.app
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const isDev = require('electron-is-dev')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    idth: 900,
    height: 680,
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true,
    },
  })
  mainWindow.loadURL(
    isDev ? 'http://localhost:3009' : `file://${path.join(__dirname, '../../build/index.html')}`,
  )
  if (isDev) {
    // Open the DevTools.
    //BrowserWindow.addDevToolsExtension('<location to your react chrome extension>');
    mainWindow.webContents.openDevTools()
  }
  mainWindow.on('closed', () => (mainWindow = null))
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
ipcMain.on('takeProfitOrder', (event, index, percent) => {
  takeProfitOrder(index, percent, mainWindow.webContents)
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
