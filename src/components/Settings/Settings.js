import React from 'react'
import moment from 'moment'
import { Form, Input, Button, Collapse, DatePicker, Radio, Space } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import Store from 'electron-store'

const { Panel } = Collapse
const { RangePicker } = DatePicker

const grids = {
  330: [
    { PRICE_STEP: 10, X_AMOUNT: 1 },
    { PRICE_STEP: 30, X_AMOUNT: 3 },
    { PRICE_STEP: 50, X_AMOUNT: 3 },
    { PRICE_STEP: 60, X_AMOUNT: 1.6 },
    { PRICE_STEP: 80, X_AMOUNT: 1.6 },
    { PRICE_STEP: 100, X_AMOUNT: 2 },
  ],

  350: [
    { PRICE_STEP: 20, X_AMOUNT: 1 },
    { PRICE_STEP: 20, X_AMOUNT: 3 },
    { PRICE_STEP: 50, X_AMOUNT: 3 },
    { PRICE_STEP: 60, X_AMOUNT: 1.6 },
    { PRICE_STEP: 80, X_AMOUNT: 1.6 },
    { PRICE_STEP: 120, X_AMOUNT: 2 },
  ],

  125: [
    { PRICE_STEP: 4, X_AMOUNT: 1 },
    { PRICE_STEP: 9, X_AMOUNT: 3 },
    { PRICE_STEP: 12, X_AMOUNT: 3 },
    { PRICE_STEP: 20, X_AMOUNT: 1.6 },
    { PRICE_STEP: 30, X_AMOUNT: 1.6 },
    { PRICE_STEP: 50, X_AMOUNT: 2 },
  ],

  200: [
    { PRICE_STEP: 3, X_AMOUNT: 1 },
    { PRICE_STEP: 7, X_AMOUNT: 1 },
    { PRICE_STEP: 10, X_AMOUNT: 1 },
    { PRICE_STEP: 20, X_AMOUNT: 3 },
    { PRICE_STEP: 30, X_AMOUNT: 2 },
    { PRICE_STEP: 60, X_AMOUNT: 2 },
    { PRICE_STEP: 70, X_AMOUNT: 3 },
  ],

  250: [
    { PRICE_STEP: 10, X_AMOUNT: 1 },
    { PRICE_STEP: 10, X_AMOUNT: 3 },
    { PRICE_STEP: 30, X_AMOUNT: 3 },
    { PRICE_STEP: 50, X_AMOUNT: 1.6 },
    { PRICE_STEP: 60, X_AMOUNT: 1.6 },
    { PRICE_STEP: 90, X_AMOUNT: 2 },
  ],
}

const tpGrids = {
  default: [
    { MIN_PERCENT: 0.25, MAX_PERCENT: 0.6, MAX_COUNT: 6 },
    { MIN_PERCENT: 0.2, MAX_PERCENT: 0.6, MAX_COUNT: 6 },
    { MIN_PERCENT: 0.18, MAX_PERCENT: 0.6, MAX_COUNT: 5 },
    { MIN_PERCENT: 0.14, MAX_PERCENT: 0.5, MAX_COUNT: 4 },
    { MIN_PERCENT: 0.11, MAX_PERCENT: 0.4, MAX_COUNT: 3 },
    { MIN_PERCENT: 0.1, MAX_PERCENT: 0.3, MAX_COUNT: 3 },
  ]
}

const spGrids = {
  default: [
    { TRIGGER_PERCENT: 0.25, MIN_PERCENT: 0.2 },
    { TRIGGER_PERCENT: 0.2, MIN_PERCENT: 0.15 },
    { TRIGGER_PERCENT: 0.2, MIN_PERCENT: 0.13 },
    { TRIGGER_PERCENT: 0.2, MIN_PERCENT: 0.12 },
    { TRIGGER_PERCENT: 0.13, MIN_PERCENT: 0.1 },
    { TRIGGER_PERCENT: 0.12, MIN_PERCENT: 0.1 },
  ]
}

