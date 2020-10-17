import React, { useState, useEffect } from 'react'
import { Button, Table } from 'antd'
import { ipcRenderer } from 'electron'

import { precision, getPLPerc } from '../../electron/functions'

const Trading = ({ isRunning, onStart, onStop }) => {
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
      render: (price, o) => precision(parseFloat(o.stopPrice) ? o.stopPrice : price, state.pricePrecision),
    },
  ]

  return (
    <div>
      <div>
        <Button
          type="primary"
          onClick={() => {
            onStart()
          }}
          disabled={isRunning}
        >
          Start
        </Button>
        <Button
          type="primary"
          onClick={() => {
            onStop()
          }}
          disabled={!isRunning}
        >
          Stop
        </Button>
      </div>
      <br />
      {isRunning && (
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
  )
}

export default Trading
