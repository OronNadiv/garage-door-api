const verbose = require('debug')('ha:db:models:toggle:verbose')

const Bookshelf = require('../bookshelf')
const config = require('../../config')
const util = require('util')
const {publish} = require('home-automation-pubnub').Publisher
const Promise = require('bluebird')
const JWTGenerator = require('jwt-generator')
const jwtGenerator = new JWTGenerator({
  loginUrl: config.loginUrl,
  privateKey: config.privateKey,
  useRetry: false,
  issuer: 'urn:home-automation/garage'
})
const uuid = 'garage-door-api'

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

      const {id, group_id} = options.by
      return Promise
        .resolve(
          jwtGenerator.makeToken({
            subject: `User garage toggle request. userId: ${options.by.id}, groupId: ${options.by.group_id}`,
            audience: 'urn:home-automation/garage',
            payload: {id, group_id}
          })
        )
        .then((token) => {
          return Promise.all([
            publish({
              groupId: group_id,
              isTrusted: true,
              system: 'GARAGE',
              type: 'TOGGLE_CREATED',
              payload: msg,
              token,
              uuid
            }),
            publish({
              groupId: group_id,
              isTrusted: false,
              system: 'GARAGE',
              type: 'TOGGLE_CREATED',
              payload: msg,
              token,
              uuid
            })
          ])
        })
    })

    this.on('updating', () => {
      throw new Error('Toggle cannot be changed after creation.')
    })
  }
})
