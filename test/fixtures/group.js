import factory from '../factory'
import Promise from 'bluebird'

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

export default Group
