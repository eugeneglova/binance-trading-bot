import React, { useState, useEffect } from 'react'
import { Button, Table, Space } from 'antd'
import { ipcRenderer } from 'electron'
import Store from 'electron-store'

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

const getPLPerc = (basePrice, price, sideSign) => ((price / basePrice - 1) / sideSign) * 100

const Trading = ({ isRunning = [], onStart, onStop }) => {
  const store = new Store()
  const config = store.get()

  const [state, setBotState] = useState({})
  useEffect(() => {
    ipcRenderer.on('onPositionUpdate', (event, value) => setBotState(value))
  }, [])

  const posColumns = [
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (symbol) => symbol,
    },
    {
      title: 'Side',
      dataIndex: 'positionSide',
      key: 'positionSide',
      render: (positionSide) => positionSide,
    },
    {
      title: 'Size',
      dataIndex: 'positionAmt',
      key: 'positionAmt',
      render: (positionAmt) => positionAmt,
    },
    {
      title: 'Entry Price',
      dataIndex: 'entryPrice',
      key: 'entryPrice',
      render: (entryPrice) => precision(entryPrice, state.pricePrecision),
    },
    {
      title: 'UnRealized Profit',
      dataIndex: 'unRealizedProfit',
      key: 'unRealizedProfit',
      render: (unRealizedProfit, p) => {
        const SIDE_SIGN = p.positionSide === 'SHORT' ? -1 : 1
        const plPerc = getPLPerc(p.entryPrice, p.markPrice, SIDE_SIGN)
        return `${precision(unRealizedProfit)} (${precision(plPerc)}%)`
      },
    },
  ]

  const orderColumns = [
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (symbol) => symbol,
    },
    {
      title: 'Size',
      dataIndex: 'origQty',
      key: 'origQty',
      render: (origQty) => origQty,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price, o) =>
        precision(parseFloat(o.stopPrice) ? o.stopPrice : price, state.pricePrecision),
    },
  ]

  return (
    <div>
      <div>
        {config.POSITIONS.map((pos, index) => (
          <div>
            <Space>
              <span>{pos.SYMBOL}</span>
              <span>{pos.SIDE}</span>
              <Button
                type="primary"
                onClick={() => {
                  onStart(index)
                }}
                disabled={isRunning[index]}
              >
                Start
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  onStop(index)
                }}
                disabled={!isRunning[index]}
              >
                Stop
              </Button>
            </Space>

            {isRunning[index] && (
              <div>
                {state.position && (
                  <div>
                    Position
                    <Table columns={posColumns} dataSource={[state.position]} />
                  </div>
                )}
                {state.tpOrders && (
                  <div>
                    Take Profit Orders
                    <Table columns={orderColumns} dataSource={state.tpOrders} />
                  </div>
                )}
                {state.spOrder && (
                  <div>
                    Stop Without Loss Order
                    <Table columns={orderColumns} dataSource={[state.spOrder]} />
                  </div>
                )}
                {state.lOrders && (
                  <div>
                    Limit Orders
                    <Table columns={orderColumns} dataSource={state.lOrders} />
                  </div>
                )}
                {state.slOrder && (
                  <div>
                    Stop Loss Order
                    <Table columns={orderColumns} dataSource={[state.slOrder]} />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Trading
