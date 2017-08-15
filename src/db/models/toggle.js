const verbose = require('debug')('ha:db:models:toggle:verbose')

const Bookshelf = require('../bookshelf')
const config = require('../../config')
const Promise = require('bluebird')
const util = require('util')

const md5 = require('md5')
const PubNub = require('pubnub')
const { publishKey, subscribeKey } = config.pubNub

module.exports = Bookshelf.Model.extend({
  tableName: 'toggles',
  hasTimestamps: true,
  initialize () {
    this.on('saving', (model, attrs, options) => {
      model.set('group_id', options.by.group_id)
    })

    this.on('created', (models, attrs, options) => {
      return Promise
        .try(() => {
          verbose('sending message to client. group_id:', options.by.group_id)
          const msg = util.format('On %s, %s asked to open/close the garage door.', new Date(), options.by.name)

          const authKey = md5(options.by.token)
          const publisher = new PubNub({
            publishKey,
            subscribeKey,
            authKey,
            ssl: true
          })

          const publishMessage = (channel, payload) => {
            return new Promise((resolve, reject) => {
              const publishConfig = {
                message: {
                  system: 'GARAGE',
                  type: 'TOGGLE_CREATED',
                  payload
                },
                channel
              }
              publisher.publish(publishConfig, (status) => {
                switch (status.statusCode) {
                  case 200:
                    info('Publish complete successfully.',
                      'Hashed authKey:', md5(authKey))
                    return resolve()
                  default:
                    error('Publish failed.',
                      'Hashed authKey:', md5(authKey),
                      'status:', status)
                    reject(status)
                }
              })

            })
          }

          return Promise.all([
            publishMessage(`${options.by.group_id}`, msg),
            publishMessage(`${options.by.group_id}-trusted`, msg)
          ])
        })
    })

    this.on('updating', () => {
      throw new Error('Toggle cannot be changed after creation.')
    })
  }
})
