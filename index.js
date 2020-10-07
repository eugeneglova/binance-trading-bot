const Binance = require('node-binance-api-ext')
const _ = require('lodash')
const importFresh = require('import-fresh')

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

let {
  APIKEY,
  APISECRET,
  SYMBOL,
  SIDE,
  MIN_AMOUNT,
  AMOUNT,
  X_PRICE,
  X_AMOUNT,
  ORDERS,
  TP_PERCENT,
  SP_PERCENT,
  SP_PERCENT_TRIGGER,
  SL_PERCENT,
  TRADES_TILL_STOP,
} = require(`./${process.env.BINANCE_SETTINGS}`)

setInterval(() => {
  const settings = importFresh(`./${process.env.BINANCE_SETTINGS}`)
  AMOUNT = settings.AMOUNT
  X_PRICE = settings.X_PRICE
  X_AMOUNT = settings.X_AMOUNT
  ORDERS = settings.ORDERS
  TP_PERCENT = settings.TP_PERCENT
  SP_PERCENT = settings.SP_PERCENT
  SP_PERCENT_TRIGGER = settings.SP_PERCENT_TRIGGER
  SL_PERCENT = settings.SL_PERCENT
  TRADES_TILL_STOP = settings.TRADES_TILL_STOP
}, 10 * 1000)

const BOT_SIDE_SIGN = SIDE === 'SHORT' ? -1 : 1

const state = {
  lOrders: [],
  tpOrders: [],
  slOrder: null,
  tradesCount: 0,
}

const binance = Binance({
  APIKEY,
  APISECRET,
})

const cancelOrders = async () => {
  const allOpenOrders = await binance.futures
    .openOrders(SYMBOL)
    .catch((e) => console.error(new Error().stack) || console.error(e))
  const orders = _.filter(allOpenOrders, (o) => o.positionSide === SIDE)
  // console.log(orders)
  return Promise.allSettled(
    orders.map(({ orderId }) =>
      binance.futures
        .cancel(SYMBOL, { orderId })
        .catch((e) => console.error(new Error().stack) || console.error(e)),
    ),
  )
}

const createOrders = async () => {
  const quote = await binance.futures
    .quote(SYMBOL)
    .catch((e) => console.error(new Error().stack) || console.error(e))
  const topBookPrice = parseFloat(BOT_SIDE_SIGN > 0 ? quote.bidPrice : quote.askPrice)
  const price = getNextPrice(topBookPrice, 0, BOT_SIDE_SIGN, [_.first(X_PRICE) * 0.1])
  console.log({ price, topBookPrice })
  const amount = BOT_SIDE_SIGN * AMOUNT
  const orders = getOrders({
    price,
    amount,
    count: ORDERS,
    sideSign: BOT_SIDE_SIGN,
    xPrice: X_PRICE,
    xAmount: X_AMOUNT,
    pricePrecision: state.pricePrecision,
    quantityPrecision: state.quantityPrecision,
  })
  console.log(orders)
  console.log('create orders')
  // process.exit(0)
  try {
    await Promise.all(
      _.map(orders, (o) =>
        binance.futures[BOT_SIDE_SIGN > 0 ? 'buy' : 'sell'](SYMBOL, Math.abs(o.amount), o.price, {
          positionSide: SIDE,
          postOnly: true,
        }).catch((e) => console.error(new Error().stack) || console.error(e)),
      ),
    )
  } catch (e) {
    console.error(e)
  }
}

const createTpOrders = async () => {
  const p = state.position
  const maxPrice = getPLPrice(parseFloat(p.entryPrice), TP_PERCENT, BOT_SIDE_SIGN)
  const orders = getTpOrders({
    basePrice: parseFloat(p.entryPrice),
    amount: parseFloat(p.positionAmt),
    minAmount: MIN_AMOUNT,
    maxPrice,
    sideSign: BOT_SIDE_SIGN,
    maxOrders: ORDERS,
    pricePrecision: state.pricePrecision,
    quantityPrecision: state.quantityPrecision,
  })
  console.log(orders)
  try {
    await Promise.all(
      _.map(orders, (o) =>
        binance.futures[BOT_SIDE_SIGN < 0 ? 'buy' : 'sell'](SYMBOL, Math.abs(o.amount), o.price, {
          positionSide: SIDE,
        }).catch((e) => console.error(new Error().stack) || console.error(e)),
      ),
    )
  } catch (e) {
    console.error(e)
  }
}

const onPositionNew = () => {
  console.log('NEW POS')
  createTpOrders()
}

