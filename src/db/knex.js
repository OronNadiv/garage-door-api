import config from '../config'
import path from 'path'

export default {
  // debug: true,
  client: 'pg',
  connection: config.postgres,
  pool: config.postgresPool,
  migrations: {
    directory: path.join(__dirname, 'migrations')
  }
}
