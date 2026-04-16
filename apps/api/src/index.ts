import Fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { dbPlugin } from './plugins/db.js'
import { auditPlugin } from './plugins/audit.js'

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  })

  await app.register(cors, {
    origin: process.env.FRONTEND_URL ?? '*',
  })

  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
  })

  await app.register(dbPlugin)
  await app.register(auditPlugin)

  app.get('/health', async () => ({ ok: true, timestamp: new Date().toISOString() }))

  return app
}

// Start server only when run directly (not during tests)
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const app = await buildApp()
  await app.listen({ port: Number(process.env.PORT ?? 3001), host: '0.0.0.0' })
}
