import React, { useState, useEffect } from 'react'
import { Layout, Menu, Breadcrumb } from 'antd'
import { ipcRenderer } from 'electron'

import Settings from './components/Settings'

// ipcRenderer.on('asynchronous-reply', (event, arg) => {
//   console.log(arg) // prints "pong"
// })

const { Header, Content, Footer } = Layout

function App() {
  const [config, setConfig] = useState()
  const [page, setPage] = useState('settings')

  useEffect(() => {
    setConfig(ipcRenderer.sendSync('getConfig'))
  }, [])

  return (
    <Layout className="layout">
      <Header>
        <div className="logo" />
        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={[page]}>
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
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        Binance Trading Bot ©2020 Created by Eugene Glova
      </Footer>
    </Layout>
  )
}

export default App
