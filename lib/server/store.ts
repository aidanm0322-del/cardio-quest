import 'server-only'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { neon } from '@neondatabase/serverless'
import type { AppState } from '@/lib/types'
import { STATE_VERSION, createSeed } from './seed'

/**
 * Storage adapter. The prototype stores one fictional demo patient as a
 * single JSON document:
 *  - With DATABASE_URL set (e.g. a Neon integration) → Postgres JSONB row.
 *  - Otherwise → a local JSON file (`.data/` in dev, `/tmp` on Vercel, which
 *    is ephemeral — connect a database for durable hosted persistence).
 * Replace this module to connect your own API; nothing else touches storage.
 */
export interface StateStore {
  kind: 'postgres' | 'file'
  load(): Promise<AppState | null>
  save(state: AppState): Promise<void>
}

const DOC_ID = 'demo-patient'

function fileStore(): StateStore {
  const dir = process.env.VERCEL ? '/tmp/cardio-quest' : path.join(process.cwd(), '.data')
  const file = path.join(dir, 'cardio-quest.json')
  return {
    kind: 'file',
    async load() {
      try {
        return JSON.parse(await fs.readFile(file, 'utf8')) as AppState
      } catch {
        return null
      }
    },
    async save(state) {
      await fs.mkdir(dir, { recursive: true })
      const tmp = `${file}.${process.pid}.tmp`
      await fs.writeFile(tmp, JSON.stringify(state))
      await fs.rename(tmp, file)
    },
  }
}

function postgresStore(url: string): StateStore {
  const sql = neon(url)
  let ready: Promise<unknown> | null = null
  const ensure = () =>
    (ready ??= sql`CREATE TABLE IF NOT EXISTS cardio_quest_state (id text PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`)
  return {
    kind: 'postgres',
    async load() {
      await ensure()
      const rows = (await sql`SELECT data FROM cardio_quest_state WHERE id = ${DOC_ID}`) as { data: AppState }[]
      return rows[0]?.data ?? null
    },
    async save(state) {
      await ensure()
      await sql`INSERT INTO cardio_quest_state (id, data, updated_at) VALUES (${DOC_ID}, ${JSON.stringify(state)}::jsonb, now())
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`
    },
  }
}

const store: StateStore = process.env.DATABASE_URL ? postgresStore(process.env.DATABASE_URL) : fileStore()

export const storageKind = store.kind

// Serialize read-modify-write cycles within this server instance.
let queue: Promise<unknown> = Promise.resolve()

export async function readState(): Promise<AppState> {
  const existing = await store.load()
  if (existing && existing.version === STATE_VERSION) return existing
  const seed = createSeed()
  await store.save(seed)
  return seed
}

export function mutateState<T>(fn: (state: AppState) => T | Promise<T>): Promise<{ state: AppState; result: T }> {
  const run = queue.then(async () => {
    const state = await readState()
    const result = await fn(state)
    await store.save(state)
    return { state, result }
  })
  queue = run.catch(() => undefined)
  return run
}

export async function resetState(firstTime = false) {
  const seed = createSeed({ firstTime })
  await store.save(seed)
  return seed
}
