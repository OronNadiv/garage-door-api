const config = require('../config')
const Router = require('express').Router

const router = new Router()

router.get('/', (req, res) => {
  return res.redirect(config.uiUrl)
})

module.exports = router
