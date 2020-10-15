const Binance = require('node-binance-api-ext')
const Store = require('electron-store')

const start = async () => {
  const store = new Store()
  const config = store.get()
  const binance = Binance({
    APIKEY: config.APIKEY,
    APISECRET: config.APISECRET,
  })

  await binance.useServerTime()
  const positions = await binance.futures
    .positionRisk()
    .catch((e) => console.error(new Error().stack) || console.error(e))
  return positions
}

module.exports = start
