const Binance = require('node-binance-api-ext')
const Store = require('electron-store')
const _ = require('lodash')
const moment = require('moment')

const {
  precision,
  getPLPrice,
  getPLPerc,
  getOrders,
  getOrdersAmount,
  getTpOrders,
  getNextPrice,
  getPosSize,
} = require('./functions')

const start = async (contents) => {
  const store = new Store()
  let config = store.get()
  let BOT_SIDE_SIGN = config.SIDE === 'SHORT' ? -1 : 1

  setInterval(() => {
    config = store.get()
  }, 10 * 1000)

  const state = {
    lOrders: [],
    tpOrders: [],
    slOrder: null,
  }

  const binance = Binance({
    APIKEY: config.APIKEY,
    APISECRET: config.APISECRET,
  })

  const cancelOrders = async () => {
    const allOpenOrders = await binance.futures
      .openOrders(config.SYMBOL)
      .catch((e) => console.error(new Error().stack) || console.error(e))
    const orders = _.filter(allOpenOrders, (o) => o.positionSide === config.SIDE)
    // console.log(orders)
    return Promise.allSettled(
      orders.map(({ orderId }) =>
        binance.futures
          .cancel(config.SYMBOL, { orderId })
          .catch((e) => console.error(new Error().stack) || console.error(e)),
      ),
    )
  }

  const createOrders = async () => {
    const quote = await binance.futures
      .quote(config.SYMBOL)
      .catch((e) => console.error(new Error().stack) || console.error(e))
    const topBookPrice = parseFloat(BOT_SIDE_SIGN > 0 ? quote.bidPrice : quote.askPrice)
    const price = config.PRICE_TYPE === 'distance'
      ? getNextPrice(topBookPrice, 0, BOT_SIDE_SIGN, [
        { PRICE_STEP: config.PRICE_DISTANCE },
      ])
      : BOT_SIDE_SIGN > 0 ? Math.min(config.PRICE, topBookPrice) : Math.max(config.PRICE, topBookPrice)
    console.log({ price, topBookPrice })
    const amount = BOT_SIDE_SIGN * config.AMOUNT
    const orders = getOrders({
      price,
      amount,
      count: config.GRID.length + 1,
      sideSign: BOT_SIDE_SIGN,
      grid: config.GRID,
      pricePrecision: state.pricePrecision,
      quantityPrecision: state.quantityPrecision,
    })
    console.log(orders)
    console.log('create orders')
    await Promise.allSettled(
      _.map(orders, (o) =>
        binance.futures[BOT_SIDE_SIGN > 0 ? 'buy' : 'sell'](config.SYMBOL, Math.abs(o.amount), o.price, {
          positionSide: config.SIDE,
          postOnly: true,
        }).catch((e) => console.error(new Error().stack) || console.error(e)),
      ),
    )
  }

  const createTpOrders = async () => {
    const p = state.position
    const minPrice = getPLPrice(parseFloat(p.entryPrice), config.TP_MIN_PERCENT, BOT_SIDE_SIGN)
    const maxPrice = getPLPrice(parseFloat(p.entryPrice), config.TP_MAX_PERCENT, BOT_SIDE_SIGN)
    const orders = getTpOrders({
      amount: parseFloat(p.positionAmt),
      minAmount: 1 / Math.pow(10, state.quantityPrecision),
      minPrice,
      maxPrice,
      sideSign: BOT_SIDE_SIGN,
      maxOrders: config.TP_MAX_COUNT,
      pricePrecision: state.pricePrecision,
      quantityPrecision: state.quantityPrecision,
    })
    console.log(orders)
    console.log('create tp orders')
    await Promise.allSettled(
      _.map(orders, (o) =>
        binance.futures[BOT_SIDE_SIGN < 0 ? 'buy' : 'sell'](config.SYMBOL, Math.abs(o.amount), o.price, {
          positionSide: config.SIDE,
        }).catch((e) => console.error(new Error().stack) || console.error(e)),
      ),
    )
  }

  const onPositionNew = () => {
    console.log('NEW POS')
    createTpOrders()
  }

  const onPositionUpdate = async () => {
    // console.log('UPDATE POS')
    const p = state.position
    // console.log(p)
    contents.send('onPositionUpdate', state)
    const plPerc = getPLPerc(p.entryPrice, p.markPrice, BOT_SIDE_SIGN)
    if (!state.lOrders.length) {
      await (async () => {
        console.log('getting limit orders')
        const allOpenOrders = await binance.futures
          .openOrders(config.SYMBOL)
          .catch((e) => console.error(new Error().stack) || console.error(e))
        const lSide = BOT_SIDE_SIGN > 0 ? 'BUY' : 'SELL'
        const orders = _.filter(
          allOpenOrders,
          (o) => o.positionSide === config.SIDE && o.type === 'LIMIT' && o.side === lSide,
        )
        if (!orders.length) return
        // console.log(orders)
        orders.forEach((order, i) => {
          console.log(`l ${i + 1}:`, order.origQty, order.price)
        })
        state.lOrders = orders
      })()
    }
    if (!state.tpOrders.length) {
      await (async () => {
        console.log('getting tp orders')
        const allOpenOrders = await binance.futures
          .openOrders(config.SYMBOL)
          .catch((e) => console.error(new Error().stack) || console.error(e))
        const tpSide = BOT_SIDE_SIGN < 0 ? 'BUY' : 'SELL'
        const orders = _.filter(
          allOpenOrders,
          (o) => o.positionSide === config.SIDE && o.type === 'LIMIT' && o.side === tpSide,
        )
        if (!orders.length) return
        // console.log(orders)
        orders.forEach((order, i) => {
          console.log(`tp ${i + 1}:`, order.origQty, order.price)
        })
        state.tpOrders = orders
      })()
    }
    if (!state.spOrder && plPerc > config.SP_PERCENT) {
      await (async () => {
        console.log('getting sp order')
        const allOpenOrders = await binance.futures
          .openOrders(config.SYMBOL)
          .catch((e) => console.error(new Error().stack) || console.error(e))
        const spSide = BOT_SIDE_SIGN < 0 ? 'BUY' : 'SELL'
        const order = _.find(
          allOpenOrders,
          (o) =>
            o.positionSide === config.SIDE &&
            o.type === 'STOP_MARKET' &&
            o.side === spSide &&
            Math.sign(parseFloat(o.stopPrice) - parseFloat(p.entryPrice)) === BOT_SIDE_SIGN,
        )
        if (!order) return
        console.log('sp:', order.origQty, order.stopPrice)
        state.spOrder = order
      })()
    }
    if (!state.slOrder) {
      await (async () => {
        console.log('getting sl order')
        const allOpenOrders = await binance.futures
          .openOrders(config.SYMBOL)
          .catch((e) => console.error(new Error().stack) || console.error(e))
        const slSide = BOT_SIDE_SIGN < 0 ? 'BUY' : 'SELL'
        const order = _.find(
          allOpenOrders,
          (o) =>
            o.positionSide === config.SIDE &&
            o.type === 'STOP_MARKET' &&
            o.side === slSide &&
            Math.sign(parseFloat(o.stopPrice) - parseFloat(p.entryPrice)) !== BOT_SIDE_SIGN,
        )
        if (!order) return
        console.log('sl:', order.origQty, order.stopPrice)
        state.slOrder = order
      })()
    }

    const diff = plPerc - config.SP_PERCENT_TRIGGER
    const plus = diff > 0 ? diff : 0
    const spPrice = precision(
      getPLPrice(parseFloat(p.entryPrice), config.SP_PERCENT + plus, BOT_SIDE_SIGN),
      state.pricePrecision,
    )

    // const posSize = Math.log(Math.abs(parseFloat(p.positionAmt)) / AMOUNT) / Math.log(2) + 1
    const posSize = getPosSize(parseFloat(p.positionAmt), config.AMOUNT, config.GRID.length + 1, config.GRID)
    // make tp closer to base price to minimize risks after 3rd order
    const numOfRiskOrders = 3
    const tpDistanceCoefficient =
      posSize > numOfRiskOrders ? 1 / (posSize - numOfRiskOrders / 2) : 1
    const price = precision(
      getPLPrice(p.entryPrice, (config.TP_MAX_PERCENT + plus) * tpDistanceCoefficient, BOT_SIDE_SIGN),
      state.pricePrecision,
    )
    const amount = Math.max(Math.abs(parseFloat(p.positionAmt)), 1 / Math.pow(10, state.quantityPrecision))

    const minLOrder = _.minBy(state.lOrders, (o) => parseFloat(o.origQty))
    const minLOrderSize =
      minLOrder && Math.log(Math.abs(minLOrder.origQty) / config.AMOUNT) / Math.log(2) + 1
    // when pos size less than closest limit order we need update orders
    // console.log({ minLOrderSize , posSize, c1: minLOrderSize - posSize })
    // if (minLOrderSize - posSize >= 1 && posSize >= 1) {
    if (minLOrderSize - posSize >= 1.7 && posSize >= 1) {
      await Promise.allSettled(
        state.lOrders.map(({ orderId }) =>
          binance.futures
            .cancel(config.SYMBOL, { orderId })
            .catch((e) => console.error(new Error().stack) || console.error(e)),
        ),
      ).then(async () => {
        console.log('cancelled limit orders')
        const amount = config.AMOUNT
        const orders = getOrders({
          price: p.entryPrice,
          amount,
          count: config.GRID.length + 1,
          sideSign: BOT_SIDE_SIGN,
          start: Math.ceil(posSize) - 1,
          grid: config.GRID,
          pricePrecision: state.pricePrecision,
          quantityPrecision: state.quantityPrecision,
        })
        orders.shift()
        console.log('create orders')
        await Promise.all(
          _.map(orders, (o) =>
            binance.futures[BOT_SIDE_SIGN > 0 ? 'buy' : 'sell'](
              config.SYMBOL,
              Math.abs(o.amount),
              o.price,
              {
                positionSide: config.SIDE,
                postOnly: true,
              },
            ).catch((e) => console.error(new Error().stack) || console.error(e)),
          ),
        )
        state.lOrders = []
      })
    }
    if (
      !state.tpOrders.length ||
      (state.tpOrders.length &&
        Math.abs(precision(getOrdersAmount(state.tpOrders), state.quantityPrecision)) <
          Math.abs(precision(parseFloat(p.positionAmt), state.quantityPrecision)))
    ) {
      await Promise.allSettled(
        state.tpOrders.map(({ orderId }) =>
          binance.futures
            .cancel(config.SYMBOL, { orderId })
            .catch((e) => console.error(new Error().stack) || console.error(e)),
        ),
      )
      await createTpOrders()
      state.tpOrders = []
      state.lOrders = []
    }

    console.log(
      'p',
      parseFloat(p.positionAmt),
      p.entryPrice,
      precision(p.unRealizedProfit),
      '(',
      precision(plPerc),
      '%)',
      `[${config.TRADES_COUNT}/${config.TRADES_TILL_STOP}]`,
    )
    if (state.spOrder) {
      console.log('sp', spPrice, diff)
    }
    if (!state.spOrder && diff > 0) {
      console.log('create sp order', { spPrice, amount })
      await binance.futures[BOT_SIDE_SIGN < 0 ? 'stopMarketBuy' : 'stopMarketSell'](
        config.SYMBOL,
        Math.abs(amount),
        spPrice,
        {
          positionSide: config.SIDE,
        },
      ).catch((e) => console.error(new Error().stack) || console.error(e))
    }

    if (
      state.spOrder &&
      plPerc > config.SP_PERCENT &&
      (parseFloat(state.spOrder.origQty) !== Math.abs(parseFloat(p.positionAmt)) ||
        parseFloat(state.spOrder.stopPrice) !== spPrice)
    ) {
      console.log('update sp order', amount, spPrice)
      binance.futures
        .cancel(config.SYMBOL, { orderId: state.spOrder.orderId })
        .catch((e) => console.log(e))
      binance.futures[BOT_SIDE_SIGN < 0 ? 'stopMarketBuy' : 'stopMarketSell'](
        config.SYMBOL,
        Math.abs(amount),
        spPrice,
        {
          positionSide: config.SIDE,
        },
      ).catch((e) => console.log(e))
      state.spOrder = null
    }

    const slPrice = precision(
      getPLPrice(parseFloat(p.entryPrice), config.SL_PERCENT, BOT_SIDE_SIGN),
      state.pricePrecision,
    )
    if (!state.slOrder) {
      console.log('create sl order', amount, slPrice)
      await binance.futures[BOT_SIDE_SIGN < 0 ? 'stopMarketBuy' : 'stopMarketSell'](
        config.SYMBOL,
        Math.abs(amount),
        slPrice,
        {
          positionSide: config.SIDE,
        },
      ).catch((e) => console.error(new Error().stack) || console.error(e))
    } else if (
      state.slOrder &&
      (parseFloat(state.slOrder.stopPrice) !== slPrice ||
        parseFloat(state.slOrder.origQty) !== amount)
    ) {
      console.log({
        p: state.slOrder.stopPrice,
        p1: slPrice,
        a: state.slOrder.origQty,
        a1: amount,
      })
      console.log('update sl order', amount, slPrice)
      await binance.futures
        .cancel(config.SYMBOL, { orderId: state.slOrder.orderId })
        .catch((e) => console.error(new Error().stack) || console.error(e))
      binance.futures[BOT_SIDE_SIGN < 0 ? 'stopMarketBuy' : 'stopMarketSell'](
        config.SYMBOL,
        Math.abs(amount),
        slPrice,
        {
          positionSide: config.SIDE,
        },
      ).catch((e) => console.error(new Error().stack) || console.error(e))
      state.slOrder = null
      state.lOrders = []
    }
  }

  const onPositionClose = async () => {
    console.log('CLOSE POS')
    state.lOrders = []
    state.tpOrders = []
    state.slOrder = null
    cancelOrders()
    store.set({ TRADES_COUNT: config.TRADES_COUNT + 1 })
    config = store.get()
  }

  const accountUpdate = async (data) => {
    console.log('account update')
    if (data.a.m !== 'ORDER') return

    const positions = await binance.futures
      .positionRisk()
      .catch((e) => console.error(new Error().stack) || console.error(e))
    const p = _.find(positions, { symbol: config.SYMBOL, positionSide: config.SIDE })
    if (parseFloat(p.positionAmt) !== 0) {
      if (!state.position) {
        state.position = p
        onPositionNew()
      } else {
        state.position = p
        onPositionUpdate()
      }
    } else if (state.position) {
      state.position = null
      onPositionClose()
    }
  }

  const orderTradeUpdate = async (data) => {
    console.log('order trade update')
  }

  const userFuturesDataHandler = (data) => {
    const type = data.e
    if (type === 'listenKeyExpired') {
      console.log('listenKeyExpired reconnect')
      connect()
    } else if (type === 'ACCOUNT_UPDATE') {
      accountUpdate(data)
    } else if (type === 'ORDER_TRADE_UPDATE') {
      orderTradeUpdate(data)
    } else if (type === 'MARGIN_CALL') {
    } else {
      console.error('Unexpected userFuturesData: ' + type)
    }
  }

  const getDataStream = async () => {
    console.log('get data stream')
    const dataStream = await binance.futures
      .getDataStream()
      .catch((e) => console.error(new Error().stack) || console.error(e))
    console.log('listenKey', dataStream.listenKey)
    return dataStream
  }

  const keepAliveIntervalId = setInterval(() => {
    console.log('keep alive')
    getDataStream()
  }, 59 * 60 * 1000)

  const connect = async function reconnect() {
    console.log('connect')
    const { listenKey } = await getDataStream()
    binance.webSocket.futuresSubscribeSingle(listenKey, userFuturesDataHandler, reconnect)
  }
  connect()

  const checkPositions = async () => {
    await binance.useServerTime()
    const positions = await binance.futures
      .positionRisk()
      .catch((e) => console.error(new Error().stack) || console.error(e))
    const p = _.find(positions, { symbol: config.SYMBOL, positionSide: config.SIDE })
    // console.log(p)
    if (p && parseFloat(p.positionAmt) !== 0) {
      state.position = p
      onPositionUpdate()
    }
  }

  // start
  await binance.useServerTime()
  const info = await binance.futures.exchangeInfo()
  const { pricePrecision, quantityPrecision } = info.symbols.find((item) => item.symbol === config.SYMBOL)
  state.pricePrecision = pricePrecision
  state.quantityPrecision = quantityPrecision
  const positions = await binance.futures
    .positionRisk()
    .catch((e) => console.error(new Error().stack) || console.error(e))
  const p = _.find(positions, { symbol: config.SYMBOL, positionSide: config.SIDE })
  if (!p) {
    console.error('Please set Position Mode to Hedge Mode')
    process.exit(0)
  }
  // console.log(p)
  if (parseFloat(p.positionAmt) !== 0) {
    state.position = p
  } else {
    await cancelOrders()
    createOrders()
  }
  const checkPositionsIntervalId = setInterval(() => checkPositions(), 15 * 1000)
  checkPositions()

  const createOrdersIntervalId = setInterval(async () => {
    if (state.position) return
    if (config.TRADES_COUNT >= config.TRADES_TILL_STOP) return
    if (moment().isBefore(config.DATETIME_RANGE[0]) || moment().isAfter(config.DATETIME_RANGE[1])) return
    console.log('create orders by position timeout')
    await cancelOrders()
    createOrders()
  }, 2 * 60 * 1000)

  const stop = async () => {
    state.lOrders = []
    state.tpOrders = []
    state.slOrder = null
    clearInterval(keepAliveIntervalId)
    clearInterval(checkPositionsIntervalId)
    clearInterval(createOrdersIntervalId)
    console.log('disconnect')
    const { listenKey } = await getDataStream()
    binance.webSocket.futuresTerminate(listenKey)
  }

  return stop
}

module.exports = start
