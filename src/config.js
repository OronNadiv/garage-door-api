const path = require('path')
const LOG_PREFIX = `"${path.basename(__filename)}":`
const log = require('./logger')
const error = log.error.bind(log, LOG_PREFIX)

import knexPgCustomSchema from 'knex-pg-customschema'
import fs from 'fs'

const config = {production: process.env.NODE_ENV && process.env.NODE_ENV.toUpperCase() === 'PRODUCTION'}

config.alarmUrl = process.env.ALARM_URL

config.amqp = {
  url: process.env.CLOUDAMQP_URL || (config.production ? null : 'amqp://guest:guest@localhost:5672'),
  queue: 'open-door-alert'
}

if (!config.amqp.url) {
  error(
    'Amqp URL could not be found in the environment variable.  Please set \'CLOUDAMQP_URL\'.'
  )
  process.exit(1)
}

config.authPublicKey = process.env.AUTH_PUBLIC_KEY || (config.production ? null : fs.readFileSync(path.join(__dirname, '../test/keys/public_key.pem')))
if (!config.authPublicKey) {
  error(
    'Login public key could not be found in the environment variable.  Please set \'AUTH_PUBLIC_KEY\'.'
  )
  process.exit(1)
}

config.garageDoorToggleEvent = 'GARAGE_DOOR_TOGGLE'

config.keepHistoryInDays = parseInt(process.env.KEEP_HISTORY_IN_DAYS || 30, 10)

config.loginUrl = process.env.LOGIN_URL || (config.production ? null : 'http://localhost:3001')
if (!config.loginUrl) {
  error(
    'Login URL could not be found in the environment variable.  Please set \'LOGIN_URL\'.'
  )
  process.exit(1)
}

config.notificationsUrl = process.env.NOTIFICATIONS_URL || (config.production ? null : 'http://localhost:3004')
if (!config.notificationsUrl) {
  error(
    'Notifications URL could not be found in the environment variable.  Please set \'NOTIFICATIONS_URL\'.'
  )
  process.exit(1)
}

config.openDoorAlertsIntervalsInMinutes = parseInt(process.env.OPEN_DOOR_ALERTS_INTERVAL_IN_MINUTES || 15, 10)

config.port = process.env.PORT || (config.production ? null : 3003)

config.privateKey = process.env.PRIVATE_KEY || (config.production ? null : fs.readFileSync(path.join(__dirname, '../test/keys/private_key.pem')))
if (!config.privateKey) {
  error(
    'Private key could not be found in the environment variable.  Please set \'PRIVATE_KEY\'.'
  )
  process.exit(1)
}

config.postgres = process.env.DATABASE_URL || (config.production ? null : 'postgres://postgres:@localhost/home_automation')
config.postgresPool = {
  min: parseInt(process.env.POSTGRESPOOLMIN || 2, 10),
  max: parseInt(process.env.POSTGRESPOOLMAX || 10, 10),
  log: process.env.POSTGRESPOOLLOG === 'true',
  afterCreate: knexPgCustomSchema('garage')
}

config.redisUrl = process.env.REDIS_URL || process.env.REDISCLOUD_URL || (config.production ? null : 'redis://localhost:6379')
if (!config.redisUrl) {
  error(
    'Redis URL could not be found in the environment variable.  Please set \'REDIS_URL\'.'
  )
  process.exit(1)
}

config.uiUrl = process.env.UI_URL || (config.production ? null : 'http://localhost:3000')
if (!config.uiUrl) {
  error(
    'UI URL could not be found in the environment variable.  Please set \'UI_URL\'.'
  )
  process.exit(1)
}

export default config
