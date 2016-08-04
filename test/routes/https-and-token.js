import config from '../../src/config'
import UserFixture from '../fixtures/user'
import Promise from 'bluebird'

const userFixture = new UserFixture()

let context

describe('token and ssl tests', () => {
  before(() => {
    config.production = true
    return Promise
      .resolve(userFixture.create())
      .then((res) => {
        context = res
      })
  })

  after(() => {
    config.production = false
    return userFixture.cleanup()
  })

  it('/ -https -token should get 302 to https', () => {
    return context.request
      .get('/')
      .set('Accept', 'application/json')
      .send()
      .expect(302)
      .then(res => {
        res.headers.location.should.equal(config.uiUrl)
      })
  })

  it('/test -https -token should get 302 to https', () => {
    return context.request
      .get('/test')
      .set('Accept', 'application/json')
      .send()
      .expect(302)
      .then(res => {
        res.headers.location.should.startWith('https://')
      })
  })

  it('/test +https -token should get 401', () => {
    return context.request
      .get('/test')
      .set('Accept', 'application/json')
      .set('x-forwarded-proto', 'https')
      .send()
      .expect(401)
  })

  it('/test -https +token should get 302 to https', () => {
    return context.request
      .get('/test')
      .set('Accept', 'application/json')
      .set('authorization', context.token)
      .send()
      .expect(302)
      .then(res => {
        res.headers.location.should.startWith('https://')
      })
  })

  it('/test +https +token should get 404', () => {
    return context.request
      .get('/test')
      .set('Accept', 'application/json')
      .set('authorization', context.token)
      .set('x-forwarded-proto', 'https')
      .send()
      .expect(404)
  })
})
