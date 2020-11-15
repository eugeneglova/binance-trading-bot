import React, { useState, useEffect } from 'react'
import { Layout, Menu, Breadcrumb } from 'antd'
import { ipcRenderer } from 'electron'

import Test from './components/Test'
import ApiKeys from './components/ApiKeys'
import Settings from './components/Settings'
import Trading from './components/Trading'
import Telegram from './components/Telegram'

const { Header, Content, Footer } = Layout

function App() {
  const [isRunning, setIsRunning] = useState()
  const [isWSConnected, setIsWSConnected] = useState()
  const [isTelegramBotStarted, setIsTelegramBotStarted] = useState()
  const [page, setPage] = useState('trading')

  useEffect(() => {
    setIsRunning(JSON.parse(ipcRenderer.sendSync('getIsRunning')))
    setIsWSConnected(JSON.parse(ipcRenderer.sendSync('getIsWSConnected')))
    setIsTelegramBotStarted(JSON.parse(ipcRenderer.sendSync('getIsTelegramBotStarted')))
    ipcRenderer.on('onChangeIsRunning', (event, value) => setIsRunning(JSON.parse(value)))
    ipcRenderer.on('onChangeIsWSConnected', (event, value) => setIsWSConnected(JSON.parse(value)))
    ipcRenderer.on('onChangeIsTelegramBotStarted', (event, value) => setIsTelegramBotStarted(JSON.parse(value)))
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
          <Menu.Item key="trading">Trading</Menu.Item>
          <Menu.Item key="settings">Settings</Menu.Item>
          <Menu.Item key="apikeys">Api Keys</Menu.Item>
          <Menu.Item key="test">Test</Menu.Item>
          <Menu.Item key="telegram">Telegram</Menu.Item>
        </Menu>
      </Header>
      <Content style={{ padding: '0 50px' }}>
        <Breadcrumb style={{ margin: '16px 0' }}>
          <Breadcrumb.Item>Home</Breadcrumb.Item>
          <Breadcrumb.Item>List</Breadcrumb.Item>
          <Breadcrumb.Item>App</Breadcrumb.Item>
        </Breadcrumb>
        <div className="site-layout-content">
          {page === 'telegram' && (
            <Telegram />
          )}
          {page === 'test' && (
            <Test />
          )}
          {page === 'apikeys' && (
            <ApiKeys />
          )}
          {page === 'settings' && (
            <Settings />
          )}
          {page === 'trading' && (
            <Trading
              isRunning={isRunning}
              onStart={(index) => {
                ipcRenderer.send('start', index)
              }}
              onStop={(index) => {
                ipcRenderer.send('stop', index)
              }}
              isWSConnected={isWSConnected}
              onConnect={() => {
                ipcRenderer.send('connect')
              }}
              onDisconnect={() => {
                ipcRenderer.send('disconnect')
              }}
              isTelegramBotStarted={isTelegramBotStarted}
              onStartTelegramBot={() => {
                ipcRenderer.send('startTelegramBot')
              }}
              onStopTelegramBot={() => {
                ipcRenderer.send('stopTelegramBot')
              }}
              onCancelOrders={(index) => {
                ipcRenderer.send('cancelOrders', index)
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
