import React from 'react'
import { Form, Input, Button, Select, Space } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import Store from 'electron-store'

const { Option } = Select

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

const Main = ({ onSuccess }) => {
  const store = new Store()
  const config = store.get()

  const onFinish = (values) => {
    console.log('Success:', values)
    store.set(values)
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
        label="Symbol"
        name="SYMBOL"
        rules={[
          {
            required: true,
            message: 'Please enter your pair symbol',
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item name="SIDE" label="Position Side" rules={[{ required: true }]}>
        <Select placeholder="Select position side" allowClear>
          <Option value="LONG">LONG</Option>
          <Option value="SHORT">SHORT</Option>
        </Select>
      </Form.Item>

      <Form.Item
        label="First Order Amount"
        name="AMOUNT"
        rules={[
          {
            required: true,
            message: 'Please enter your initial order amount',
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.List name="GRID">
        {(fields, { add, remove }) => {
          return (
            <div>
              {fields.map((field) => (
                <Space key={field.key} style={{ display: 'flex' }} align="start">
                  <Form.Item
                    {...field}
                    label="Price Step"
                    name={[field.name, 'PRICE_STEP']}
                    fieldKey={[field.fieldKey, 'PRICE_STEP']}
                    rules={[{ required: true, message: 'Missing value' }]}
                  >
                    <Input placeholder="20" />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    label="X Amount"
                    name={[field.name, 'X_AMOUNT']}
                    fieldKey={[field.fieldKey, 'X_AMOUNT']}
                    rules={[{ required: true, message: 'Missing value' }]}
                  >
                    <Input placeholder="2" />
                  </Form.Item>

                  <MinusCircleOutlined
                    onClick={() => {
                      remove(field.name)
                    }}
                  />
                </Space>
              ))}

              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => {
                    add()
                  }}
                  block
                >
                  <PlusOutlined /> Add grid row
                </Button>
              </Form.Item>
            </div>
          )
        }}
      </Form.List>

      <Form.Item
        label="Take Profit minimum %"
        name="TP_MIN_PERCENT"
        rules={[
          {
            required: true,
            message: 'Please enter your take profit % value',
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Take Profit maximum %"
        name="TP_MAX_PERCENT"
        rules={[
          {
            required: true,
            message: 'Please enter your take profit % value',
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Take Profit maximum number of orders"
        name="TP_MAX_COUNT"
        rules={[
          {
            required: true,
            message: 'Please enter max number of take profit orders',
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Stop Profit %"
        name="SP_PERCENT"
        rules={[
          {
            required: true,
            message: 'Please enter your stop profit % value',
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Stop Profit % Trigger"
        name="SP_PERCENT_TRIGGER"
        rules={[
          {
            required: true,
            message: 'Please enter your stop profit % trigger value',
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Stop Loss %"
        name="SL_PERCENT"
        rules={[
          {
            required: true,
            message: 'Please enter your stop loss % value',
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Number of closed positions"
        name="TRADES_COUNT"
      >
        <Input disabled />
      </Form.Item>

      <Form.Item
        label="Number of closed positions till pause bot"
        name="TRADES_TILL_STOP"
        rules={[
          {
            required: true,
            message: 'Please enter number of trades to pause bot',
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item {...tailLayout}>
        <Button type="primary" htmlType="submit">
          Save
        </Button>
      </Form.Item>
    </Form>
  )
}

export default Main
