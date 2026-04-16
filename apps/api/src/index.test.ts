import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { buildApp } from './index.js'

// Mock the db and audit plugins so tests run without Postgres
vi.mock('./plugins/db.js', () => ({
  dbPlugin: async (app: any) => {
    app.decorate('db', {
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([]) }),
      select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) }),
    })
    app.addHook('onRequest', async () => {})
  },
}))

vi.mock('./plugins/audit.js', () => ({
  auditPlugin: async (app: any) => {
    app.decorate('audit', vi.fn().mockResolvedValue(undefined))
  },
}))

describe('API', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeAll(async () => {
    app = await buildApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /health returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.ok).toBe(true)
    expect(body.timestamp).toBeTruthy()
  })
})
