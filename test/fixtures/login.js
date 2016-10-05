const factory = require('../factory')
const Promise = require('bluebird')

class Group {
  create () {
    return Promise
      .resolve(factory.create('login'))
      .then((login) => {
        return {login}
      })
  }

  cleanup () {
    return factory.cleanup()
  }
}

module.exports = Group
