const _ = require('underscore')
const Promise = require('bluebird')
const States = require('../db/collections/states')
const State = require('../db/models/state')
const moment = require('moment')
const Toggle = require('../db/models/toggle')

module.exports = {
  Query: {
    states (root, {count}, {client}) {
      const options = {by: client}
      return Promise
        .try(() => {
          return new States().query(qb => {
            qb.orderBy('created_at', 'DESC')
            qb.limit(count)
          }).fetch(_.extend({withRelated: ['requestedBy']}, options))
        })
        .call('toJSON')
        .then(collection => {
          collection = collection.map(state => {
            return {
              id: state.id,
              requestedBy: state.requestedBy,
              createdAt: moment(state.created_at).format(),
              updatedAt: moment(state.updated_at).format(),
              isOpen: state.is_open
            }
          })
          if (!options.by.is_trusted) {
            collection = collection.length
              ? [{isOpen: collection[0].isOpen}]
              : []
          }

          return collection
        })
    }
  },
  Mutation: {
    // request to change door state.
    createToggle (root, args, {client}) {
      const options = {by: client}
      return Promise
        .resolve(Toggle.forge().save({
          group_id: options.by.group_id,
          user_id: options.by.id
        }, options))
        .then(({id}) => {
          return {id}
        })
    },
    createState (root, {isOpen}, {client}) {
      verbose('Incoming request post /states.  isOpen:', isOpen)
      const options = {by: client}
      return Promise
        .resolve(State.fetchLatest(options))
        .then(model => {
          if (model && (model.get('is_open') === isOpen)) {
            info(
              'Received a state change.  New state is the same as the current one.  Current state:',
              model ? model.get('is_open') : 'null',
              'new State:',
              isOpen
            )
            return
          }
          info(
            'Received a new state.  Current state:',
            model ? model.get('is_open') : 'null',
            'new State:',
            isOpen
          )
          return State.forge().save({is_open: isOpen, group_id: options.by.group_id}, options)
        })
        .then(({id}) => {
          return {id}
        })
    }
  }
}
