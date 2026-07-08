/**
 * Boots a real Postgres for local dev without any system install
 * (binaries ship via the `embedded-postgres` npm package).
 * Data persists in .db/ between runs. Production uses Cloud SQL — same adapter.
 *
 * Usage: npm run dev:db   (leave running; then `npm run dev` in another shell)
 */
import EmbeddedPostgres from 'embedded-postgres'
import { existsSync } from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.resolve(process.cwd(), '.db')
const PORT = 5502
const DB_NAME = 'isocodelabs'

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: 'postgres',
  password: 'postgres',
  port: PORT,
  persistent: true,
  initdbFlags: ['--encoding=UTF8'],
})

const fresh = !existsSync(path.join(DATA_DIR, 'PG_VERSION'))

if (fresh) {
  console.log('[dev-db] initialising postgres data dir at .db/ …')
  await pg.initialise()
}

await pg.start()

if (fresh) {
  await pg.createDatabase(DB_NAME)
  console.log(`[dev-db] created database "${DB_NAME}"`)
}

console.log(`[dev-db] postgres running on 127.0.0.1:${PORT} (db: ${DB_NAME})`)
console.log('[dev-db] Ctrl+C to stop.')

const stop = async () => {
  console.log('\n[dev-db] stopping…')
  await pg.stop()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