const Settings = () => {
  const store = new Store()
  const config = store.get()
  const initialValues = {
    ...config,
    POSITIONS: config.POSITIONS.map((p) => ({
      ...p,
      DATETIME_RANGE: p.DATETIME_RANGE.map((date) => moment(date)),
    })),
  }

  const [form] = Form.useForm()
  const onFinish = (values) => {
    console.log('Success:', values)
    store.set(values)
  }

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo)
  }

  return (
    <Form
      form={form}
      name="basic"
      size="small"
      initialValues={initialValues}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <Form.List name="POSITIONS">
        {(fields, { add, remove }) => {
          return (
            <div>
              {fields.map((field) => (
                <div>
                  <Space key={field.key} size="small" align="center">
                    <Form.Item
                      {...field}
                      label="Symbol"
                      name={[field.name, 'SYMBOL']}
                      fieldKey={[field.fieldKey, 'SYMBOL']}
                      rules={[{ required: true, message: 'Missing value' }]}
                    >
                      <Input placeholder="BTCUSDT" />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      label="Position Side"
                      name={[field.name, 'SIDE']}
                      fieldKey={[field.fieldKey, 'SIDE']}
                      rules={[{ required: true, message: 'Missing value' }]}
                    >
                      <Radio.Group
                        defaultValue="LONG"
                        options={[
                          { label: 'LONG', value: 'LONG' },
                          { label: 'SHORT', value: 'SHORT' },
                        ]}
                        optionType="button"
                        buttonStyle="solid"
                      />
                    </Form.Item>

                    <MinusCircleOutlined
                      onClick={() => {
                        remove(field.name)
                      }}
                    />
                  </Space>

                  <Collapse>
                    <Panel key="1" header="Settings">
                      <Form.Item
                        {...field}
                        label="First Order Amount"
                        name={[field.name, 'AMOUNT']}
                        fieldKey={[field.fieldKey, 'AMOUNT']}
                        rules={[
                          {
                            required: true,
                            message: 'Please enter your initial order amount',
                          },
                        ]}
                      >
                        <Input />
                      </Form.Item>

                      <Form.Item
                        {...field}
                        label="First order price type"
                        name={[field.name, 'PRICE_TYPE']}
                        fieldKey={[field.fieldKey, 'PRICE_TYPE']}
                        rules={[
                          {
                            required: false,
                            message: 'Please enter your initial order price',
                          },
                        ]}
                      >
                        <Radio.Group
                          options={[
                            { label: 'Price Distance', value: 'distance' },
                            { label: 'Price', value: 'price' },
                          ]}
                          optionType="button"
                          buttonStyle="solid"
                          defaultValue="distance"
                        />
                      </Form.Item>

                      <Form.Item noStyle shouldUpdate={() => true}>
                        {({ getFieldValue }) =>
                          getFieldValue('POSITIONS')[field.name].PRICE_TYPE === 'distance' && (
                            <Form.Item
                              {...field}
                              label="First Order Price Distance"
                              name={[field.name, 'PRICE_DISTANCE']}
                              fieldKey={[field.fieldKey, 'PRICE_DISTANCE']}
                              rules={[
                                {
                                  required: true,
                                  message:
                                    'Please enter your initial order price distance from quote price',
                                },
                              ]}
                            >
                              <Input />
                            </Form.Item>
                          )
                        }
                      </Form.Item>

                      <Form.Item noStyle shouldUpdate={() => true}>
                        {({ getFieldValue }) =>
                          getFieldValue('POSITIONS')[field.name].PRICE_TYPE === 'price' && (
                            <Form.Item
                              {...field}
                              label="First Order Price"
                              name={[field.name, 'PRICE']}
                              fieldKey={[field.fieldKey, 'PRICE']}
                              rules={[
                                {
                                  required: true,
                                  message: 'Please enter your initial order price',
                                },
                              ]}
                            >
                              <Input />
                            </Form.Item>
                          )
                        }
                      </Form.Item>

                      <p>
                        <strong>Price and amount grid:</strong>
                        <br />
                        Orders will be created based on price step and x amount
                      </p>

                      <Radio.Group
                        options={Object.keys(grids).map((item) => ({ label: item, value: item }))}
                        optionType="button"
                        buttonStyle="solid"
                        onChange={(e) => {
                          const { POSITIONS } = form.getFieldsValue()
                          POSITIONS[field.name].GRID = grids[e.target.value]
                          form.setFieldsValue({ POSITIONS })
                        }}
                      />

                      <Form.List name={[field.name, 'GRID']}>
                        {(gridFields, { add, remove }) => {
                          return (
                            <div>
                              {gridFields.map((gridField) => (
                                <Space key={gridField.key} size="small" align="center">
                                  <Form.Item
                                    {...gridField}
                                    label="Price Step"
                                    name={[gridField.name, 'PRICE_STEP']}
                                    fieldKey={[gridField.fieldKey, 'PRICE_STEP']}
                                    rules={[{ required: true, message: 'Missing value' }]}
                                  >
                                    <Input placeholder="20" />
                                  </Form.Item>
                                  <Form.Item
                                    {...gridField}
                                    label="X Amount"
                                    name={[gridField.name, 'X_AMOUNT']}
                                    fieldKey={[gridField.fieldKey, 'X_AMOUNT']}
                                    rules={[{ required: true, message: 'Missing value' }]}
                                  >
                                    <Input placeholder="2" />
                                  </Form.Item>

                                  <MinusCircleOutlined
                                    onClick={() => {
                                      remove(gridField.name)
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

                      <p>
                        <strong>Take Profit grid:</strong>
                        <br />
                        Percentage range for take profit orders based on position size
                      </p>

                      <Radio.Group
                        options={Object.keys(tpGrids).map((item) => ({ label: item, value: item }))}
                        optionType="button"
                        buttonStyle="solid"
                        onChange={(e) => {
                          const { POSITIONS } = form.getFieldsValue()
                          POSITIONS[field.name].TP_GRID = tpGrids[e.target.value]
                          form.setFieldsValue({ POSITIONS })
                        }}
                      />

                      <Form.List name={[field.name, 'TP_GRID']}>
                        {(gridFields, { add, remove }) => {
                          return (
                            <div>
                              {gridFields.map((gridField) => (
                                <Space key={gridField.key} size="small" align="center">
                                  <Form.Item
                                    {...gridField}
                                    label="From %"
                                    name={[gridField.name, 'MIN_PERCENT']}
                                    fieldKey={[gridField.fieldKey, 'MIN_PERCENT']}
                                    rules={[{ required: true, message: 'Missing value' }]}
                                  >
                                    <Input placeholder="0.15" />
                                  </Form.Item>
                                  <Form.Item
                                    {...gridField}
                                    label="To %"
                                    name={[gridField.name, 'MAX_PERCENT']}
                                    fieldKey={[gridField.fieldKey, 'MAX_PERCENT']}
                                    rules={[{ required: true, message: 'Missing value' }]}
                                  >
                                    <Input placeholder="0.6" />
                                  </Form.Item>
                                  <Form.Item
                                    {...gridField}
                                    label="Orders (maximum)"
                                    name={[gridField.name, 'MAX_COUNT']}
                                    fieldKey={[gridField.fieldKey, 'MAX_COUNT']}
                                    rules={[{ required: true, message: 'Missing value' }]}
                                  >
                                    <Input placeholder="6" />
                                  </Form.Item>

                                  <MinusCircleOutlined
                                    onClick={() => {
                                      remove(gridField.name)
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
                                  <PlusOutlined /> Add take profit grid row
                                </Button>
                              </Form.Item>
                            </div>
                          )
                        }}
                      </Form.List>

                      <p>
                        <strong>Stop Without Loss grid:</strong>
                        <br />
                        Percentage when to add trailing stop loss and minumum when close position
                      </p>

                      <Radio.Group
                        options={Object.keys(tpGrids).map((item) => ({ label: item, value: item }))}
                        optionType="button"
                        buttonStyle="solid"
                        onChange={(e) => {
                          const { POSITIONS } = form.getFieldsValue()
                          POSITIONS[field.name].SP_GRID = spGrids[e.target.value]
                          form.setFieldsValue({ POSITIONS })
                        }}
                      />

                      <Form.List name={[field.name, 'SP_GRID']}>
                        {(gridFields, { add, remove }) => {
                          return (
                            <div>
                              {gridFields.map((gridField) => (
                                <Space key={gridField.key} size="small" align="center">
                                  <Form.Item
                                    {...gridField}
                                    label="Trigger %"
                                    name={[gridField.name, 'TRIGGER_PERCENT']}
                                    fieldKey={[gridField.fieldKey, 'TRIGGER_PERCENT']}
                                    rules={[{ required: true, message: 'Missing value' }]}
                                  >
                                    <Input placeholder="0.2" />
                                  </Form.Item>
                                  <Form.Item
                                    {...gridField}
                                    label="Minimum %"
                                    name={[gridField.name, 'MIN_PERCENT']}
                                    fieldKey={[gridField.fieldKey, 'MIN_PERCENT']}
                                    rules={[{ required: true, message: 'Missing value' }]}
                                  >
                                    <Input placeholder="0.6" />
                                  </Form.Item>

                                  <MinusCircleOutlined
                                    onClick={() => {
                                      remove(gridField.name)
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
                                  <PlusOutlined /> Add stop profit grid row
                                </Button>
                              </Form.Item>
                            </div>
                          )
                        }}
                      </Form.List>

                      <Form.Item
                        {...field}
                        label="Stop Loss %"
                        name={[field.name, 'SL_PERCENT']}
                        fieldKey={[field.fieldKey, 'SL_PERCENT']}
                        rules={[
                          {
                            required: true,
                            message: 'Please enter your stop loss % value',
                          },
                        ]}
                      >
                        <Input />
                      </Form.Item>

                      <p>
                        <strong>Pause bot:</strong>
                        <br />
                        Conditions when bot won't open new positions
                      </p>

                      <Space size="small" align="center">
                        <Form.Item
                          {...field}
                          label="Closed positions"
                          name={[field.name, 'TRADES_COUNT']}
                          fieldKey={[field.fieldKey, 'TRADES_COUNT']}
                        >
                          <Input disabled />
                        </Form.Item>
                        of
                        <Form.Item
                          label="Max positions"
                          name={[field.name, 'TRADES_TILL_STOP']}
                          fieldKey={[field.fieldKey, 'TRADES_TILL_STOP']}
                          rules={[
                            {
                              required: true,
                              message: 'Please enter number of trades to pause bot',
                            },
                          ]}
                        >
                          <Input />
                        </Form.Item>
                      </Space>

                      <Form.Item
                        {...field}
                        label="Date range"
                        name={[field.name, 'DATETIME_RANGE']}
                        fieldKey={[field.fieldKey, 'DATETIME_RANGE']}
                        rules={[
                          {
                            required: true,
                            message: 'Please enter date time range to run bot',
                          },
                        ]}
                      >
                        <RangePicker showTime />
                      </Form.Item>
                    </Panel>
                  </Collapse>
                  <br />
                </div>
              ))}

              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => {
                    add()
                  }}
                  block
                >
                  <PlusOutlined /> Add Symbol and Position Side
                </Button>
              </Form.Item>
            </div>
          )
        }}
      </Form.List>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Save
        </Button>
      </Form.Item>
    </Form>
  )
}

export default Settings
