const verbose = require('debug')('ha:db:models:toggle:verbose')

import {createClient} from 'redis'
import Bookshelf from '../bookshelf'
import config from '../../config'
import emitter from 'socket.io-emitter'
import Promise from 'bluebird'
import util from 'util'

export default Bookshelf.Model.extend({
  tableName: 'toggles',
  hasTimestamps: true,
  initialize () {
    this.on('saving', (model, attrs, options) => {
      model.set('group_id', options.by.group_id)
    })

    this.on('created', (models, attrs, options) => {
      let client = createClient(config.redisUrl)

      return Promise
        .try(() => {
          verbose('sending message to client. group_id:', options.by.group_id)

          const io = emitter(client)
          const msg = util.format('On %s, %s asked to open/close the garage door.', new Date(), options.by.name)

          io.of(`/${options.by.group_id}`).to('garage-doors').emit('TOGGLE_CREATED', msg)
        })
        .finally(() => {
          if (client) {
            client.quit()
            client = null
          }
        })
    })

    this.on('updating', () => {
      throw new Error('Toggle cannot be changed after creation.')
    })
  }
})
