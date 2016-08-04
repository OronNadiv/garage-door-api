import Bookshelf from '../../src/db/bookshelf'

const Model = Bookshelf.Model.extend({
  tableName: 'public.groups'
})

export default (factory) => {
  factory.define('group', Model, {
    name: factory.chance.name(),
    emails: [factory.chance.email()],
    phones: [factory.chance.phone()]
  })
}
