import config from '../../src/config'
import factory from '../factory'
import fs from 'fs'
import GroupFixture from './group'
import jwt from 'jsonwebtoken'
import LoginFixture from './login'
import Request from '../routes/request'
import path from 'path'
import Promise from 'bluebird'

const groupFixture = new GroupFixture()
const loginFixture = new LoginFixture()

class User {
  create () {
    const context = {}
    return Promise
      .resolve(Request)
      .then((req) => {
        context.request = req
      })
      .then(() => {
        return Promise.all([
          groupFixture.create(),
          loginFixture.create()
        ])
      })
      .spread(({group}, {login}) => {
        Object.assign(context, {group, login})
        return factory.create('user', {
          group_id: group.id,
          login_id: login.id
        })
          .tap((user) => {
            Object.assign(context, {user})
            return group.save({owner_id: user.id})
          })
      })
      .then((user) => {
        config.authPublicKey = fs.readFileSync(path.join(__dirname, '../keys/public_key.pem'))
        context.token = `Bearer ${jwt.sign(user.toJSON(), fs.readFileSync(path.join(__dirname, '../keys/private_key.pem')), {
          algorithm: 'RS256',
          issuer: 'urn:home-automation/login',
          audience: 'urn:home-automation/*',
          subject: user.get('email'),
          expiresIn: user.get('token_expires_in_minutes') * 60
        })}`
      })
      .return(context)
  }

  cleanup () {
    return factory.cleanup()
  }
}

export default User
