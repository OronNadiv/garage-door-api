const verbose = require('debug')('ha:db:models:state:verbose')
const error = require('debug')('ha:db:models:state:error')

import {createClient} from 'redis'
import _ from 'underscore'
import Amqp from 'amqplib-easy'
import Bookshelf from '../bookshelf'
import config from '../../config'
import emitter from 'socket.io-emitter'
import JWTGenerator from 'jwt-generator'
import moment from 'moment'
import Promise from 'bluebird'
import request from 'http-as-promised'
import Toggle from './toggle'
import url from 'url'
import User from './user'

const amqp = Amqp(config.amqp.url)
const jwtGenerator = new JWTGenerator(config.loginUrl, config.privateKey, false, 'urn:home-automation/garage')

export default _.extend(
  Bookshelf.Model.extend({
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
          .try(() => {
            return Toggle.forge().query(qb => {
              const now = new Date()
              qb.where('created_at', '<', now)
              qb.where('created_at', '>', new Date(now.getTime() - 1000 * 20)) // 20 seconds till the garage door goes all the way down.
              qb.where('group_id', '=', options.by.group_id)
            }).fetch(options)
          })
          .then(toggle => {
            if (!toggle) {
              return
            }
            model.set('requested_by_id', toggle.get('user_id'))
          })
      })

      this.on('created', model => {
        verbose('created event.  model.get(\'is_open\')', model.get('is_open'))

        if (!model.get('is_open')) {
          return
        }
        model.pushToDelayQueue()
      })

      this.on('created', (model, attrs, options) => {
        let client
        return Promise
          .resolve(model.get('requested_by_id') && (!model.related('requestedBy') || !model.related('requestedBy').id) ? model.load(['requestedBy'], options) : Promise.resolve())
          .then(() => {
            client = createClient(config.redisUrl)

            return Promise
              .try(() => {
                verbose('sending message to client. group_id:', options.by.group_id)

                const io = emitter(client)
                io.of(`/${options.by.group_id}-trusted`).to('garage-doors').emit('STATE_CREATED', model.toJSON())
                io.of(`/${options.by.group_id}`).to('garage-doors').emit('STATE_CREATED', _.pick(model.toJSON(), 'is_open'))
              })
              .finally(() => {
                if (client) {
                  client.quit()
                  client = null
                }
              })
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
          .then(token => {
            verbose(
              'Garage door state has changed.  New state:',
              model.get('is_open'),
              'notifying alarm server.  token:',
              !!token
            )
            return Promise
              .resolve(request({
                url: url.resolve(config.alarmUrl, 'motions'),
                method: 'POST',
                auth: {
                  bearer: token
                },
                form: {sensor_name: 'Garage Door'}
              }))
          })
          .catch(err => {
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
        }
      }, this.toJSON(), properties)
    },
    sendOpenDoorAlert () {
      const minutes = moment.utc().diff(moment.utc(this.get('created_at')), 'minutes')
      const subject = 'OPEN GARAGE DOOR ALERT!'
      const text = `Your garage door has been open for the last ${minutes} minutes.`

      return Promise
        .resolve(jwtGenerator.makeToken(subject, 'urn:home-automation/notifications', this.toJSON()))
        .then(token => {
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
  }),
  {
    fetchLatest (options) {
      return exports['default'].forge()
        .query(qb => {
          qb.where('group_id', '=', options.by.group_id)
          qb.orderBy('created_at', 'DESC')
        })
        .fetch(options)
    },

    fetchCurrentlyOpen (options) {
      return exports['default'].forge()
        .query(qb => {
          qb.whereRaw('id in (select max(id) from garage.states group by group_id)')
          qb.where('is_open', '=', true)
        })
        .fetchAll(options)
    },

    checkForOpenDoors () {
      return Promise
        .resolve(exports['default'].fetchCurrentlyOpen())
        .get('models')
        .map(model => {
          const minutes = moment.utc().diff(moment.utc(model.get('created_at')), 'minutes')
          return Promise.all([
            model.pushToDelayQueue(),
            minutes > config.openDoorAlertsIntervalsInMinutes
              ? model.sendOpenDoorAlert()
              : Promise.resolve()
          ])
        })
    }
  }
)
