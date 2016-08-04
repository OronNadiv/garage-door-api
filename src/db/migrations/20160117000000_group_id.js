export default {
  up (knex, Promise) {
    return knex.transaction(trx => {
      return Promise
        .resolve(trx.schema.table('toggles', table => {
          table.integer('group_id').notNullable()
            .references('id')
            .inTable('public.groups')
            .onDelete('CASCADE')
            .onUpdate('CASCADE')
        }))
        .then(() => {
          return trx.raw('ALTER TABLE toggles ALTER COLUMN group_id DROP DEFAULT;')
        })
        .then(() => {
          return trx.schema.table('states', table => {
            table.integer('group_id').notNullable()
              .references('id')
              .inTable('public.groups')
              .onDelete('CASCADE')
              .onUpdate('CASCADE')
          })
        })
        .then(() => {
          return trx.raw('ALTER TABLE states ALTER COLUMN group_id DROP DEFAULT;')
        })
    })
  },

  down (knex, Promise) {
    return knex.transaction(trx => {
      return Promise
        .resolve(trx.schema.table('toggles', table => {
          table.dropColumn('group_id')
        }))
        .then(() => {
          return trx.schema.table('states', table => {
            table.dropColumn('group_id')
          })
        })
    })
  }
}
