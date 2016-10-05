const factory = require('../factory')
const Promise = require('bluebird')

class Group {
  create () {
    return Promise
      .resolve(factory.create('group'))
      .then((group) => {
        return {group}
      })
  }

  cleanup () {
    return factory.cleanup()
  }
}

module.exports = Group
