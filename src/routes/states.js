const verbose = require('debug')('ha:routes:states:verbose')
const info = require('debug')('ha:routes:states:info')

const _ = require('underscore')
const Promise = require('bluebird')
const Router = require('express').Router
const State = require('../db/models/state')

const router = new Router()

router.post('/states', (req, res, next) => {
  verbose('Incoming request post /states.  body:', req.body)
  const isOpen = _.isBoolean(req.body.is_open) ? req.body.is_open : req.body.is_open === 'true'
  const options = {by: req.client}
  Promise
    .resolve(State.fetchLatest(options))
    .then(model => {
      if (model && (model.get('is_open') === isOpen)) {
        info(
          'Received a state change.  New state is the same as the current one.  Current state:',
          model ? model.get('is_open') : 'null',
          'new State:',
          isOpen
        )
        return
      }
      info(
        'Received a new state.  Current state:',
        model ? model.get('is_open') : 'null',
        'new State:',
        isOpen
      )
      return State.forge().save({is_open: isOpen, group_id: req.client.group_id}, options)
    })
    .then(() => {
      res.sendStatus(201)
    })
    .catch(next)
})

module.exports = router
