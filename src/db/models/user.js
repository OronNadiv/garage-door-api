const Bookshelf = require('../bookshelf')
require('../../config')

module.exports = Bookshelf.Model.extend({
  tableName: 'public.users',
  hasTimestamps: true,
  hidden: ['password_hash', 'failed_login_attempts', 'email']
})
