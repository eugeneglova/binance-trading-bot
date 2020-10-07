# Binance Futures Auto Trading Bot

To run just download and install [Node.js](https://nodejs.org/)

## Install dependencies

```sh
npm install
```

## Set up Binance Futures Position Mode

Make sure you set Position Mode to Hedge Mode on your Binance Futures account.

## Set up configuration file

Open `config/default.json` file and add your API keys

```sh
  "APIKEY": "",
  "APISECRET": "",
```

## Run bot

To start `BTCUSDT` `LONG` trading just run this

```sh
npm run btc-long
```

you can use also `npm run btc-short`, `npm run eth-long` or `npm run eth-short`

All settings could be found in `config/btc-long.json`, `config/btc-short.json` etc.

# Configuration settings

* `APIKEY` - API key for your binance futures account
* `APISECRET` - API secret for your binance futures account
* `SYMBOL` - binance futures trading pair symbol
* `SIDE` - position side `LONG` or `SHORT`
* `MIN_AMOUNT` - min amount on trading pair
* `AMOUNT` - first order size
* `X_PRICE` - grid for next orders, for example `[10, 20, 30]` for `LONG` if current price is 10000, orders may be `9998`, `9988`, `9968`, `9938`, `9908` etc.
* `X_AMOUNT` - how order size will grow, for example `[1, 2, 3]` order sizes may be `0.002`, `0.004`, `0.012`, `0.036` etc.
* `ORDERS` - number of orders in grid
* `TP_PERCENT` - take profit percentage
* `SP_PERCENT` - stop protif percentage
* `SP_PERCENT_TRIGGER` - profit percentage when we need to create stop profit order
* `SL_PERCENT` - stop loss percentage
* `TRADES_TILL_STOP` - number of trades for run session

