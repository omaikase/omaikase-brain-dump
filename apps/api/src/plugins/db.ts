import fp from 'fastify-plugin'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '@gnomos/db'

declare module 'fastify' {
  interface FastifyInstance {
    db: ReturnType<typeof drizzle<typeof schema>>
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const dbPlugin = fp(async (app) => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  const db = drizzle(pool, { schema })
  app.decorate('db', db)

  // Note: Uses SET/RESET pattern for RLS context. For high-concurrency production,
  // replace with per-request dedicated pool client checkout (pool.connect()).
  app.addHook('onRequest', async (request) => {
    const tenantId = request.headers['x-tenant-id'] as string | undefined
    if (tenantId) {
      if (!UUID_RE.test(tenantId)) return  // reject non-UUID values silently
      await pool.query(`SET app.current_tenant = '${tenantId}'`)
    }
  })

  app.addHook('onResponse', async () => {
    await pool.query(`RESET app.current_tenant`)
  })

  app.addHook('onClose', async () => {
    await pool.end()
  })
})
