import UserFixture from '../../fixtures/user'
import Promise from 'bluebird'
import State from '../../../src/db/models/state'
import should from 'should'
import Toggle from '../../../src/db/models/toggle'

const userFixture = new UserFixture()

describe('State model', () => {
  let context

  before(() => {
    return Promise
      .resolve(userFixture.create())
      .then((result) => {
        context = result
        context.options = {by: context.user.toJSON()}
      })
  })

  after(() => {
    return userFixture.cleanup()
  })

  describe('State Model', () => {
    it('create state with no toggle request', () => {
      return Promise
        .try(() => {
          return new State().save({is_open: true}, context.options)
        })
        .then(model => {
          should.not.exist(model.get('requested_by_id'))
        })
    })

    it('create state with toggle request', () => {
      return Promise
        .try(() => {
          return new Toggle().save({user_id: context.user.id}, context.options)
        })
        .delay(Math.random() * 2000)
        .then(() => {
          return new State().save({is_open: true}, context.options)
        })
        .then(model => {
          should(model.get('requested_by_id')).equal(context.user.id)
        })
    })
  })
})
