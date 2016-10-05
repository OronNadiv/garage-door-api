const error = require('debug')('ha:app:error')

const domain = require('domain')
const diehard = require('diehard')
const Promise = require('bluebird')
const States = require('./db/collections/states')
const State = require('./db/models/state')
const Toggles = require('./db/collections/toggles')
const expressInitializer = require('./initializations/express')
require('./workers/open_door')

const d = domain.create()

d.on('error', error)

d.run(() => {
  Promise
    .try(States.purge)
    .then(Toggles.purge)
    .then(expressInitializer.initialize)
    .then(() => diehard.listen({timeout: 5000}))
    .delay(5000)
    .then(State.checkForOpenDoors)
})
