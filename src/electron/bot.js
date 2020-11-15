const Binance = require('node-binance-api-ext')
const boll = require('bollinger-bands')
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

const start = async (em, index, contents) => {
  const store = new Store()
  let config = store.get().POSITIONS[index]

  const configIntervalId = setInterval(() => {
    config = store.get().POSITIONS[index]
  }, 10 * 1000)

  const state = {
    lOrders: [],
    tpOrders: [],
    slOrder: null,
  }

  const binance = Binance({
    APIKEY: store.get().APIKEY,
    APISECRET: store.get().APISECRET,
  })

  const cancelOrders = async (orders) => {
    return Promise.allSettled(
      orders.map(({ orderId }) =>
        binance.futures
          .cancel(config.SYMBOL, { orderId })
          .catch((e) => console.log(config.SYMBOL, config.SIDE) || console.error(new Error().stack) || console.error(e)),
      ),
    )
  }

  const cancelOpenOrders = async () => {
    const allOpenOrders = await binance.futures
      .openOrders(config.SYMBOL)
      .catch((e) => console.log(config.SYMBOL, config.SIDE) || console.error(new Error().stack) || console.error(e))
    const orders = _.filter(allOpenOrders, (o) => config.SIDE === 'AUTO' ? true : o.positionSide === config.SIDE)
    return cancelOrders(orders)
  }

  const createOrders = async (positionSide) => {
    if (state.createOrders) return
    state.createOrders = true
    const SIDE_SIGN = positionSide === 'SHORT' ? -1 : 1
    const quote = await binance.futures
      .quote(config.SYMBOL)
      .catch((e) => console.log(config.SYMBOL, config.SIDE) || console.error(new Error().stack) || console.error(e))
    const topBookPrice = parseFloat(SIDE_SIGN > 0 ? quote.bidPrice : quote.askPrice)

    let price
    if (config.PRICE_TYPE === 'distance') {
      price = getNextPrice(topBookPrice, 0, SIDE_SIGN, [
        { PRICE_STEP: config.PRICE_DISTANCE },
      ])
    } else if (config.PRICE_TYPE === 'price') {
      price = SIDE_SIGN > 0 ? Math.min(config.PRICE, topBookPrice) : Math.max(config.PRICE, topBookPrice)
    } else if (config.PRICE_TYPE === 'bb' || config.PRICE_TYPE === 'bb-mid') {
      const candlesticks = await binance.futures.candlesticks(config.SYMBOL, '15m', { limit: 20 })
      const closeCandles = candlesticks.map((item) => parseFloat(item[4]))
      const bollClose = boll(closeCandles)
      const bbPrice = config.PRICE_TYPE === 'bb-mid'
        ? _.last(bollClose.mid)
        : _.last(SIDE_SIGN > 0 ? bollClose.lower : bollClose.upper)
      price = SIDE_SIGN > 0 ? Math.min(bbPrice, topBookPrice) : Math.max(bbPrice, topBookPrice)
    }

    console.log(config.SYMBOL, config.SIDE, { price, topBookPrice })
    if (!price) {
      console.error(config.SYMBOL, config.SIDE, 'PRICE_TYPE error')
      return
    }
    const amount = SIDE_SIGN * config.AMOUNT
    const orders = getOrders({
      price,
      amount,
      count: config.GRID.length + 1,
      sideSign: SIDE_SIGN,
      grid: config.GRID,
      pricePrecision: state.pricePrecision,
      quantityPrecision: state.quantityPrecision,
    })
    console.log(config.SYMBOL, config.SIDE, orders)
    console.log(config.SYMBOL, config.SIDE, 'create orders')
    await Promise.allSettled(
      _.map(orders, (o) =>
        binance.futures[SIDE_SIGN > 0 ? 'buy' : 'sell'](config.SYMBOL, Math.abs(o.amount), o.price, {
          positionSide,
          postOnly: true,
        }).catch((e) => console.log(config.SYMBOL, config.SIDE) || console.error(new Error().stack) || console.error(e)),
      ),
    )
    state.createOrders = false
  }

  const createTpOrders = async () => {
    if (state.createTpOrders) return
    state.createTpOrders = true
    const p = state.position
    const posSize = getPosSize(Math.abs(parseFloat(p.positionAmt)), config.AMOUNT, config.GRID.length + 1, config.GRID)
    const gridIndex = Math.min(Math.max(1, Math.round(posSize)), config.TP_GRID.length - 1) - 1
    const SIDE_SIGN = p.positionSide === 'SHORT' ? -1 : 1
    const minPrice = getPLPrice(parseFloat(p.entryPrice), config.TP_GRID[gridIndex].MIN_PERCENT, SIDE_SIGN)
    const maxPrice = getPLPrice(parseFloat(p.entryPrice), config.TP_GRID[gridIndex].MAX_PERCENT, SIDE_SIGN)
    // console.log(config.SYMBOL, config.SIDE, { posSize, gridIndex, minPrice, maxPrice, c: config.TP_GRID[gridIndex] })
    const orders = getTpOrders({
      amount: parseFloat(p.positionAmt),
      minAmount: 1 / Math.pow(10, state.quantityPrecision),
      minPrice,
      maxPrice,
      sideSign: SIDE_SIGN,
      maxOrders: config.TP_GRID[gridIndex].MAX_COUNT,
      pricePrecision: state.pricePrecision,
      quantityPrecision: state.quantityPrecision,
    })
    console.log(config.SYMBOL, config.SIDE, orders)
    console.log(config.SYMBOL, config.SIDE, 'create tp orders')
    await Promise.allSettled(
      _.map(orders, (o) =>
        binance.futures[SIDE_SIGN < 0 ? 'buy' : 'sell'](config.SYMBOL, Math.abs(o.amount), o.price, {
          positionSide: p.positionSide,
        }).catch((e) => console.log(config.SYMBOL, config.SIDE) || console.error(new Error().stack) || console.error(e)),
      ),
    )
    state.createTpOrders = false
  }

  const onPositionNew = () => {
    console.log(config.SYMBOL, config.SIDE, 'NEW POS')
    em.emit('tg:newPosition', {
      symbol: config.SYMBOL,
      side: config.SIDE,
    })
    createTpOrders()
  }

  const onPositionUpdateOriginal = async () => {
    // console.log(config.SYMBOL, config.SIDE, 'UPDATE POS')
    const p = state.position
    const SIDE_SIGN = p.positionSide === 'SHORT' ? -1 : 1
    // console.log(config.SYMBOL, config.SIDE, p)

    // const posSize = Math.log(Math.abs(parseFloat(p.positionAmt)) / AMOUNT) / Math.log(2) + 1
    const posSize = getPosSize(Math.abs(parseFloat(p.positionAmt)), config.AMOUNT, config.GRID.length + 1, config.GRID)

    const spGridIndex = Math.min(Math.max(1, Math.round(posSize)), config.SP_GRID.length - 1) - 1

    contents.send('onPositionUpdate', { index, state })
    const plPerc = getPLPerc(p.entryPrice, p.markPrice, SIDE_SIGN)
    if (!state.lOrders.length) {
      await (async () => {
        console.log(config.SYMBOL, config.SIDE, 'getting limit orders')
        const allOpenOrders = await binance.futures
          .openOrders(config.SYMBOL)
          .catch((e) => console.log(config.SYMBOL, config.SIDE) || console.error(new Error().stack) || console.error(e))
        const lSide = SIDE_SIGN > 0 ? 'BUY' : 'SELL'
        const orders = _.filter(
          allOpenOrders,
          (o) => o.positionSide === p.positionSide && o.type === 'LIMIT' && o.side === lSide,
        )
        if (!orders.length) return
        // console.log(config.SYMBOL, config.SIDE, orders)
        orders.forEach((order, i) => {
          console.log(config.SYMBOL, config.SIDE, `l ${i + 1}:`, order.origQty, order.price)
        })
        state.lOrders = orders
      })()
    }
    if (!state.tpOrders.length) {
      await (async () => {
        console.log(config.SYMBOL, config.SIDE, 'getting tp orders')
        const allOpenOrders = await binance.futures
          .openOrders(config.SYMBOL)
          .catch((e) => console.log(config.SYMBOL, config.SIDE) || console.error(new Error().stack) || console.error(e))
        const tpSide = SIDE_SIGN < 0 ? 'BUY' : 'SELL'
        const orders = _.filter(
          allOpenOrders,
          (o) => o.positionSide === p.positionSide && o.type === 'LIMIT' && o.side === tpSide,
        )
        if (!orders.length) return
        // console.log(config.SYMBOL, config.SIDE, orders)
        orders.forEach((order, i) => {
          console.log(config.SYMBOL, config.SIDE, `tp ${i + 1}:`, order.origQty, order.price)
        })
        state.tpOrders = orders
      })()
    }
    if (!state.spOrder && plPerc > config.SP_GRID[spGridIndex].MIN_PERCENT) {
      await (async () => {
        console.log(config.SYMBOL, config.SIDE, 'getting sp order')
        const allOpenOrders = await binance.futures
          .openOrders(config.SYMBOL)
          .catch((e) => console.log(config.SYMBOL, config.SIDE) || console.error(new Error().stack) || console.error(e))
        const spSide = SIDE_SIGN < 0 ? 'BUY' : 'SELL'
        const order = _.find(
          allOpenOrders,
          (o) =>
            o.positionSide === p.positionSide &&
            o.type === 'STOP_MARKET' &&
            o.side === spSide &&
            Math.sign(parseFloat(o.stopPrice) - parseFloat(p.entryPrice)) === SIDE_SIGN,
        )
        if (!order) return
        console.log(config.SYMBOL, config.SIDE, 'sp:', order.origQty, order.stopPrice)
        state.spOrder = order
      })()
    }
    if (!state.slOrder) {
      await (async () => {
        console.log(config.SYMBOL, config.SIDE, 'getting sl order')
        const allOpenOrders = await binance.futures
          .openOrders(config.SYMBOL)
          .catch((e) => console.log(config.SYMBOL, config.SIDE) || console.error(new Error().stack) || console.error(e))
        const slSide = SIDE_SIGN < 0 ? 'BUY' : 'SELL'
        const orders = _.filter(
          allOpenOrders,
          (o) =>
            o.positionSide === p.positionSide &&
            o.type === 'STOP_MARKET' &&
            o.side === slSide &&
            Math.sign(parseFloat(o.stopPrice) - parseFloat(p.entryPrice)) !== SIDE_SIGN,
        )
        if (!orders.length) return
        const order = _.first(orders)
        console.log(config.SYMBOL, config.SIDE, 'sl:', order.origQty, order.stopPrice)
        state.slOrder = order
        cancelOrders(_.tail(orders))
      })()
    }

    const spGridConfig = config.SP_GRID[spGridIndex] || _.last(config.SP_GRID)
    const diff = plPerc - spGridConfig.TRIGGER_PERCENT
    const plus = diff > 0 && spGridConfig.TRAILING ? diff : 0
    const spPrice = precision(
      getPLPrice(parseFloat(p.entryPrice), parseFloat(spGridConfig.MIN_PERCENT) + plus, SIDE_SIGN),
      state.pricePrecision,
    )

    // make tp closer to base price to minimize risks after 3rd order
    // const numOfRiskOrders = 3
    // const tpDistanceCoefficient =
    //   posSize > numOfRiskOrders ? 1 / (posSize - numOfRiskOrders / 2) : 1
    // const price = precision(
    //   getPLPrice(p.entryPrice, (config.TP_MAX_PERCENT + plus) * tpDistanceCoefficient, SIDE_SIGN),
    //   state.pricePrecision,
    // )
    const amount = Math.max(Math.abs(parseFloat(p.positionAmt)), 1 / Math.pow(10, state.quantityPrecision))

    const minLOrder = _.minBy(state.lOrders, (o) => parseFloat(o.origQty))
    const minLOrderSize = minLOrder
      ? getPosSize(Math.abs(minLOrder.origQty), config.AMOUNT, config.GRID.length + 1, config.GRID)
      : Infinity
    // when pos size less than closest limit order we need update orders
    // console.log(config.SYMBOL, config.SIDE, { amt: p.positionAmt, minLOrderSize , posSize, c1: minLOrderSize - posSize })
    // if ((minLOrderSize - posSize >= 1.1 && posSize >= 1) || (minLOrderSize - posSize < 1 && posSize < 1)) {
    if (minLOrderSize - posSize >= 1.1 && posSize >= 1) {
      await Promise.allSettled(
        state.lOrders.map(({ orderId }) =>
          binance.futures
            .cancel(config.SYMBOL, { orderId })
            .catch((e) => console.log(config.SYMBOL, config.SIDE) || console.error(new Error().stack) || console.error(e)),
        ),
      ).then(async () => {
        console.log(config.SYMBOL, config.SIDE, 'cancelled limit orders', {
          a: minLOrderSize - posSize,
          posSize,
        })
        const amount = config.AMOUNT
        const orders = getOrders({
          price: p.entryPrice,
          amount,
          count: config.GRID.length + 1,
          sideSign: SIDE_SIGN,
          start: Math.ceil(posSize) - 1,
          grid: config.GRID,
          pricePrecision: state.pricePrecision,
          quantityPrecision: state.quantityPrecision,
        })
        orders.shift()
        console.log(config.SYMBOL, config.SIDE, 'create orders')
        await Promise.all(
          _.map(orders, (o) =>
            binance.futures[SIDE_SIGN > 0 ? 'buy' : 'sell'](
              config.SYMBOL,
              Math.abs(o.amount),
              o.price,
              {
                positionSide: p.positionSide,
                postOnly: true,
              },
            ).catch((e) => console.log(config.SYMBOL, config.SIDE) || console.error(new Error().stack) || console.error(e)),
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
            .catch((e) => console.log(config.SYMBOL, config.SIDE) || console.error(new Error().stack) || console.error(e)),
        ),
      )
      console.log(config.SYMBOL, config.SIDE, 'create orders because', {
        tp: state.tpOrders,
        a: Math.abs(precision(getOrdersAmount(state.tpOrders), state.quantityPrecision)),
        b: Math.abs(precision(parseFloat(p.positionAmt), state.quantityPrecision)),
      })
      await createTpOrders()
      state.tpOrders = []
      state.lOrders = []
    }

    console.log(config.SYMBOL, config.SIDE,
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
      console.log(config.SYMBOL, config.SIDE, 'sp', spPrice, diff)
    }
    if (!state.spOrder && diff > 0) {
      console.log(config.SYMBOL, config.SIDE, 'create sp order', { spPrice, amount })
      await binance.futures[SIDE_SIGN < 0 ? 'stopMarketBuy' : 'stopMarketSell'](
        config.SYMBOL,
        Math.abs(amount),
        spPrice,
        {
          positionSide: p.positionSide,
        },
      ).catch((e) => console.log(config.SYMBOL, config.SIDE) || console.error(new Error().stack) || console.error(e))
    }

    if (
      state.spOrder &&
      plPerc > config.SP_GRID[spGridIndex].MIN_PERCENT &&
      (parseFloat(state.spOrder.origQty) !== Math.abs(parseFloat(p.positionAmt)) ||
        parseFloat(state.spOrder.stopPrice) !== spPrice)
    ) {
      console.log(config.SYMBOL, config.SIDE, 'update sp order', amount, spPrice)
      binance.futures
        .cancel(config.SYMBOL, { orderId: state.spOrder.orderId })
        .catch((e) => console.log(config.SYMBOL, config.SIDE, e))
      binance.futures[SIDE_SIGN < 0 ? 'stopMarketBuy' : 'stopMarketSell'](
        config.SYMBOL,
        Math.abs(amount),
        spPrice,
        {
          positionSide: p.positionSide,
        },
      ).catch((e) => console.log(config.SYMBOL, config.SIDE, e))
      state.spOrder = null
    }

    const slPrice = precision(
      getPLPrice(parseFloat(p.entryPrice), config.SL_PERCENT, SIDE_SIGN),
      state.pricePrecision,
    )
    if (!state.slOrder) {
      console.log(config.SYMBOL, config.SIDE, 'create sl order', amount, slPrice)
      await binance.futures[SIDE_SIGN < 0 ? 'stopMarketBuy' : 'stopMarketSell'](
        config.SYMBOL,
        Math.abs(amount),
        slPrice,
        {
          positionSide: p.positionSide,
        },
      ).catch((e) => console.log(config.SYMBOL, config.SIDE) || console.error(new Error().stack) || console.error(e))
    } else if (
      state.slOrder &&
      (parseFloat(state.slOrder.stopPrice) !== slPrice ||
        parseFloat(state.slOrder.origQty) !== amount)
    ) {
      console.log(config.SYMBOL, config.SIDE, {
        p: state.slOrder.stopPrice,
        p1: slPrice,
        a: state.slOrder.origQty,
        a1: amount,
      })
      console.log(config.SYMBOL, config.SIDE, 'update sl order', amount, slPrice)
      await binance.futures
        .cancel(config.SYMBOL, { orderId: state.slOrder.orderId })
        .catch((e) => console.log(config.SYMBOL, config.SIDE) || console.error(new Error().stack) || console.error(e))
      binance.futures[SIDE_SIGN < 0 ? 'stopMarketBuy' : 'stopMarketSell'](
        config.SYMBOL,
        Math.abs(amount),
        slPrice,
        {
          positionSide: p.positionSide,
        },
      ).catch((e) => console.log(config.SYMBOL, config.SIDE) || console.error(new Error().stack) || console.error(e))
      state.slOrder = null
      state.lOrders = []
    }
  }

  const onPositionUpdate = _.debounce(onPositionUpdateOriginal, 1000)

  const onPositionClose = async () => {
    console.log(config.SYMBOL, config.SIDE, 'CLOSE POS')
    em.emit('tg:closePosition', {
      symbol: config.SYMBOL,
      side: config.SIDE,
    })
    state.lOrders = []
    state.tpOrders = []
    state.slOrder = null
    cancelOpenOrders()
    store.set(`POSITIONS.${index}.TRADES_COUNT`, config.TRADES_COUNT + 1)
    config = store.get().POSITIONS[index]
  }

  const accountUpdate = async (positions) => {
    console.log(config.SYMBOL, config.SIDE, 'account update')

    const p = _.find(positions, ({ symbol, positionSide, positionAmt }) => (
      symbol === config.SYMBOL && (config.SIDE === 'AUTO' ? true : positionSide === config.SIDE) && parseFloat(positionAmt) !== 0
    ))

    if (p) {
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
  em.on('accountUpdate', accountUpdate)

  // const orderTradeUpdate = async (data) => {
  //   console.log(config.SYMBOL, config.SIDE, 'order trade update')
  // }
  // em.on('orderTradeUpdate', _.debounce(orderTradeUpdate, 1000))

  const checkPositions = async (positions) => {
    const p = _.find(positions, { symbol: config.SYMBOL, positionSide: config.SIDE })
    // console.log(config.SYMBOL, config.SIDE, p)
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
    .catch((e) => console.log(config.SYMBOL, config.SIDE) || console.error(new Error().stack) || console.error(e))
  const p = _.find(positions, ({ symbol, positionSide, positionAmt }) => (
    symbol === config.SYMBOL && (config.SIDE === 'AUTO' ? true : positionSide === config.SIDE) && parseFloat(positionAmt) !== 0
  ))
  // console.log(config.SYMBOL, config.SIDE, p)
  if (p) {
    state.position = p
  } else {
    await cancelOpenOrders()
    if (config.SIDE === 'AUTO') {
      createOrders('LONG')
      createOrders('SHORT')
    } else {
      createOrders(config.SIDE)
    }
  }
  em.on('checkPositions', checkPositions)

  const createOrdersIntervalId = setInterval(async () => {
    if (state.position) return
    if (config.TRADES_COUNT >= config.TRADES_TILL_STOP) return
    if (moment().isBefore(config.DATETIME_RANGE[0]) || moment().isAfter(config.DATETIME_RANGE[1])) return
    console.log(config.SYMBOL, config.SIDE, 'create orders by position timeout')
    await cancelOpenOrders()
    if (config.SIDE === 'AUTO') {
      createOrders('LONG')
      createOrders('SHORT')
    } else {
      createOrders(config.SIDE)
    }
  }, 2 * 60 * 1000)

  const stop = async () => {
    state.lOrders = []
    state.tpOrders = []
    state.slOrder = null
    clearInterval(configIntervalId)
    clearInterval(createOrdersIntervalId)
    em.off('accountUpdate', accountUpdate)
    em.off('checkPositions', checkPositions)
  }

  return stop
}

const connect = (em) => {
  const store = new Store()

  const binance = Binance({
    APIKEY: store.get().APIKEY,
    APISECRET: store.get().APISECRET,
  })

  const userFuturesDataHandler = async (data) => {
    const type = data.e
    if (type === 'listenKeyExpired') {
      console.log('listenKeyExpired reconnect')
      reconnect()
    } else if (type === 'ACCOUNT_UPDATE') {
      if (data.a.m !== 'ORDER') return
      const positions = await binance.futures
        .positionRisk()
        .catch((e) => console.error(new Error().stack) || console.error(e))
      if (!positions) {
        console.error('ERROR: accountUpdate positionRisk problem')
        return
      }
      em.emit('accountUpdate', positions)
    } else if (type === 'ORDER_TRADE_UPDATE') {
      // orderTradeUpdate(data)
      em.emit('orderTradeUpdate', data)
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

  const wsconnect = async function reconnect() {
    console.log('connect')
    const { listenKey } = await getDataStream()
    binance.webSocket.futuresSubscribeSingle(listenKey, userFuturesDataHandler, reconnect)
  }
  wsconnect()

  // check positions every 15 sec
  const checkPositions = async () => {
    await binance.useServerTime()
    const positions = await binance.futures
      .positionRisk()
      .catch((e) => console.error(new Error().stack) || console.error(e))
    if (!positions) {
      console.error('ERROR: check positions')
      return
    }
    em.emit('checkPositions', positions)
  }

  const checkPositionsIntervalId = setInterval(() => checkPositions(), 15 * 1000)
  checkPositions()

  const disconnect = async () => {
    clearInterval(keepAliveIntervalId)
    clearInterval(checkPositionsIntervalId)
    console.log('disconnect')
    const { listenKey } = await getDataStream()
    binance.webSocket.futuresTerminate(listenKey)
  }

  return disconnect
}

const cancelOrders = async (index) => {
  const store = new Store()
  let config = store.get().POSITIONS[index]

  const binance = Binance({
    APIKEY: store.get().APIKEY,
    APISECRET: store.get().APISECRET,
  })

  const cancelOrders = async (orders) => {
    return Promise.allSettled(
      orders.map(({ orderId }) =>
        binance.futures
          .cancel(config.SYMBOL, { orderId })
          .catch((e) => console.log(config.SYMBOL, config.SIDE) || console.error(new Error().stack) || console.error(e)),
      ),
    )
  }

  const cancelOpenOrders = async () => {
    const allOpenOrders = await binance.futures
      .openOrders(config.SYMBOL)
      .catch((e) => console.log(config.SYMBOL, config.SIDE) || console.error(new Error().stack) || console.error(e))
    const orders = _.filter(allOpenOrders, (o) => config.SIDE === 'AUTO' ? true : o.positionSide === config.SIDE)
    return cancelOrders(orders)
  }

  cancelOpenOrders()
}

module.exports = {
  start,
  connect,
  cancelOrders,
}
