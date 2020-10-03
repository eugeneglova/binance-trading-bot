const _ = require('lodash')

const getDecimals = (value) => {
  const absValue = Math.abs(value)
  if (absValue < 0.0005) return 6
  if (absValue < 0.005) return 5
  if (absValue < 0.05) return 4
  if (absValue < 0.5) return 3
  if (absValue < 1) return 2
  if (absValue < 1000) return 2
  if (absValue < 10000) return 1
  return 0
}

const precision = (value, decimals = getDecimals(value)) =>
  Math.floor(value * 10 ** decimals) / 10 ** decimals

const getPLPrice = (basePrice, plPercent, sideSign) =>
  basePrice + sideSign * (plPercent / 100) * basePrice

const getPLPerc = (basePrice, price, sideSign) =>
  (price / basePrice - 1) / sideSign * 100


const getFullSize = (amount, count) => (
  _.range(0, count).reduce((acc, i) => acc * (i ? 2 : 1), amount)
)

const getNextPrice = (price, i, sideSign, xPrice = 0.0065) => (
  price - sideSign * price * xPrice * (i * 0.01 + 1)
)

const getNextAmount = (amount, i) => (
  amount * (i ? 2 : 1)
)

const getOrders = ({ price, amount, count, sideSign, start = 0, xPrice = 0.0065 }) => {
  const res = _.range(0, count).reduce(
    (acc, i) => {
      // const price = acc.price - sideSign * acc.price * 0.0055 * (i * 0.01 + 1)
      let price = getNextPrice(acc.price, i, sideSign, xPrice)
      // const amount = acc.amount * (i ? 2 : 1)
      const amount = getNextAmount(acc.amount, i)
      let orders = [
        {
          price: precision(acc.price),
          amount: acc.amount,
          priceDiff: precision(acc.price - price),
        }
      ]
      if (i < start) {
        price = acc.price
        orders = []
      }
      return {
        ...acc,
        price,
        amount,
        orders: [
          ...acc.orders,
          ...orders,
        ],
      }
    },
    { price, amount, orders: [] },
  )
  return res.orders
}

// console.log(getOrders(336.757421875, -0.04, 8, -1, 6))
// console.log(getOrders(336.757421875, 0.04, 8, 1, 6))

const getOrdersAmount = (orders) => (
  _.reduce(orders, (acc, order) => acc + parseFloat(order.origQty), 0)
)

const getTpOrdersCount = (amount, minAmount, maxOrders = 8) => (
  Math.min(maxOrders, Math.abs(Math.round(amount / minAmount)))
)

const getTpOrders = (basePrice, amount, minAmount, maxPrice, sideSign, maxOrders = 8) => {
  const count = getTpOrdersCount(amount, minAmount, maxOrders)
  const interval = Math.abs(basePrice - maxPrice) / count
  const ordAmount = -sideSign * Math.max(minAmount, Math.abs(amount) / count)
  const orders = _.range(0, count).map((i) => {
    const price = precision(basePrice + (i + 1) * sideSign * interval)
    return { price, amount: ordAmount }
  })
  return orders
}

// const a = getTpOrders(370, 1.28, 0.04, 372, 1)
// const b = getTpOrders(372, -0.16, 0.04, 370, -1)
// console.log(a, b)
// console.log(getOrders(370, 0.04, 8, 1))

module.exports = {
  getDecimals,
  precision,
  getPLPrice,
  getPLPerc,
  getOrders,
  getFullSize,
  getOrdersAmount,
  getTpOrdersCount,
  getTpOrders,
  getNextPrice,
  getNextAmount,
}
