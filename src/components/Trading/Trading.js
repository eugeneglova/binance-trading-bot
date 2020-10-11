import React, { useState } from 'react'
import { Button } from 'antd'

const Trading = ({ onStart, onStop }) => {
  const [isStarted, setIsStarted] = useState(false)
  return (
    <div>
      <Button
        type="primary"
        onClick={() => {
          setIsStarted(true)
          onStart()
        }}
        disabled={isStarted}
      >
        Start
      </Button>
      <Button
        type="primary"
        onClick={() => {
          onStop()
          setIsStarted(false)
        }}
        disabled={!isStarted}
      >
        Stop
      </Button>
    </div>
  )
}

export default Trading
