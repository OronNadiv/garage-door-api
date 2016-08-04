import factory from '../factory'
import Promise from 'bluebird'

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

export default Group