const onPositionUpdate = async () => {
  // console.log('UPDATE POS')
  const p = state.position
  // console.log(p)
  const plPerc = getPLPerc(p.entryPrice, p.markPrice, BOT_SIDE_SIGN)
  if (!state.lOrders.length) {
    await (async () => {
      console.log('getting limit orders')
      const allOpenOrders = await binance.futures
        .openOrders(SYMBOL)
        .catch((e) => console.error(new Error().stack) || console.error(e))
      const lSide = BOT_SIDE_SIGN > 0 ? 'BUY' : 'SELL'
      const orders = _.filter(
        allOpenOrders,
        (o) => o.positionSide === SIDE && o.type === 'LIMIT' && o.side === lSide,
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
        .openOrders(SYMBOL)
        .catch((e) => console.error(new Error().stack) || console.error(e))
      const tpSide = BOT_SIDE_SIGN < 0 ? 'BUY' : 'SELL'
      const orders = _.filter(
        allOpenOrders,
        (o) => o.positionSide === SIDE && o.type === 'LIMIT' && o.side === tpSide,
      )
      if (!orders.length) return
      // console.log(orders)
      orders.forEach((order, i) => {
        console.log(`tp ${i + 1}:`, order.origQty, order.price)
      })
      state.tpOrders = orders
    })()
  }
  if (!state.spOrder && plPerc > SP_PERCENT) {
    await (async () => {
      console.log('getting sp order')
      const allOpenOrders = await binance.futures
        .openOrders(SYMBOL)
        .catch((e) => console.error(new Error().stack) || console.error(e))
      const spSide = BOT_SIDE_SIGN < 0 ? 'BUY' : 'SELL'
      const order = _.find(
        allOpenOrders,
        (o) =>
          o.positionSide === SIDE &&
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
        .openOrders(SYMBOL)
        .catch((e) => console.error(new Error().stack) || console.error(e))
      const slSide = BOT_SIDE_SIGN < 0 ? 'BUY' : 'SELL'
      const order = _.find(
        allOpenOrders,
        (o) =>
          o.positionSide === SIDE &&
          o.type === 'STOP_MARKET' &&
          o.side === slSide &&
          Math.sign(parseFloat(o.stopPrice) - parseFloat(p.entryPrice)) !== BOT_SIDE_SIGN,
      )
      if (!order) return
      console.log('sl:', order.origQty, order.stopPrice)
      state.slOrder = order
    })()
  }

  const diff = plPerc - SP_PERCENT_TRIGGER
  const plus = diff > 0 ? diff : 0
  const spPrice = precision(
    getPLPrice(parseFloat(p.entryPrice), SP_PERCENT + plus, BOT_SIDE_SIGN),
    state.pricePrecision,
  )

  // const posSize = Math.log(Math.abs(parseFloat(p.positionAmt)) / AMOUNT) / Math.log(2) + 1
  const posSize = getPosSize(parseFloat(p.positionAmt), AMOUNT, ORDERS, X_AMOUNT)
  // make tp closer to base price to minimize risks after 3rd order
  const numOfRiskOrders = 3
  const tpDistanceCoefficient = posSize > numOfRiskOrders ? 1 / (posSize - numOfRiskOrders / 2) : 1
  const price = precision(
    getPLPrice(p.entryPrice, (TP_PERCENT + plus) * tpDistanceCoefficient, BOT_SIDE_SIGN),
    state.pricePrecision,
  )
  const amount = Math.max(Math.abs(parseFloat(p.positionAmt)), MIN_AMOUNT)

  const minLOrder = _.minBy(state.lOrders, (o) => parseFloat(o.origQty))
  const minLOrderSize =
    minLOrder && Math.log(Math.abs(minLOrder.origQty) / AMOUNT) / Math.log(2) + 1
  // when pos size less than closest limit order we need update orders
  // console.log({ minLOrderSize , posSize, c1: minLOrderSize - posSize })
  // if (minLOrderSize - posSize >= 1 && posSize >= 1) {
  if (minLOrderSize - posSize >= 1.7 && posSize >= 1) {
    Promise.allSettled(
      state.lOrders.map(({ orderId }) =>
        binance.futures
          .cancel(SYMBOL, { orderId })
          .catch((e) => console.error(new Error().stack) || console.error(e)),
      ),
    ).then(async () => {
      console.log('cancelled limit orders')
      const amount = AMOUNT
      const orders = getOrders({
        price: p.entryPrice,
        amount,
        count: ORDERS,
        sideSign: BOT_SIDE_SIGN,
        start: Math.ceil(posSize) - 1,
        xPrice: X_PRICE,
        xAmount: X_AMOUNT,
        pricePrecision: state.pricePrecision,
        quantityPrecision: state.quantityPrecision,
      })
      orders.shift()
      console.log('create orders')
      try {
        await Promise.all(
          _.map(orders, (o) =>
            binance.futures[BOT_SIDE_SIGN > 0 ? 'buy' : 'sell'](
              SYMBOL,
              Math.abs(o.amount),
              o.price,
              {
                positionSide: SIDE,
                postOnly: true,
              },
            ).catch((e) => console.error(new Error().stack) || console.error(e)),
          ),
        )
      } catch (e) {
        console.error(e)
      }
      state.lOrders = []
    })
  }
  if (
    !state.tpOrders.length ||
    (state.tpOrders.length &&
      Math.abs(precision(getOrdersAmount(state.tpOrders), state.quantityPrecision)) <
        Math.abs(precision(parseFloat(p.positionAmt), state.quantityPrecision)))
  ) {
    Promise.allSettled(
      state.tpOrders.map(({ orderId }) =>
        binance.futures
          .cancel(SYMBOL, { orderId })
          .catch((e) => console.error(new Error().stack) || console.error(e)),
      ),
    ).then(async () => {
      await createTpOrders()
      state.tpOrders = []
      state.lOrders = []
    })
  }

  console.log(
    'p',
    parseFloat(p.positionAmt),
    p.entryPrice,
    precision(p.unRealizedProfit),
    '(',
    precision(plPerc),
    '%)',
    `[${state.tradesCount}/${TRADES_TILL_STOP}]`,
  )
  if (state.spOrder) {
    console.log('sp', spPrice, diff)
  }
  if (!state.spOrder && diff > 0) {
    console.log('create sp order', { spPrice, amount })
    binance.futures[BOT_SIDE_SIGN < 0 ? 'stopMarketBuy' : 'stopMarketSell'](
      SYMBOL,
      Math.abs(amount),
      spPrice,
      {
        positionSide: SIDE,
      },
    ).catch((e) => console.error(new Error().stack) || console.error(e))
  }

  if (
    state.spOrder &&
    plPerc > SP_PERCENT &&
    (parseFloat(state.spOrder.origQty) !== Math.abs(parseFloat(p.positionAmt)) ||
      parseFloat(state.spOrder.stopPrice) !== spPrice)
  ) {
    console.log('update sp order', amount, spPrice)
    binance.futures.cancel(SYMBOL, { orderId: state.spOrder.orderId }).catch((e) => console.log(e))
    binance.futures[BOT_SIDE_SIGN < 0 ? 'stopMarketBuy' : 'stopMarketSell'](
      SYMBOL,
      Math.abs(amount),
      spPrice,
      {
        positionSide: SIDE,
      },
    ).catch((e) => console.log(e))
    state.spOrder = null
  }

  const slPrice = precision(
    getPLPrice(parseFloat(p.entryPrice), SL_PERCENT, BOT_SIDE_SIGN),
    state.pricePrecision,
  )
  if (!state.slOrder) {
    console.log('create sl order', amount, slPrice)
    binance.futures[BOT_SIDE_SIGN < 0 ? 'stopMarketBuy' : 'stopMarketSell'](
      SYMBOL,
      Math.abs(amount),
      slPrice,
      {
        positionSide: SIDE,
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
    binance.futures
      .cancel(SYMBOL, { orderId: state.slOrder.orderId })
      .catch((e) => console.error(new Error().stack) || console.error(e))
    binance.futures[BOT_SIDE_SIGN < 0 ? 'stopMarketBuy' : 'stopMarketSell'](
      SYMBOL,
      Math.abs(amount),
      slPrice,
      {
        positionSide: SIDE,
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
  state.tradesCount += 1
  cancelOrders()
}

const accountUpdate = async (data) => {
  console.log('account update')
  if (data.a.m !== 'ORDER') return

  const positions = await binance.futures
    .positionRisk()
    .catch((e) => console.error(new Error().stack) || console.error(e))
  const p = _.find(positions, { symbol: SYMBOL, positionSide: SIDE })
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
setInterval(() => {
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
  const p = _.find(positions, { symbol: SYMBOL, positionSide: SIDE })
  // console.log(p)
  if (p && parseFloat(p.positionAmt) !== 0) {
    state.position = p
    onPositionUpdate()
  }
}

!(async () => {
  await binance.useServerTime()
  const info = await binance.futures.exchangeInfo()
  const { pricePrecision, quantityPrecision } = info.symbols.find((item) => item.symbol === SYMBOL)
  state.pricePrecision = pricePrecision
  state.quantityPrecision = quantityPrecision
  const positions = await binance.futures
    .positionRisk()
    .catch((e) => console.error(new Error().stack) || console.error(e))
  const p = _.find(positions, { symbol: SYMBOL, positionSide: SIDE })
  // console.log(p)
  if (parseFloat(p.positionAmt) !== 0) {
    state.position = p
  } else {
    await cancelOrders()
    createOrders()
  }
  setInterval(() => checkPositions(), 15 * 1000)
  checkPositions()

  setInterval(async () => {
    if (state.position || state.tradesCount >= TRADES_TILL_STOP) return
    console.log('create orders by position timeout')
    await cancelOrders()
    createOrders()
  }, 2 * 60 * 1000)
})()
