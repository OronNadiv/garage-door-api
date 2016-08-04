import _ from 'underscore'
import Promise from 'bluebird'
import Bookshelf from '../bookshelf'
import config from '../../config'
import Toggle from '../models/toggle'

export default _.extend(Bookshelf.Collection.extend({
  tableName: 'toggles',
  model: Toggle
}),
  {
    purge () {
      const second = 1000
      const minute = second * 60
      const hour = minute * 60
      const day = hour * 24

      setInterval(() => {
        Promise
          .try(() => {
            return exports['default'].forge().query(qb => {
              const d = new Date()
              d.setDate(d.getDate() - config.keepHistoryInDays)
              qb.where('created_at', '<', d)
            }).fetch()
          })
          .get('models')
          .map(model => {
            return model.destroy()
          })
      }, day)
    }
  })
