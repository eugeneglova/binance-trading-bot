import React from 'react'
import { Button } from 'antd'

const Trading = ({ isRunning, onStart, onStop }) => {
  return (
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
  )
}

export default Trading
