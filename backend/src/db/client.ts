// Подключение к базе: PostgreSQL по DATABASE_URL, без него — PGlite (Postgres внутри Node, для разработки и тестов).
// Запросы одинаковые: экраны сервера работают с Db и не знают, какая под ним база.
import { mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { sql } from 'drizzle-orm'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import * as schema from '~/db/schema'

/** База с нашими таблицами */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>

/** Открытая база */
export interface Database {
  /** Запросы Drizzle */
  db: Db
  /**
   * Выполнить SQL из нескольких команд (миграции).
   * @param sql текст SQL
   */
  exec: (sql: string) => Promise<void>
  /** Закрыть подключение */
  close: () => Promise<void>
}

/** Папка migrations/ в корне backend: из сборки dist/server.mjs — на уровень выше, из src/db/ — на два */
const MIGRATIONS_DIR = fileURLToPath(new URL(import.meta.url.includes('/dist/') ? '../migrations' : '../../migrations', import.meta.url))

/**
 * Открыть базу.
 * @param url адрес PostgreSQL; пусто — PGlite
 * @param dataDir папка PGlite; пусто — в памяти (тесты)
 */
export async function openDatabase(url: string | undefined, dataDir?: string): Promise<Database> {
  if (url) {
    const { default: postgres } = await import('postgres')
    const { drizzle } = await import('drizzle-orm/postgres-js')
    // уведомления Postgres (NOTICE «уже существует» в миграциях) в лог не нужны
    const client = postgres(url, { onnotice: () => {} })
    return {
      db: drizzle(client, { schema }) as unknown as Db,
      exec: async (sql) => void (await client.unsafe(sql)),
      close: () => client.end(),
    }
  }
  const { PGlite } = await import('@electric-sql/pglite')
  const { btree_gist } = await import('@electric-sql/pglite/contrib/btree_gist')
  const { drizzle } = await import('drizzle-orm/pglite')
  // PGlite создаёт только последнюю папку пути
  if (dataDir) mkdirSync(dataDir, { recursive: true })
  const client = new PGlite({ dataDir, extensions: { btree_gist } })
  return {
    db: drizzle(client, { schema }) as unknown as Db,
    exec: async (sql) => void (await client.exec(sql)),
    close: () => client.close(),
  }
}

/**
 * Применить новые миграции из migrations/ по порядку имён. Применённые записаны в schema_migrations.
 * @param database открытая база
 * @param dir папка миграций (для тестов)
 * @returns имена применённых сейчас миграций
 */
export async function migrate(database: Database, dir = MIGRATIONS_DIR): Promise<string[]> {
  await database.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())')
  const rows = await database.db.execute(sql.raw('SELECT name FROM schema_migrations'))
  const done = new Set(listRows<{ name: string }>(rows).map((r) => r.name))
  const applied: string[] = []
  for (const name of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    if (done.has(name)) continue
    const body = readFileSync(`${dir}/${name}`, 'utf8')
    const quoted = name.replace(/'/g, "''")
    // миграция и отметка о ней — одной транзакцией: упала на середине — не применилась вовсе
    await database.exec(`BEGIN;\n${body}\nINSERT INTO schema_migrations (name) VALUES ('${quoted}');\nCOMMIT;`)
    applied.push(name)
  }
  return applied
}

/**
 * Строки результата execute: у postgres-js это сам массив, у PGlite — поле rows.
 * @param result результат db.execute
 */
export function listRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[]
  return ((result as { rows?: T[] }).rows ?? []) as T[]
}
