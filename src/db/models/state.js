const verbose = require('debug')('ha:db:models:state:verbose')
const error = require('debug')('ha:db:models:state:error')

const _ = require('underscore')
const Amqp = require('amqplib-easy')
const Bookshelf = require('../bookshelf')
const config = require('../../config')
const JWTGenerator = require('jwt-generator')
const moment = require('moment')
const Promise = require('bluebird')
const request = require('http-as-promised')
const Toggle = require('./toggle')
const url = require('url')
const User = require('./user')
const {publish} = require('home-automation-pubnub').Publisher

const amqp = Amqp(config.amqp.url)
const jwtGenerator = new JWTGenerator(config.loginUrl, config.privateKey, false, 'urn:home-automation/garage')

const state = Bookshelf.Model.extend({
  tableName: 'states',
  hasTimestamps: true,

  requestedBy () {
    return this.belongsTo(User, 'requested_by_id')
  },

  initialize () {
    this.on('saving', (model, attrs, options) => {
      model.set('group_id', options.by.group_id)
    })

    this.on('creating', (model, attrs, options) => {
      return Promise
        .resolve(Toggle
          .forge()
          .query((qb) => {
            const now = new Date()
            qb.where('created_at', '<', now)
            qb.where('created_at', '>', new Date(now.getTime() - 1000 * 20)) // 20 seconds till the garage door goes all the way down.
            qb.where('group_id', '=', options.by.group_id)
          })
          .fetch(options)
        )
        .then((toggle) => {
          if (!toggle) {
            return
          }
          model.set('requested_by_id', toggle.get('user_id'))
        })
    })

    this.on('created', (model) => {
      verbose('created event.  model.get(\'is_open\')', model.get('is_open'))

      if (!model.get('is_open')) {
        return
      }
      model.pushToDelayQueue()
    })

    this.on('created', (model, attrs, options) => {
      return Promise
        .resolve(model.get('requested_by_id') && (!model.related('requestedBy') || !model.related('requestedBy').id) ? model.load(['requestedBy'], options) : Promise.resolve())
        .then(() => {
          verbose('sending message to client. group_id:', options.by.group_id)

          return Promise.all([
            publish({
              groupId: options.by.group_id,
              isTrusted: true,
              system: 'GARAGE',
              type: 'STATE_CREATED',
              payload: model.toJSON(),
              token: options.by.token
            }),
            publish({
              groupId: options.by.group_id,
              isTrusted: false,
              system: 'GARAGE',
              type: 'STATE_CREATED',
              payload: _.pick(model.toJSON(), 'is_open'),
              token: options.by.token
            })
          ])
        })
    })

    this.on('created', (model, attrs, options) => {
      verbose(
        'created event.  config.alarmUrl:',
        config.alarmUrl,
        'model.get(\'is_open\')',
        model.get('is_open')
      )

      if (!config.alarmUrl) {
        verbose('Exiting since alarm url is not set.')
        return
      }

      // execute asynchronously.
      Promise
      // 'urn:home-automation/*' because we use the same token for 'alarm' and for 'notifications
        .resolve(jwtGenerator.makeToken('Garage door state has changed.', 'urn:home-automation/*', options.by))
        .then((token) => {
          verbose(
            'Garage door state has changed.  New state:',
            model.get('is_open'),
            'notifying alarm server.  token:',
            !!token
          )

          return request({
            url: url.resolve(config.alarmUrl, 'motions'),
            method: 'POST',
            auth: {
              bearer: token
            },
            form: {sensor_name: 'Garage Door'}
          })
        })
        .catch((err) => {
          error('While reporting to alarm system that the garage is open.  err:', err)
        })
    })

    this.on('updating', () => {
      throw new Error('State cannot be changed after creation.')
    })
  },
  pushToDelayQueue () {
    const minutesPassed = moment.utc().diff(moment.utc(this.get('created_at')), 'minutes')
    const minutesModulo = minutesPassed % config.openDoorAlertsIntervalsInMinutes
    const minutesLeftForNextAlert = config.openDoorAlertsIntervalsInMinutes - minutesModulo
    const millisecondsLeftForNextAlert = Math.floor(minutesLeftForNextAlert * 60 * 1000)
    const properties = {
      expiration: millisecondsLeftForNextAlert.toString(),
      persistent: true,
      headers: {
        _targetQueue: config.amqp.queue
      }
    }
    verbose(
      'minutesPassed:',
      minutesPassed,
      'minutesModulo:',
      minutesModulo,
      'minutesLeftForNextAlert:',
      minutesLeftForNextAlert,
      'millisecondsLeftForNextAlert:',
      millisecondsLeftForNextAlert
    )

    return amqp.sendToQueue({
      queue: 'amqplib-retry.delayed',
      queueOptions: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': 'amqplib-retry',
          'x-dead-letter-routing-key': 'ready'
        }
      },
      exchange: 'ha'
    }, this.toJSON(), properties)
  },
  sendOpenDoorAlert () {
    const minutes = moment.utc().diff(moment.utc(this.get('created_at')), 'minutes')
    const subject = 'OPEN GARAGE DOOR ALERT!'
    const text = `Your garage door has been open for the last ${minutes} minutes.`

    return Promise
      .resolve(jwtGenerator.makeToken(subject, 'urn:home-automation/notifications', this.toJSON()))
      .then((token) => {
        const sendEmail = request({
          url: url.resolve(config.notificationsUrl, 'emails'),
          method: 'POST',
          auth: {
            bearer: token
          },
          form: {
            subject: subject,
            text: text
          }
        })

        const makeCall = request({
          url: url.resolve(config.notificationsUrl, 'calls'),
          method: 'POST',
          auth: {
            bearer: token
          },
          form: {
            text: text
          }
        })

        const sendSms = request({
          url: url.resolve(config.notificationsUrl, 'sms'),
          method: 'POST',
          auth: {
            bearer: token
          },
          form: {
            subject: subject,
            text: text
          }
        })

        return Promise.all([sendEmail, sendSms, makeCall])
      })
  }
})

state.fetchLatest = (options) => {
  return state.forge()
    .query((qb) => {
      qb.where({group_id: options.by.group_id})
      qb.orderBy('created_at', 'DESC')
    })
    .fetch(options)
}

state.fetchCurrentlyOpen = (options) => {
  return state.forge()
    .query((qb) => {
      qb.whereRaw('id in (select max(id) from garage.states group by group_id)')
      qb.where({is_open: true})
    })
    .fetchAll(options)
}

state.checkForOpenDoors = () => {
  return Promise
    .resolve(state.fetchCurrentlyOpen())
    .get('models')
    .map((model) => {
      const minutes = moment.utc().diff(moment.utc(model.get('created_at')), 'minutes')
      return Promise.all([
        model.pushToDelayQueue(),
        minutes > config.openDoorAlertsIntervalsInMinutes
          ? model.sendOpenDoorAlert()
          : Promise.resolve()
      ])
    })
}

module.exports = state
