const Bookshelf = require('../../src/db/bookshelf')

const Model = Bookshelf.Model.extend({
  tableName: 'public.groups'
})

module.exports = (factory) => {
  factory.define('group', Model, {
    name: factory.chance.name(),
    emails: [factory.chance.email()],
    phones: [factory.chance.phone()]
  })
}
