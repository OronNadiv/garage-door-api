import Bookshelf from '../../src/db/bookshelf'

const Model = Bookshelf.Model.extend({
  tableName: 'public.logins',
  hasTimestamps: true,
  hidden: ['password_hash', 'failed_login_attempts', 'email'],

  format (attrs) {
    if (attrs.password) {
      attrs.password_hash = attrs.password
      delete attrs.password
    }
    if (attrs.email) {
      attrs.email = attrs.email.trim()
    }

    return attrs
  }
})

export default (factory) => {
  factory.define('login', Model, {
    email: factory.chance.email(),
    password: factory.chance.word()
  })
}
