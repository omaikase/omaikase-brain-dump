import fp from 'fastify-plugin'
import { auditLog } from '@gnomos/db'

export interface AuditParams {
  tenantId: string
  actorType: 'user' | 'agent' | 'system'
  actorId: string
  action: string
  resourceType: string
  resourceId: string
  payload?: unknown
  policyRuleId?: string
  confidenceScore?: number
  autonomousAction?: boolean
}

declare module 'fastify' {
  interface FastifyInstance {
    audit: (params: AuditParams) => Promise<void>
  }
}

export const auditPlugin = fp(async (app) => {
  app.decorate('audit', async (params: AuditParams) => {
    await app.db.insert(auditLog).values({
      tenantId: params.tenantId,
      actorType: params.actorType,
      actorId: params.actorId,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId as `${string}-${string}-${string}-${string}-${string}`,
      payload: params.payload ?? null,
      policyRuleId: params.policyRuleId ?? null,
      confidenceScore: params.confidenceScore != null ? String(params.confidenceScore) : null,
      autonomousAction: params.autonomousAction ?? false,
    })
  })
})
