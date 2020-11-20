const { Telegraf } = require('telegraf')
const Store = require('electron-store')

const { precision } = require('./functions')

const start = (em) => {
  const store = new Store()
  let config = store.get()

  const configIntervalId = setInterval(() => {
    config = store.get()
  }, 10 * 1000)

  const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN)

  const onNewPosition = (data) => {
    if (!config.TELEGRAM_NOTIFY_NEW_POS) {
      return
    }
    const { symbol, side, p } = data
    bot.telegram.sendMessage(config.TELEGRAM_USER_ID, `Open ${symbol} ${side}\n${Math.abs(parseFloat(p.positionAmt))} @ ${parseFloat(p.entryPrice)}`)
  }

  em.on('tg:newPosition', onNewPosition)

  const onUpdatePosition = (data) => {
    if (!config.TELEGRAM_NOTIFY_UPDATE_POS) {
      return
    }
    const { symbol, side, p } = data
    bot.telegram.sendMessage(config.TELEGRAM_USER_ID, `Update ${symbol} ${side}\n${Math.abs(parseFloat(p.positionAmt))} @ ${parseFloat(p.entryPrice)}`)
  }

  em.on('tg:updatePosition', onUpdatePosition)

  const onClosePosition = (data) => {
    if (!config.TELEGRAM_NOTIFY_CLOSE_POS) {
      return
    }
    const { symbol, side, pl, count } = data
    const plValue = parseFloat(pl)
    const plSign = Math.sign(plValue) > 0 ? '+' : ''
    bot.telegram.sendMessage(config.TELEGRAM_USER_ID, `Closed ${symbol} ${side} (${count})\n${plSign}${precision(plValue)}`)
  }

  em.on('tg:closePosition', onClosePosition)

  const onTestMessage = () => {
    bot.telegram.sendMessage(config.TELEGRAM_USER_ID, `Test`)
  }

  em.on('testmessage', onTestMessage)

  bot.launch()

  const stop = () => {
    clearInterval(configIntervalId)
    em.off('tg:newPosition', onNewPosition)
    em.off('tg:closePosition', onClosePosition)
    em.off('testmessage', onTestMessage)
    bot.stop()
  }

  return stop
}

module.exports = {
  start,
}
