const { promisify } = require('util')
const { Discovery, Control } = require('magic-home')
const { Iot } = require("aws-sdk")
const awsIot = require('aws-iot-device-sdk')

Control.prototype.queryState = promisify(Control.prototype.queryState)
Control.prototype.turnOff = promisify(Control.prototype.turnOff)
Control.prototype.turnOn = promisify(Control.prototype.turnOn)
const discovery = new Discovery()
const seconds_between_discovery = 1
const seconds_for_discovery = 0.5
const seconds_between_query_check = 2
const { AWS_IOT_ENDPOINT_HOST } = process.env

const iot = new Iot()

var thingShadows = awsIot.thingShadow({
  clientId: "magichome",
  host: AWS_IOT_ENDPOINT_HOST,
  protocol: 'wss'
})

const lights = {}
const subscriptions = {}

const run_discovery = () => discovery.scan(seconds_for_discovery * 1000)
  .then(devices => devices.map(device => lights[`magichome_${device.id}`] = new Control(device.address)))
  .then(() => update_iot_subscriptions(lights))

const update_iot_subscriptions = async lights => Object.entries(lights).forEach(async ([thingName, light]) => {
  if (subscriptions[thingName])
    return
  subscriptions[thingName] = true
  const thing = { thingName: thingName, thingTypeName: "magichome" }
  try {
    await iot.updateThing(thing).promise()
  } catch (error) {
    await iot.createThing(thing).promise()
  }
  thingShadows.register(thing.thingName)
})

const run_query_check = () =>
  Object.entries(lights).forEach(([thingName, light]) =>
    light.queryState()
      .then(state => thingShadows.update(thingName, { state: { reported: state } }))
  )

setInterval(run_discovery, seconds_between_discovery * 1000)
setInterval(run_query_check, seconds_between_query_check * 1000)

thingShadows.on('delta', async (thingName, stateObject) => {
  if (stateObject.state.on === true)
    lights[thingName].turnOn()
  if (stateObject.state.on === false)
    lights[thingName].turnOff()

  console.log(`received delta on ${thingName}: ${JSON.stringify(stateObject)}`)
  await thingShadows.update(thingName, { state: { desired: { on: null } } })
  run_query_check()
})

thingShadows.on('connect', () => console.log('connected to AWS IoT'))
thingShadows.on('close', () => console.log('closed'))
thingShadows.on('reconnect', () => console.log('reconnect'))
thingShadows.on('offline', () => console.log('offline'))
thingShadows.on('error', () => console.log('error', error))