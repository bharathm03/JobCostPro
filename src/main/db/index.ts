import { app } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'
import { seed } from './seed'

let db: ReturnType<typeof drizzle<typeof schema>>

function getMigrationsFolder(): string {
  // In production, migrations are in resources/drizzle
  const prodPath = join(process.resourcesPath, 'drizzle')
  if (existsSync(prodPath)) {
    return prodPath
  }
  // In development, they're relative to the built output
  return join(__dirname, '../../drizzle')
}

export function initDatabase(): typeof db {
  const dbPath = join(app.getPath('userData'), 'jobcostpro.db')
  console.log('Database path:', dbPath)

  const sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  db = drizzle(sqlite, { schema })

  // Run migrations
  try {
    const migrationsFolder = getMigrationsFolder()
    console.log('Migrations folder:', migrationsFolder)
    migrate(db, { migrationsFolder })
    console.log('Migrations complete')
  } catch (err) {
    console.error('Migration error:', err)
  }

  // Seed data
  try {
    seed(db)
    console.log('Seed complete')
  } catch (err) {
    console.error('Seed error:', err)
  }

  return db
}

export function getDb(): typeof db {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export type AppDatabase = typeof db
