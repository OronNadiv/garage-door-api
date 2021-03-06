const Promise = require('bluebird')
const Bookshelf = require('../bookshelf')
const config = require('../../config')
const State = require('../models/state')

const second = 1000
const minute = second * 60
const hour = minute * 60
const day = hour * 24

const states = Bookshelf.Collection.extend({
  tableName: 'states',
  model: State
})

states.purge = () => {
  Promise
    .resolve(states
      .forge()
      .query((qb) => {
        const d = new Date()
        d.setDate(d.getDate() - config.keepHistoryInDays)
        qb.where('created_at', '<', d)
      })
      .fetch()
    )
    .get('models')
    .map((model) => {
      return model.destroy()
    })
    .delay(day)
    .then(() => {
      return states.purge()
    })
}

module.exports = states
