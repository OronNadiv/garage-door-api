const verbose = require('debug')('ha:workers:open_door:verbose')
const info = require('debug')('ha:workers:open_door:info')
const error = require('debug')('ha:workers:open_door:error')

const Amqp = require('amqplib-easy')
const config = require('../config')
const moment = require('moment')
const Promise = require('bluebird')
const State = require('../db/models/state')

const amqp = Amqp(config.amqp.url)

amqp.consume({
  queue: config.amqp.queue
}, data => {
  verbose('consume called.  data:', !!data)
  const state = data.json
  verbose('state:', state)

  return State.fetchLatest({by: {group_id: state.group_id}})
    .then(state => {
      verbose('latest state. state:', state ? state.toJSON() : state)
      if (!state) {
        verbose('state is null')
        return
      }

      if (!state.get('is_open')) {
        verbose('state is not open')
        return
      }

      const minutes = moment.utc().diff(moment.utc(state.get('created_at')), 'minutes')

      if (minutes < config.openDoorAlertsIntervalsInMinutes) {
        return
      }

      info('calling state to send notifications and queue a delayed message.')

      return Promise
        .resolve(state.sendOpenDoorAlert())
        .then(state.pushToDelayQueue.bind(state))
        .catch(err => {
          error('While sending email/sms/call.  state:', state.toJSON(), 'err:', err)
        })
    })
})
