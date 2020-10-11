import React, { useState, useEffect } from 'react'
import { Layout, Menu, Breadcrumb } from 'antd'
import { ipcRenderer } from 'electron'

import Settings from './components/Settings'
import Trading from './components/Trading'

// ipcRenderer.on('asynchronous-reply', (event, arg) => {
//   console.log(arg) // prints "pong"
// })

const { Header, Content, Footer } = Layout

function App() {
  const [config, setConfig] = useState()
  const [isRunning, setIsRunning] = useState()
  const [page, setPage] = useState('settings')

  useEffect(() => {
    setConfig(ipcRenderer.sendSync('getConfig'))
    setIsRunning(ipcRenderer.sendSync('getIsRunning'))
    ipcRenderer.on('onChangeIsRunning', (event, value) => setIsRunning(JSON.parse(value)))
  }, [])

  return (
    <Layout className="layout">
      <Header>
        <div className="logo" />
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={[page]}
          onSelect={({ key }) => setPage(key)}
        >
          <Menu.Item key="settings">Settings</Menu.Item>
          <Menu.Item key="trading">Trading</Menu.Item>
        </Menu>
      </Header>
      <Content style={{ padding: '0 50px' }}>
        <Breadcrumb style={{ margin: '16px 0' }}>
          <Breadcrumb.Item>Home</Breadcrumb.Item>
          <Breadcrumb.Item>List</Breadcrumb.Item>
          <Breadcrumb.Item>App</Breadcrumb.Item>
        </Breadcrumb>
        <div className="site-layout-content">
          {config && page === 'settings' && (
            <Settings
              config={config}
              onSuccess={(values) => {
                const mergedValues = { ...config, ...values }
                ipcRenderer.send('setConfig', JSON.stringify(mergedValues))
                setConfig(mergedValues)
              }}
            />
          )}
          {config && page === 'trading' && (
            <Trading
              config={config}
              isRunning={isRunning}
              onStart={() => {
                ipcRenderer.send('start')
              }}
              onStop={() => {
                ipcRenderer.send('stop')
              }}
            />
          )}
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        Binance Trading Bot ©2020 Created by Eugene Glova
      </Footer>
    </Layout>
  )
}

export default App
