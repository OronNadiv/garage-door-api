const error = require('debug')('ha:app:error')

import domain from 'domain'
import diehard from 'diehard'
import Promise from 'bluebird'
import States from './db/collections/states'
import State from './db/models/state'
import Toggles from './db/collections/toggles'
import expressInitializer from './initializations/express'
import './workers/open_door'

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
