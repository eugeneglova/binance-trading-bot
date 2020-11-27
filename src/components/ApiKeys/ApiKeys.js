import React from 'react'
import { Form, Input, Button, message } from 'antd'
import Store from 'electron-store'

const layout = {
  labelCol: {
    span: 8,
  },
  wrapperCol: {
    span: 16,
  },
}
const tailLayout = {
  wrapperCol: {
    offset: 8,
    span: 16,
  },
}

const ApiKeys = () => {
  const store = new Store()
  const config = store.get()
  const onFinish = (values) => {
    store.set(values)
    console.log('Success:', values)
    message.success('Saved')
  }

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo)
  }

  return (
    <Form
      {...layout}
      name="basic"
      initialValues={config}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <Form.Item
        label="API Key"
        name="APIKEY"
        rules={[
          {
            required: true,
            message: 'Please enter your API Key!',
          },
        ]}
      >
        <Input type="password" />
      </Form.Item>

      <Form.Item
        label="API Secret"
        name="APISECRET"
        rules={[
          {
            required: true,
            message: 'Please enter your API Secret!',
          },
        ]}
      >
        <Input type="password" />
      </Form.Item>

      <Form.Item {...tailLayout}>
        <Button type="primary" htmlType="submit">
          Save
        </Button>
      </Form.Item>
    </Form>
  )
}

export default ApiKeys
