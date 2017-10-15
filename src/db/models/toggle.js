const verbose = require('debug')('ha:db:models:toggle:verbose')

const Bookshelf = require('../bookshelf')
const util = require('util')
const {publish} = require('home-automation-pubnub').Publisher
const Promise = require('bluebird')

module.exports = Bookshelf.Model.extend({
  tableName: 'toggles',
  hasTimestamps: true,
  initialize () {
    this.on('saving', (model, attrs, options) => {
      model.set('group_id', options.by.group_id)
    })

    this.on('created', (models, attrs, options) => {
      verbose('sending message to client. group_id:', options.by.group_id)
      const msg = util.format('On %s, %s asked to open/close the garage door.', new Date(), options.by.name)

      return Promise.all([
        publish({
          groupId: options.by.group_id,
          isTrusted: true,
          system: 'GARAGE',
          type: 'TOGGLE_CREATED',
          payload: msg,
          token: options.by.token,
          uuid: 'garage-door-api'
        }),
        publish({
          groupId: options.by.group_id,
          isTrusted: false,
          system: 'GARAGE',
          type: 'TOGGLE_CREATED',
          payload: msg,
          token: options.by.token,
          uuid: 'garage-door-api'
        })
      ])
    })

    this.on('updating', () => {
      throw new Error('Toggle cannot be changed after creation.')
    })
  }
})
