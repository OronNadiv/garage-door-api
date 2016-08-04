import factory from '../factory'
import Promise from 'bluebird'
import Request from './request'
import should from 'should'
import UserFixture from '../fixtures/user'

const userFixture = new UserFixture()
let context

describe.skip('State route tests', () => {
  before(() => {
    return Promise
      .resolve(userFixture.create('user'))
      .then((res) => {
        context = res
        return Request
      })
      .then(req => {
        context.request = req
      })
      .then(() => {
        return factory.create('state', {is_open: false})
      })
  })

  after(() => {
    userFixture.cleanup()
    return factory.cleanup()
  })

  it('/states get - should return recent states. last state is false', () => {
    return context.request
      .get('/states')
      .set('Accept', 'application/json')
      .set('authorization', context.token)
      .set('x-forwarded-proto', 'https')
      .send()
      .expect(200)
      .then(res => {
        res.body[0].is_open.should.be.equal(false)
      })
  })

  it('/states post - should turn state to open.', () => {
    return context.request
      .post('/states')
      .set('Accept', 'application/json')
      .set('authorization', context.token)
      .set('x-forwarded-proto', 'https')
      .send({is_open: true})
      .expect(201)
      .then(res => {
        res.body.should.eql({})
      })
  })

  it('/states should return recent states. last state is true', () => {
    return context.request
      .get('/states')
      .set('Accept', 'application/json')
      .set('authorization', context.token)
      .set('x-forwarded-proto', 'https')
      .send()
      .expect(200)
      .then(res => {
        should.exist(res.body.length)
        res.body[0].is_open.should.be.equal(true)
      })
  })
})
