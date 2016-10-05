const Promise = require('bluebird')
const BookshelfAdapter = require('factory-girl-bookshelf')
const Chance = require('chance')
const group = require('./factories/group')
const login = require('./factories/login')
const state = require('./factories/state')
const toggle = require('./factories/toggle')
const user = require('./factories/user')
const Factory = require('factory-girl').Factory
require('should')

const chance = new Chance()

BookshelfAdapter.prototype.build = (Model, props) => {
  return new Model(props)
}

BookshelfAdapter.prototype.save = (doc, Model, cb) => {
  const options = {method: 'insert'}
  return doc.save({}, options).nodeify(cb)
}

BookshelfAdapter.prototype.destroy = (doc, Model, cb) => {
  if (!doc.id) {
    return process.nextTick(cb)
  }
  return doc.destroy().nodeify(cb)
}

const factory = new Factory()

factory.setAdapter(new BookshelfAdapter())
factory.chance = chance
state(factory)
toggle(factory)
group(factory)
login(factory)
user(factory)

module.exports = factory.promisify(Promise)

