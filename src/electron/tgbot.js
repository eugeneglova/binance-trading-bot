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
    const { symbol, side, p } = data
    bot.telegram.sendMessage(config.TELEGRAM_USER_ID, `Open ${symbol} ${side}\n${parseFloat(p.entryPrice)}`)
  }

  em.on('tg:newPosition', onNewPosition)

  const onClosePosition = (data) => {
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
