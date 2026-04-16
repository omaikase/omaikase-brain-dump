import fp from 'fastify-plugin'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '@gnomos/db'

declare module 'fastify' {
  interface FastifyInstance {
    db: ReturnType<typeof drizzle<typeof schema>>
  }
}

export const dbPlugin = fp(async (app) => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  const db = drizzle(pool, { schema })
  app.decorate('db', db)

  // Set RLS tenant context on every request that provides x-tenant-id
  app.addHook('onRequest', async (request) => {
    const tenantId = request.headers['x-tenant-id'] as string | undefined
    if (tenantId) {
      await pool.query(`SET LOCAL app.current_tenant = '${tenantId}'`)
    }
  })

  app.addHook('onClose', async () => {
    await pool.end()
  })
})
