import React, { useEffect, useState } from 'react'
import { Button } from 'antd'
import { ipcRenderer } from 'electron'

const Test = () => {
  const [data, setData] = useState()
  useEffect(() => {
    ipcRenderer.on('test-done', (event, value) => setData(value))
  }, [])

  return (
    <div>
      <Button
        type="secondary"
        onClick={() => {
          ipcRenderer.send('test')
        }}
      >
        Test
      </Button>
      {data && data.map((p) => (
        <div>
          {p.symbol} - {p.positionSide}
        </div>
      ))}
    </div>
  )
}

export default Test
