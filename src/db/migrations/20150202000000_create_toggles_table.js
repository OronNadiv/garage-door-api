export default {
  up (knex) {
    return knex.schema.createTable('toggles', table => {
      table.increments('id').primary()
      table.integer('user_id').notNullable()
        .references('id')
        .inTable('public.users')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
      table.timestamps()
      table.index(['created_at'])
    })
  },

  down (knex) {
    return knex.schema.dropTable('toggles')
  }
}
