import {Router} from 'express'
import Promise from 'bluebird'
import Toggle from '../db/models/toggle'

const router = new Router()

// request to change door state.
router.post('/toggles', (req, res, next) => {
  const options = {by: req.client}

  Promise
    .resolve(Toggle.forge().save({
      group_id: options.by.group_id,
      user_id: options.by.id
    }, options))
    .then(() => {
      res.sendStatus(204)
    })
    .catch(next)
})

export default router
