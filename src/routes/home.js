import {Router} from 'express'
import config from '../config'

const router = new Router()

router.get('/', (req, res) => {
  return res.redirect(config.uiUrl)
})

export default router
