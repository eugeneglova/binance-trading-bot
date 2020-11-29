const { Telegraf, Markup } = require('telegraf')
const Binance = require('node-binance-api-ext')
const moment = require('moment')
const _ = require('lodash')
const Store = require('electron-store')

const { precision } = require('./functions')

const start = (em) => {
  const store = new Store()
  let config = store.get()

  const binance = Binance({
    APIKEY: store.get().APIKEY,
    APISECRET: store.get().APISECRET,
    useServerTime: true,
    recvWindow: 15000,
  })

  const configIntervalId = setInterval(() => {
    config = store.get()
  }, 10 * 1000)

  const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN)

  bot.telegram.setMyCommands([
    { command: 'income', description: 'show income for this day' },
    { command: 'control', description: 'control bot' },
  ])

  const onNewPosition = (data) => {
    if (!config.TELEGRAM_NOTIFY_NEW_POS) {
      return
    }
    const { symbol, side, p } = data
    bot.telegram.sendMessage(
      config.TELEGRAM_USER_ID,
      `Open ${symbol} ${side}\n${Math.abs(parseFloat(p.positionAmt))} @ ${parseFloat(
        p.entryPrice,
      )}`,
    )
  }

  em.on('tg:newPosition', onNewPosition)

  const onIncreasePosition = (data) => {
    if (!config.TELEGRAM_NOTIFY_INCREASE_POS) {
      return
    }
    const { symbol, side, p } = data
    bot.telegram.sendMessage(
      config.TELEGRAM_USER_ID,
      `Increase ${symbol} ${side}\n${Math.abs(parseFloat(p.positionAmt))} @ ${parseFloat(
        p.entryPrice,
      )}`,
    )
  }

  em.on('tg:increasePosition', onIncreasePosition)

  const onDecreasePosition = (data) => {
    if (!config.TELEGRAM_NOTIFY_DECREASE_POS) {
      return
    }
    const { symbol, side, p, pl } = data
    const plValue = parseFloat(pl)
    const plSign = Math.sign(plValue) > 0 ? '+' : ''
    bot.telegram.sendMessage(
      config.TELEGRAM_USER_ID,
      `Take Profit ${symbol} ${side}\n${Math.abs(parseFloat(p.positionAmt))} @ ${parseFloat(
        p.entryPrice,
      )}\n${plSign}${precision(plValue)}`,
    )
  }

  em.on('tg:decreasePosition', onDecreasePosition)

  const onClosePosition = (data) => {
    if (!config.TELEGRAM_NOTIFY_CLOSE_POS) {
      return
    }
    const { symbol, side, pl, count } = data
    const plValue = parseFloat(pl)
    const plSign = Math.sign(plValue) > 0 ? '+' : ''
    bot.telegram.sendMessage(
      config.TELEGRAM_USER_ID,
      `Closed ${symbol} ${side} (${count})\n${plSign}${precision(plValue)}`,
    )
  }

  em.on('tg:closePosition', onClosePosition)

  const onTestMessage = () => {
    bot.telegram.sendMessage(config.TELEGRAM_USER_ID, `Test`)
  }

  em.on('testmessage', onTestMessage)

  bot.command('control', (ctx) => {
    em.on('tg:isRunning', (isRunning) => {
      const buttons = _.flatten(
        config.POSITIONS.map((pos, index) => {
          return [
            Markup.callbackButton(
              `${pos.SYMBOL.replace('USDT', '')} ${pos.SIDE} ${
                isRunning[index] ? 'Stop' : 'Start'
              }`,
              isRunning[index] ? `stop${index}` : `start${index}`,
            ),
            Markup.callbackButton(
              isRunning[index] ? 'Restart' : 'N/A',
              isRunning[index] ? `restart${index}` : `na${index}`,
            ),
          ]
        }),
      )
      ctx.replyWithMarkdown('Control bot', Markup.inlineKeyboard(buttons, { columns: 2 }).extra())
    })
    em.emit('getIsRunning')
  })

  bot.action(/^start(\d+)/, (ctx) => {
    em.emit('start', ctx.match[1])
  })

  bot.action(/^stop(\d+)/, (ctx) => {
    em.emit('stop', ctx.match[1])
  })

  bot.action(/^restart(\d+)/, (ctx) => {
    em.emit('restart', ctx.match[1])
  })

  bot.command('income', async (ctx) => {
    const startTime = moment().utc().startOf('day').toDate().valueOf()
    const endTime = Date.now()

    const income = await binance.futures.income({
      startTime,
      endTime,
      limit: 1000,
    })

    const realizedPnl = income.reduce((acc, item) => {
      if (item.incomeType === 'REALIZED_PNL') {
        return acc + parseFloat(item.income)
      }
      return acc
    }, 0)

    const funding = income.reduce((acc, item) => {
      if (item.incomeType === 'FUNDING_FEE') {
        return acc + parseFloat(item.income)
      }
      return acc
    }, 0)

    const commission = income.reduce((acc, item) => {
      if (item.incomeType === 'COMMISSION') {
        return acc + parseFloat(item.income)
      }
      return acc
    }, 0)

    const total = realizedPnl + funding + commission

    ctx.reply(
      [
        `Realized PNL: ${precision(realizedPnl)}`,
        `Funding: ${precision(funding)}`,
        `Comission: ${precision(commission)}`,
        `Total: ${precision(total)}`,
      ].join('\n'),
    )
  })

  bot.launch()

  const stop = () => {
    clearInterval(configIntervalId)
    em.off('tg:newPosition', onNewPosition)
    em.off('tg:increasePosition', onIncreasePosition)
    em.off('tg:decreasePosition', onDecreasePosition)
    em.off('tg:closePosition', onClosePosition)
    em.off('testmessage', onTestMessage)
    bot.stop()
  }

  return stop
}

module.exports = {
  start,
}
