module.exports = {
  up (knex) {
    return knex.schema.createTable('states', table => {
      table.increments('id').primary()
      table.boolean('is_open').notNullable()
      table.integer('requested_by_id').nullable()
        .references('id')
        .inTable('public.users')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
      table.timestamps()
      table.index(['created_at'])
    })
  },

  down (knex) {
    return knex.schema.dropTable('states')
  }
}
