# gnomos Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working autonomous quote-to-cash system for compute infrastructure operators — from inbound quote request through invoicing and payment, with a pricing engine, policy-governed AI autonomy, and full audit trail.

**Architecture:** Event-driven monorepo with a TypeScript/Fastify API backend, XState state machines for commercial workflow, PostgreSQL with row-level multi-tenancy, and a Next.js operator portal. Every autonomous AI action passes through a policy gate before execution and is written to an immutable audit log.

**Tech Stack:** TypeScript · Fastify · XState · BullMQ · PostgreSQL · Drizzle ORM · Next.js App Router · shadcn/ui · TanStack Table · Stripe · Postmark · Vercel AI SDK · Claude API · Cerbos · pgvector · Redis

---

## Market Context (inform all decisions)

- **Salesforce CPQ is end-of-sale** (March 2025) — thousands of revenue ops teams are evaluating replacements in 2026. This is the primary migration wedge.
- **No product handles the operator side of compute**: FinOps tools (CloudZero, Finout, Vantage) are buyer-side only. WHMCS/HostBill are web-host vintage and cannot handle GPU cluster ops or enterprise contracts.
- **Neocloud margins are 14–16%** after labor, power, and depreciation — operational inefficiency directly destroys the business. Speed and accuracy of quoting and collection matters enormously.
- **H100 1-year rental pricing rose 38% in 5 months** (Oct 2025 → March 2026). Benchmark data is actively traded on Bloomberg Terminal (Ornn OCPI, Silicon Index). gnomos has a real opportunity to build the private contribution layer.
- **Primary differentiator**: Not workflow automation (Salesforce is adding agents) — but compute-specific data density and economic reasoning that horizontal platforms cannot match.

---

## Scope Note

This plan covers **Phase 1 only**. Phase 1 is itself composed of 9 independent subsystems. Each subsystem should be executed as its own focused sprint. This document defines the full architecture and file structure, then provides detailed tasks for each subsystem in sequence.

**Phase 2** (energy-aware orchestration, deeper benchmarks, tax automation) and **Phase 3** (financial products, gnomex) are out of scope here.

---

## Repository Structure

```
gnomos/
├── apps/
│   ├── api/                    # Fastify backend
│   │   ├── src/
│   │   │   ├── db/             # Drizzle schema + migrations
│   │   │   ├── modules/        # Feature modules (accounts, quotes, contracts, etc.)
│   │   │   │   ├── accounts/
│   │   │   │   ├── quotes/
│   │   │   │   ├── contracts/
│   │   │   │   ├── invoices/
│   │   │   │   ├── payments/
│   │   │   │   ├── pricing/
│   │   │   │   ├── benchmarks/
│   │   │   │   └── communications/
│   │   │   ├── machines/       # XState state machines
│   │   │   ├── agents/         # AI agent definitions (Vercel AI SDK)
│   │   │   ├── policy/         # Cerbos policy gate
│   │   │   ├── audit/          # Immutable audit log writer
│   │   │   ├── jobs/           # BullMQ job definitions
│   │   │   └── index.ts        # Fastify server entry
│   │   └── package.json
│   ├── operator/               # Next.js operator portal
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── feed/       # Autonomous activity feed
│   │   │   │   ├── exceptions/ # Exception queue
│   │   │   │   ├── quotes/
│   │   │   │   ├── contracts/
│   │   │   │   ├── invoices/
│   │   │   │   ├── benchmarks/
│   │   │   │   └── settings/   # Policy configuration
│   │   │   └── layout.tsx
│   │   └── package.json
│   └── tenant/                 # Next.js tenant portal (lite)
│       ├── app/
│       │   ├── quotes/
│       │   ├── contracts/
│       │   ├── invoices/
│       │   └── layout.tsx
│       └── package.json
├── packages/
│   ├── db/                     # Shared Drizzle schema + types
│   ├── types/                  # Shared TypeScript types
│   └── ui/                     # Shared shadcn components
├── policies/                   # Cerbos YAML policy files
├── docs/
│   └── superpowers/plans/
├── docker-compose.yml          # Postgres + Redis + Cerbos local dev
├── turbo.json
└── package.json                # Turborepo root
```

---

## Task 1: Project Scaffold + Local Infrastructure

**Files:**
- Create: `package.json` (root)
- Create: `turbo.json`
- Create: `docker-compose.yml`
- Create: `apps/api/package.json`
- Create: `apps/operator/package.json`
- Create: `apps/tenant/package.json`
- Create: `packages/db/package.json`
- Create: `packages/types/package.json`

- [ ] **Step 1: Initialize Turborepo monorepo**

```bash
npx create-turbo@latest gnomos --package-manager pnpm
cd gnomos
```

- [ ] **Step 2: Set up apps and packages structure**

```bash
mkdir -p apps/api/src apps/operator apps/tenant packages/db/src packages/types/src packages/ui/src policies
```

- [ ] **Step 3: Create docker-compose.yml for local services**

```yaml
# docker-compose.yml
version: '3.9'
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: gnomos
      POSTGRES_USER: gnomos
      POSTGRES_PASSWORD: gnomos
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  cerbos:
    image: ghcr.io/cerbos/cerbos:latest
    ports:
      - "3593:3593"
      - "3592:3592"
    volumes:
      - ./policies:/policies
    command: server --config=/policies/cerbos.yaml

volumes:
  pgdata:
```

- [ ] **Step 4: Create Cerbos config**

```yaml
# policies/cerbos.yaml
server:
  httpListenAddr: ":3592"
  grpcListenAddr: ":3593"
storage:
  driver: disk
  disk:
    directory: /policies
    watchForChanges: true
```

- [ ] **Step 5: Start services and verify**

```bash
docker-compose up -d
docker-compose ps
```
Expected: postgres, redis, cerbos all show `Up`

- [ ] **Step 6: Initialize Fastify API app**

```bash
cd apps/api
pnpm init
pnpm add fastify @fastify/cors @fastify/jwt fastify-plugin
pnpm add -D typescript @types/node tsx vitest
```

- [ ] **Step 7: Initialize Next.js operator app**

```bash
cd apps/operator
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
pnpm add @tanstack/react-table lucide-react
npx shadcn@latest init
```

- [ ] **Step 8: Commit scaffold**

```bash
git init
git add .
git commit -m "feat: initialize gnomos monorepo scaffold"
```

---

## Task 2: Canonical Data Model (Database Schema)

**Files:**
- Create: `packages/db/src/schema.ts`
- Create: `packages/db/src/index.ts`
- Create: `packages/db/drizzle.config.ts`
- Create: `apps/api/src/db/migrate.ts`

- [ ] **Step 1: Install Drizzle and pgvector**

```bash
cd packages/db
pnpm add drizzle-orm pg
pnpm add -D drizzle-kit @types/pg
```

- [ ] **Step 2: Write the schema — tenants and accounts**

```typescript
// packages/db/src/schema.ts
import { pgTable, uuid, text, timestamp, boolean, jsonb, pgEnum, numeric, integer } from 'drizzle-orm/pg-core'

// Multi-tenancy: every table has tenant_id
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  autonomyMode: text('autonomy_mode').notNull().default('shadow'), // shadow | assisted | full
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  type: text('type').notNull(), // operator | tenant_customer
  region: text('region'),
  tier: text('tier'), // standard | priority | strategic
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role'),
})
```

- [ ] **Step 3: Write the schema — quotes and line items**

```typescript
// Append to packages/db/src/schema.ts

export const quoteStatusEnum = pgEnum('quote_status', [
  'draft', 'pending_review', 'sent', 'negotiating', 'accepted', 'rejected', 'expired'
])

export const quotes = pgTable('quotes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  status: quoteStatusEnum('status').notNull().default('draft'),
  totalAmount: numeric('total_amount', { precision: 15, scale: 2 }),
  currency: text('currency').notNull().default('USD'),
  validUntil: timestamp('valid_until'),
  sentAt: timestamp('sent_at'),
  acceptedAt: timestamp('accepted_at'),
  autonomousAction: boolean('autonomous_action').notNull().default(false),
  confidenceScore: numeric('confidence_score', { precision: 4, scale: 3 }),
  pricingRationale: jsonb('pricing_rationale'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const quoteLineItems = pgTable('quote_line_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  quoteId: uuid('quote_id').notNull().references(() => quotes.id),
  description: text('description').notNull(),
  skuType: text('sku_type').notNull(), // gpu_reserved | gpu_spot | storage | networking | support
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 15, scale: 6 }).notNull(),
  totalPrice: numeric('total_price', { precision: 15, scale: 2 }).notNull(),
  termMonths: integer('term_months'),
  metadata: jsonb('metadata'), // GPU model, interconnect type, etc.
})
```

- [ ] **Step 4: Write the schema — contracts, invoices, payments**

```typescript
// Append to packages/db/src/schema.ts

export const contractStatusEnum = pgEnum('contract_status', [
  'draft', 'pending_signature', 'active', 'expired', 'terminated'
])

export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  quoteId: uuid('quote_id').references(() => quotes.id),
  status: contractStatusEnum('status').notNull().default('draft'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  totalValue: numeric('total_value', { precision: 15, scale: 2 }),
  signedAt: timestamp('signed_at'),
  signatureProvider: text('signature_provider'), // docusign | hellosign | pandadoc
  signatureDocumentId: text('signature_document_id'),
})

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft', 'issued', 'sent', 'partial', 'paid', 'overdue', 'void'
])

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  contractId: uuid('contract_id').references(() => contracts.id),
  status: invoiceStatusEnum('status').notNull().default('draft'),
  invoiceNumber: text('invoice_number').notNull().unique(),
  amountDue: numeric('amount_due', { precision: 15, scale: 2 }).notNull(),
  amountPaid: numeric('amount_paid', { precision: 15, scale: 2 }).notNull().default('0'),
  dueDate: timestamp('due_date'),
  issuedAt: timestamp('issued_at'),
  stripeInvoiceId: text('stripe_invoice_id'),
})

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  method: text('method').notNull(), // card | ach | wire
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  status: text('status').notNull(), // pending | succeeded | failed | refunded
  processedAt: timestamp('processed_at'),
})
```

- [ ] **Step 5: Write the schema — audit log**

```typescript
// Append to packages/db/src/schema.ts

// Immutable append-only audit log — never UPDATE or DELETE rows here
export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  actorType: text('actor_type').notNull(), // user | agent | system
  actorId: text('actor_id').notNull(),
  action: text('action').notNull(), // quote.sent | invoice.issued | payment.reconciled
  resourceType: text('resource_type').notNull(),
  resourceId: uuid('resource_id').notNull(),
  payload: jsonb('payload'), // full before/after state
  policyRuleId: text('policy_rule_id'), // which Cerbos rule allowed this
  confidenceScore: numeric('confidence_score', { precision: 4, scale: 3 }),
  autonomousAction: boolean('autonomous_action').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const exceptions = pgTable('exceptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  type: text('type').notNull(), // out_of_policy | low_confidence | major_contract_deviation | payment_dispute
  resourceType: text('resource_type').notNull(),
  resourceId: uuid('resource_id').notNull(),
  description: text('description').notNull(),
  suggestedAction: text('suggested_action'),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: uuid('resolved_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
```

- [ ] **Step 6: Configure Drizzle and run migration**

```typescript
// packages/db/drizzle.config.ts
import type { Config } from 'drizzle-kit'
export default {
  schema: './src/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: { connectionString: process.env.DATABASE_URL! },
} satisfies Config
```

```bash
cd packages/db
DATABASE_URL=postgresql://gnomos:gnomos@localhost:5432/gnomos pnpm drizzle-kit push:pg
```
Expected: All tables created with no errors

- [ ] **Step 7: Enable Row-Level Security on all tenant tables**

```sql
-- Run in psql: psql postgresql://gnomos:gnomos@localhost:5432/gnomos
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON accounts
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
-- Repeat for each table above with identical policy body
```

- [ ] **Step 8: Commit schema**

```bash
git add packages/db/
git commit -m "feat: add canonical commercial data model with RLS"
```

---

## Task 3: Fastify API Foundation + Auth

**Files:**
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/plugins/auth.ts`
- Create: `apps/api/src/plugins/db.ts`
- Create: `apps/api/src/plugins/audit.ts`

- [ ] **Step 1: Write the Fastify entry point**

```typescript
// apps/api/src/index.ts
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { dbPlugin } from './plugins/db'
import { auditPlugin } from './plugins/audit'

const app = Fastify({ logger: true })

await app.register(cors, { origin: process.env.FRONTEND_URL })
await app.register(jwt, { secret: process.env.JWT_SECRET! })
await app.register(dbPlugin)
await app.register(auditPlugin)

app.get('/health', async () => ({ ok: true }))

await app.listen({ port: 3001, host: '0.0.0.0' })
```

- [ ] **Step 2: Write the db plugin (sets tenant RLS on each request)**

```typescript
// apps/api/src/plugins/db.ts
import fp from 'fastify-plugin'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '@gnomos/db'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export const dbPlugin = fp(async (app) => {
  app.decorate('db', drizzle(pool, { schema }))

  // Set RLS tenant context on every request
  app.addHook('onRequest', async (request) => {
    const tenantId = request.headers['x-tenant-id'] as string
    if (tenantId) {
      await pool.query(`SET app.current_tenant = '${tenantId}'`)
    }
  })
})
```

- [ ] **Step 3: Write the audit plugin**

```typescript
// apps/api/src/plugins/audit.ts
import fp from 'fastify-plugin'
import { auditLog } from '@gnomos/db'

export const auditPlugin = fp(async (app) => {
  app.decorate('audit', async (params: {
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
  }) => {
    await app.db.insert(auditLog).values({
      ...params,
      payload: params.payload ?? null,
      autonomousAction: params.autonomousAction ?? false,
    })
  })
})
```

- [ ] **Step 4: Write a test for the health endpoint**

```typescript
// apps/api/src/index.test.ts
import { describe, it, expect } from 'vitest'
import { buildApp } from './index'

describe('API health', () => {
  it('returns ok', async () => {
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ok: true })
  })
})
```

- [ ] **Step 5: Run the test**

```bash
cd apps/api && pnpm vitest run
```
Expected: 1 passing

- [ ] **Step 6: Commit**

```bash
git add apps/api/
git commit -m "feat: add Fastify API foundation with RLS tenant context and audit plugin"
```

---

## Task 4: Quote State Machine (XState)

**Files:**
- Create: `apps/api/src/machines/quote.machine.ts`
- Create: `apps/api/src/machines/quote.machine.test.ts`
- Create: `apps/api/src/modules/quotes/quotes.service.ts`
- Create: `apps/api/src/modules/quotes/quotes.routes.ts`

- [ ] **Step 1: Install XState**

```bash
cd apps/api && pnpm add xstate
```

- [ ] **Step 2: Write the failing test for quote state transitions**

```typescript
// apps/api/src/machines/quote.machine.test.ts
import { describe, it, expect } from 'vitest'
import { createActor } from 'xstate'
import { quoteMachine } from './quote.machine'

describe('quoteMachine', () => {
  it('starts in draft state', () => {
    const actor = createActor(quoteMachine).start()
    expect(actor.getSnapshot().value).toBe('draft')
  })

  it('transitions draft → sent on SEND event', () => {
    const actor = createActor(quoteMachine).start()
    actor.send({ type: 'SEND' })
    expect(actor.getSnapshot().value).toBe('sent')
  })

  it('transitions sent → negotiating on COUNTER_RECEIVED', () => {
    const actor = createActor(quoteMachine).start()
    actor.send({ type: 'SEND' })
    actor.send({ type: 'COUNTER_RECEIVED' })
    expect(actor.getSnapshot().value).toBe('negotiating')
  })

  it('transitions sent → accepted on ACCEPT', () => {
    const actor = createActor(quoteMachine).start()
    actor.send({ type: 'SEND' })
    actor.send({ type: 'ACCEPT' })
    expect(actor.getSnapshot().value).toBe('accepted')
  })

  it('cannot send from accepted state', () => {
    const actor = createActor(quoteMachine).start()
    actor.send({ type: 'SEND' })
    actor.send({ type: 'ACCEPT' })
    actor.send({ type: 'SEND' }) // should be ignored
    expect(actor.getSnapshot().value).toBe('accepted')
  })
})
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
cd apps/api && pnpm vitest run src/machines/quote.machine.test.ts
```
Expected: FAIL — "Cannot find module './quote.machine'"

- [ ] **Step 4: Implement the quote state machine**

```typescript
// apps/api/src/machines/quote.machine.ts
import { createMachine } from 'xstate'

export const quoteMachine = createMachine({
  id: 'quote',
  initial: 'draft',
  states: {
    draft: {
      on: {
        SEND: 'sent',
        REQUEST_REVIEW: 'pending_review',
      },
    },
    pending_review: {
      on: {
        APPROVE: 'sent',
        REJECT: 'draft',
      },
    },
    sent: {
      on: {
        COUNTER_RECEIVED: 'negotiating',
        ACCEPT: 'accepted',
        REJECT: 'rejected',
        EXPIRE: 'expired',
      },
    },
    negotiating: {
      on: {
        COUNTER_SENT: 'sent',
        ACCEPT: 'accepted',
        REJECT: 'rejected',
      },
    },
    accepted: { type: 'final' },
    rejected: { type: 'final' },
    expired: { type: 'final' },
  },
})
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
cd apps/api && pnpm vitest run src/machines/quote.machine.test.ts
```
Expected: 5 passing

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/machines/
git commit -m "feat: add quote XState machine with full status transitions"
```

---

## Task 5: Pricing Engine v1

**Files:**
- Create: `apps/api/src/modules/pricing/pricing.service.ts`
- Create: `apps/api/src/modules/pricing/pricing.service.test.ts`
- Create: `apps/api/src/modules/pricing/pricing.types.ts`

- [ ] **Step 1: Write pricing types**

```typescript
// apps/api/src/modules/pricing/pricing.types.ts
export type SkuType = 'gpu_reserved' | 'gpu_spot' | 'storage' | 'networking' | 'support'

export interface PricingInput {
  skuType: SkuType
  gpuModel?: string       // H100 | H200 | A100 | B200
  region: string          // us-west | us-east | eu-west
  termMonths: number      // 1 | 3 | 6 | 12 | 24 | 36
  quantity: number        // GPU count or storage TB
  accountTier?: string    // standard | priority | strategic
  benchmarkBandLow?: number
  benchmarkBandHigh?: number
}

export interface PricingOutput {
  unitPrice: number
  totalPrice: number
  confidenceScore: number  // 0–1
  rationale: string
  benchmarkPosition: 'below_market' | 'at_market' | 'above_market' | 'unknown'
  requiresReview: boolean  // true if confidence < 0.7 or out of policy
}
```

- [ ] **Step 2: Write the failing pricing tests**

```typescript
// apps/api/src/modules/pricing/pricing.service.test.ts
import { describe, it, expect } from 'vitest'
import { calculatePrice } from './pricing.service'

describe('calculatePrice', () => {
  it('returns a price for a standard H100 reserved GPU request', () => {
    const result = calculatePrice({
      skuType: 'gpu_reserved',
      gpuModel: 'H100',
      region: 'us-west',
      termMonths: 12,
      quantity: 8,
      accountTier: 'standard',
    })
    expect(result.unitPrice).toBeGreaterThan(0)
    expect(result.totalPrice).toBe(result.unitPrice * 8 * 12 * 730) // hourly rate × quantity × months × hours
    expect(result.confidenceScore).toBeGreaterThan(0)
    expect(result.confidenceScore).toBeLessThanOrEqual(1)
    expect(result.rationale).toBeTruthy()
  })

  it('flags low confidence when no benchmark data provided', () => {
    const result = calculatePrice({
      skuType: 'gpu_reserved',
      gpuModel: 'B200',
      region: 'ap-southeast',
      termMonths: 1,
      quantity: 1,
    })
    expect(result.confidenceScore).toBeLessThan(0.7)
    expect(result.requiresReview).toBe(true)
  })

  it('marks requiresReview false when benchmark band provided and confidence high', () => {
    const result = calculatePrice({
      skuType: 'gpu_reserved',
      gpuModel: 'H100',
      region: 'us-west',
      termMonths: 12,
      quantity: 8,
      benchmarkBandLow: 2.00,
      benchmarkBandHigh: 2.50,
    })
    expect(result.requiresReview).toBe(false)
    expect(result.benchmarkPosition).not.toBe('unknown')
  })
})
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
cd apps/api && pnpm vitest run src/modules/pricing/pricing.service.test.ts
```
Expected: FAIL

- [ ] **Step 4: Implement pricing engine v1**

```typescript
// apps/api/src/modules/pricing/pricing.service.ts
import type { PricingInput, PricingOutput } from './pricing.types'

// Base rates per GPU-hour (USD) — Phase 1 seed data, will be replaced by benchmark engine
const BASE_RATES: Record<string, Record<string, number>> = {
  H100: { 'us-west': 2.20, 'us-east': 2.15, 'eu-west': 2.35 },
  H200: { 'us-west': 3.10, 'us-east': 3.05, 'eu-west': 3.25 },
  A100: { 'us-west': 1.60, 'us-east': 1.55, 'eu-west': 1.70 },
  B200: { 'us-west': 4.50, 'us-east': 4.40, 'eu-west': 4.75 },
}

const TERM_DISCOUNTS: Record<number, number> = {
  1: 0, 3: 0.03, 6: 0.06, 12: 0.10, 24: 0.15, 36: 0.20,
}

const TIER_ADJUSTMENTS: Record<string, number> = {
  standard: 0, priority: -0.02, strategic: -0.05,
}

const HOURS_PER_MONTH = 730

export function calculatePrice(input: PricingInput): PricingOutput {
  const { skuType, gpuModel, region, termMonths, quantity, accountTier,
          benchmarkBandLow, benchmarkBandHigh } = input

  if (skuType !== 'gpu_reserved' && skuType !== 'gpu_spot') {
    // Non-GPU SKUs: flat rate placeholder until Phase 2
    return {
      unitPrice: 0.10, totalPrice: 0.10 * quantity,
      confidenceScore: 0.5, rationale: 'Non-GPU SKU — manual review recommended',
      benchmarkPosition: 'unknown', requiresReview: true,
    }
  }

  const regionRates = gpuModel ? BASE_RATES[gpuModel] : undefined
  const baseRate = regionRates?.[region]

  if (!baseRate) {
    return {
      unitPrice: 0, totalPrice: 0,
      confidenceScore: 0.3, rationale: `No base rate data for ${gpuModel} in ${region}`,
      benchmarkPosition: 'unknown', requiresReview: true,
    }
  }

  const termDiscount = TERM_DISCOUNTS[termMonths] ?? 0
  const tierAdjustment = TIER_ADJUSTMENTS[accountTier ?? 'standard'] ?? 0
  const unitPrice = baseRate * (1 - termDiscount + tierAdjustment)
  const totalPrice = unitPrice * quantity * termMonths * HOURS_PER_MONTH

  let confidenceScore = 0.65 // base confidence without benchmark data
  let benchmarkPosition: PricingOutput['benchmarkPosition'] = 'unknown'

  if (benchmarkBandLow !== undefined && benchmarkBandHigh !== undefined) {
    confidenceScore = 0.85
    if (unitPrice < benchmarkBandLow) benchmarkPosition = 'below_market'
    else if (unitPrice > benchmarkBandHigh) benchmarkPosition = 'above_market'
    else benchmarkPosition = 'at_market'
  }

  const rationale = `${gpuModel} ${region} ${termMonths}mo reserved: base $${baseRate}/hr, ` +
    `${(termDiscount * 100).toFixed(0)}% term discount, ` +
    `${(tierAdjustment * 100).toFixed(0)}% tier adjustment. ` +
    (benchmarkPosition !== 'unknown' ? `Benchmark position: ${benchmarkPosition}.` : 'No benchmark data.')

  return {
    unitPrice,
    totalPrice,
    confidenceScore,
    rationale,
    benchmarkPosition,
    requiresReview: confidenceScore < 0.7,
  }
}
```

- [ ] **Step 5: Run tests**

```bash
cd apps/api && pnpm vitest run src/modules/pricing/pricing.service.test.ts
```
Expected: 3 passing

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/pricing/
git commit -m "feat: add pricing engine v1 with GPU base rates, term discounts, and benchmark positioning"
```

---

## Task 6: Policy Engine (Cerbos)

**Files:**
- Create: `policies/quote.yaml`
- Create: `policies/invoice.yaml`
- Create: `apps/api/src/policy/gate.ts`
- Create: `apps/api/src/policy/gate.test.ts`

- [ ] **Step 1: Write Cerbos policy for quote actions**

```yaml
# policies/quote.yaml
apiVersion: api.cerbos.dev/v1
resourcePolicy:
  version: "default"
  resource: quote
  rules:
    - actions: ["send"]
      effect: EFFECT_ALLOW
      condition:
        match:
          all:
            of:
              - expr: "request.resource.attr.confidenceScore >= 0.7"
              - expr: "request.resource.attr.discountPercent <= 10"
              - expr: "request.principal.attr.autonomyMode in ['assisted', 'full']"

    - actions: ["send"]
      effect: EFFECT_DENY
      condition:
        match:
          any:
            of:
              - expr: "request.resource.attr.confidenceScore < 0.7"
              - expr: "request.resource.attr.discountPercent > 10"

    - actions: ["request_human_review"]
      effect: EFFECT_ALLOW
      roles: ["*"]
```

- [ ] **Step 2: Write the policy gate service**

```typescript
// apps/api/src/policy/gate.ts
import { GRPC as Cerbos } from '@cerbos/grpc'

const cerbos = new Cerbos(process.env.CERBOS_URL ?? 'localhost:3593', { tls: false })

export interface PolicyContext {
  tenantId: string
  autonomyMode: 'shadow' | 'assisted' | 'full'
  resource: {
    kind: string
    id: string
    attributes: Record<string, unknown>
  }
  action: string
}

export interface PolicyResult {
  allowed: boolean
  ruleId?: string
  reason?: string
}

export async function checkPolicy(ctx: PolicyContext): Promise<PolicyResult> {
  const decision = await cerbos.checkResource({
    principal: {
      id: `tenant:${ctx.tenantId}`,
      roles: ['agent'],
      attributes: { autonomyMode: ctx.autonomyMode },
    },
    resource: {
      kind: ctx.resource.kind,
      id: ctx.resource.id,
      attributes: ctx.resource.attributes,
    },
    actions: [ctx.action],
  })

  const allowed = decision.isAllowed(ctx.action)
  return {
    allowed,
    reason: allowed ? undefined : `Action '${ctx.action}' denied by policy for ${ctx.resource.kind}`,
  }
}
```

- [ ] **Step 3: Install Cerbos client**

```bash
cd apps/api && pnpm add @cerbos/grpc
```

- [ ] **Step 4: Write failing policy gate test**

```typescript
// apps/api/src/policy/gate.test.ts
import { describe, it, expect } from 'vitest'
import { checkPolicy } from './gate'

describe('PolicyGate', () => {
  it('allows quote send when confidence >= 0.7 and autonomy is full', async () => {
    const result = await checkPolicy({
      tenantId: 'test-tenant',
      autonomyMode: 'full',
      resource: {
        kind: 'quote',
        id: 'q1',
        attributes: { confidenceScore: 0.85, discountPercent: 5 },
      },
      action: 'send',
    })
    expect(result.allowed).toBe(true)
  })

  it('denies quote send when confidence < 0.7', async () => {
    const result = await checkPolicy({
      tenantId: 'test-tenant',
      autonomyMode: 'full',
      resource: {
        kind: 'quote',
        id: 'q2',
        attributes: { confidenceScore: 0.65, discountPercent: 5 },
      },
      action: 'send',
    })
    expect(result.allowed).toBe(false)
    expect(result.reason).toBeTruthy()
  })
})
```

- [ ] **Step 5: Run tests (requires Cerbos running via docker-compose)**

```bash
docker-compose up -d cerbos
cd apps/api && pnpm vitest run src/policy/gate.test.ts
```
Expected: 2 passing

- [ ] **Step 6: Commit**

```bash
git add policies/ apps/api/src/policy/
git commit -m "feat: add Cerbos policy engine with quote send autonomy rules"
```

---

## Task 7: Communications Agent (Email Parsing + Autonomous Response)

**Files:**
- Create: `apps/api/src/agents/communications.agent.ts`
- Create: `apps/api/src/agents/communications.agent.test.ts`
- Create: `apps/api/src/modules/communications/inbound.routes.ts`

- [ ] **Step 1: Install AI SDK**

```bash
cd apps/api && pnpm add ai @ai-sdk/anthropic
```

- [ ] **Step 2: Write the failing test for email intent classification**

```typescript
// apps/api/src/agents/communications.agent.test.ts
import { describe, it, expect } from 'vitest'
import { classifyEmailIntent } from './communications.agent'

describe('classifyEmailIntent', () => {
  it('classifies a quote request', async () => {
    const result = await classifyEmailIntent(
      'Hi, we need pricing for 16x H100 GPUs in US-West for 6 months, reserved. Please send a quote.'
    )
    expect(result.intent).toBe('quote_request')
    expect(result.entities.gpuModel).toBe('H100')
    expect(result.entities.quantity).toBe(16)
    expect(result.entities.region).toBe('us-west')
    expect(result.entities.termMonths).toBe(6)
  })

  it('classifies a payment dispute', async () => {
    const result = await classifyEmailIntent(
      'Invoice #1042 is incorrect. We were charged for 32 GPUs but only provisioned 28.'
    )
    expect(result.intent).toBe('payment_dispute')
    expect(result.requiresHuman).toBe(true)
  })
})
```

- [ ] **Step 3: Implement the communications agent**

```typescript
// apps/api/src/agents/communications.agent.ts
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

const IntentSchema = z.object({
  intent: z.enum([
    'quote_request', 'negotiation_counter', 'contract_query',
    'payment_dispute', 'support_request', 'general_inquiry'
  ]),
  requiresHuman: z.boolean(),
  entities: z.object({
    gpuModel: z.string().optional(),
    quantity: z.number().optional(),
    region: z.string().optional(),
    termMonths: z.number().optional(),
    invoiceNumber: z.string().optional(),
    discountRequested: z.number().optional(),
  }),
  suggestedAction: z.string(),
  confidence: z.number().min(0).max(1),
})

export type EmailIntent = z.infer<typeof IntentSchema>

export async function classifyEmailIntent(emailBody: string): Promise<EmailIntent> {
  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-6'),
    schema: IntentSchema,
    prompt: `You are an AI for gnomos, a commercial operating system for compute infrastructure operators.
Classify the intent of this inbound email and extract relevant entities.

Email:
${emailBody}

Rules:
- payment_dispute always requiresHuman: true
- quote_request with missing key info (no GPU model, region, or quantity) requiresHuman: true
- confidence below 0.7 means requiresHuman: true
- region: normalize to us-west | us-east | eu-west | ap-southeast`,
  })

  return object
}
```

- [ ] **Step 4: Write the Postmark inbound webhook route**

```typescript
// apps/api/src/modules/communications/inbound.routes.ts
import type { FastifyInstance } from 'fastify'
import { classifyEmailIntent } from '../../agents/communications.agent'
import { checkPolicy } from '../../policy/gate'
import { exceptions } from '@gnomos/db'

export async function inboundEmailRoutes(app: FastifyInstance) {
  // Postmark sends POST to this endpoint for each inbound email
  app.post('/webhooks/email/inbound', async (request, reply) => {
    const { TextBody, From, Subject } = request.body as {
      TextBody: string; From: string; Subject: string
    }

    const intent = await classifyEmailIntent(TextBody)

    app.log.info({ intent, from: From }, 'Classified inbound email')

    if (intent.requiresHuman || intent.confidence < 0.7) {
      // Create exception for human review
      await app.db.insert(exceptions).values({
        tenantId: request.headers['x-tenant-id'] as string,
        type: 'low_confidence',
        resourceType: 'email',
        resourceId: crypto.randomUUID() as `${string}-${string}-${string}-${string}-${string}`,
        description: `Inbound email from ${From} — intent: ${intent.intent}, confidence: ${intent.confidence}`,
        suggestedAction: intent.suggestedAction,
      })
      return reply.send({ status: 'exception_created' })
    }

    // Autonomous handling for high-confidence quote requests
    if (intent.intent === 'quote_request') {
      // TODO Task 8: trigger autonomous quote generation
      return reply.send({ status: 'quote_generation_queued' })
    }

    return reply.send({ status: 'processed' })
  })
}
```

- [ ] **Step 5: Run tests**

```bash
cd apps/api && pnpm vitest run src/agents/communications.agent.test.ts
```
Expected: 2 passing (requires `ANTHROPIC_API_KEY` in env)

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/agents/ apps/api/src/modules/communications/
git commit -m "feat: add communications agent with email intent classification and exception routing"
```

---

## Task 8: Autonomous Quote Generation Pipeline

**Files:**
- Create: `apps/api/src/agents/quote.agent.ts`
- Create: `apps/api/src/agents/quote.agent.test.ts`
- Create: `apps/api/src/jobs/quote.jobs.ts`
- Create: `apps/api/src/modules/quotes/quotes.service.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/api/src/agents/quote.agent.test.ts
import { describe, it, expect } from 'vitest'
import { generateQuoteDraft } from './quote.agent'

describe('generateQuoteDraft', () => {
  it('generates a quote draft from email intent entities', async () => {
    const draft = await generateQuoteDraft({
      accountId: 'test-account',
      gpuModel: 'H100',
      quantity: 8,
      region: 'us-west',
      termMonths: 12,
      requestContext: 'Customer requested 8x H100 for ML training workloads',
    })

    expect(draft.lineItems).toHaveLength(1)
    expect(draft.lineItems[0].skuType).toBe('gpu_reserved')
    expect(draft.lineItems[0].quantity).toBe(8)
    expect(draft.totalAmount).toBeGreaterThan(0)
    expect(draft.pricingRationale).toBeTruthy()
    expect(draft.confidenceScore).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Implement quote agent**

```typescript
// apps/api/src/agents/quote.agent.ts
import { calculatePrice } from '../modules/pricing/pricing.service'

export interface QuoteDraftInput {
  accountId: string
  gpuModel: string
  quantity: number
  region: string
  termMonths: number
  requestContext: string
  benchmarkBandLow?: number
  benchmarkBandHigh?: number
}

export interface QuoteDraft {
  accountId: string
  lineItems: Array<{
    description: string
    skuType: string
    quantity: number
    unitPrice: number
    totalPrice: number
    termMonths: number
    metadata: Record<string, unknown>
  }>
  totalAmount: number
  pricingRationale: string
  confidenceScore: number
  requiresReview: boolean
}

export async function generateQuoteDraft(input: QuoteDraftInput): Promise<QuoteDraft> {
  const pricing = calculatePrice({
    skuType: 'gpu_reserved',
    gpuModel: input.gpuModel,
    region: input.region,
    termMonths: input.termMonths,
    quantity: input.quantity,
    benchmarkBandLow: input.benchmarkBandLow,
    benchmarkBandHigh: input.benchmarkBandHigh,
  })

  const lineItem = {
    description: `${input.gpuModel} GPU — Reserved ${input.termMonths}mo (${input.region})`,
    skuType: 'gpu_reserved',
    quantity: input.quantity,
    unitPrice: pricing.unitPrice,
    totalPrice: pricing.totalPrice,
    termMonths: input.termMonths,
    metadata: { gpuModel: input.gpuModel, region: input.region },
  }

  return {
    accountId: input.accountId,
    lineItems: [lineItem],
    totalAmount: pricing.totalPrice,
    pricingRationale: pricing.rationale,
    confidenceScore: pricing.confidenceScore,
    requiresReview: pricing.requiresReview,
  }
}
```

- [ ] **Step 3: Wire up BullMQ quote generation job**

```typescript
// apps/api/src/jobs/quote.jobs.ts
import { Queue, Worker } from 'bullmq'
import { generateQuoteDraft } from '../agents/quote.agent'
import { checkPolicy } from '../policy/gate'
import { quotes, quoteLineItems } from '@gnomos/db'

export const quoteQueue = new Queue('quotes', {
  connection: { host: 'localhost', port: 6379 },
})

export function startQuoteWorker(db: ReturnType<typeof import('drizzle-orm/node-postgres').drizzle>, audit: Function) {
  return new Worker('quotes', async (job) => {
    const { tenantId, accountId, autonomyMode, ...input } = job.data

    const draft = await generateQuoteDraft(input)

    // Check policy before taking any autonomous action
    const policy = await checkPolicy({
      tenantId,
      autonomyMode,
      resource: {
        kind: 'quote',
        id: 'new',
        attributes: {
          confidenceScore: draft.confidenceScore,
          discountPercent: 0,
        },
      },
      action: 'send',
    })

    const [quote] = await db.insert(quotes).values({
      tenantId,
      accountId,
      status: policy.allowed ? 'sent' : 'pending_review',
      totalAmount: String(draft.totalAmount),
      pricingRationale: { rationale: draft.pricingRationale },
      confidenceScore: String(draft.confidenceScore),
      autonomousAction: policy.allowed,
      sentAt: policy.allowed ? new Date() : null,
    }).returning()

    await db.insert(quoteLineItems).values(
      draft.lineItems.map(li => ({ ...li, quoteId: quote.id,
        unitPrice: String(li.unitPrice), totalPrice: String(li.totalPrice),
        quantity: String(li.quantity) }))
    )

    await audit({
      tenantId, actorType: 'agent', actorId: 'quote-agent',
      action: policy.allowed ? 'quote.sent' : 'quote.pending_review',
      resourceType: 'quote', resourceId: quote.id,
      payload: { draft, policyAllowed: policy.allowed },
      confidenceScore: draft.confidenceScore,
      autonomousAction: policy.allowed,
    })

    return { quoteId: quote.id, sentAutonomously: policy.allowed }
  }, { connection: { host: 'localhost', port: 6379 } })
}
```

- [ ] **Step 4: Run tests**

```bash
cd apps/api && pnpm vitest run src/agents/quote.agent.test.ts
```
Expected: 1 passing

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/agents/quote.agent.ts apps/api/src/jobs/
git commit -m "feat: add autonomous quote generation pipeline with policy gate and audit logging"
```

---

## Task 9: Operator Portal — Activity Feed + Exception Queue

**Files:**
- Create: `apps/operator/app/(dashboard)/feed/page.tsx`
- Create: `apps/operator/app/(dashboard)/exceptions/page.tsx`
- Create: `apps/operator/components/activity-feed.tsx`
- Create: `apps/operator/components/exception-card.tsx`

- [ ] **Step 1: Add shadcn components needed**

```bash
cd apps/operator
npx shadcn@latest add card badge button table tabs
```

- [ ] **Step 2: Create the activity feed component**

```tsx
// apps/operator/components/activity-feed.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ActivityEvent {
  id: string
  action: string
  resourceType: string
  resourceId: string
  autonomousAction: boolean
  confidenceScore: number | null
  createdAt: string
  actorId: string
}

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <div className="space-y-2">
      {events.map((event) => (
        <Card key={event.id} className="border-l-4 border-l-emerald-500">
          <CardContent className="py-3 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium">{formatAction(event.action)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {event.resourceType} · {event.resourceId.slice(0, 8)} · {new Date(event.createdAt).toLocaleTimeString()}
              </p>
            </div>
            <div className="flex gap-2 items-center">
              {event.autonomousAction && (
                <Badge variant="secondary" className="text-xs">Autonomous</Badge>
              )}
              {event.confidenceScore !== null && (
                <span className="text-xs text-muted-foreground">
                  {Math.round(event.confidenceScore * 100)}% confidence
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function formatAction(action: string): string {
  const labels: Record<string, string> = {
    'quote.sent': 'Quote sent to customer',
    'quote.pending_review': 'Quote held for review',
    'invoice.issued': 'Invoice issued',
    'payment.reconciled': 'Payment reconciled',
  }
  return labels[action] ?? action
}
```

- [ ] **Step 3: Create the exceptions page**

```tsx
// apps/operator/app/(dashboard)/exceptions/page.tsx
import { ExceptionCard } from '@/components/exception-card'

// Replace with real API call in next iteration
async function getExceptions() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exceptions`, {
    cache: 'no-store',
  })
  return res.json()
}

export default async function ExceptionsPage() {
  const exceptions = await getExceptions()
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-semibold mb-4">Exceptions Queue</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {exceptions.length} items require your attention
      </p>
      <div className="space-y-3">
        {exceptions.map((ex: any) => (
          <ExceptionCard key={ex.id} exception={ex} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Start the dev server and verify the UI renders**

```bash
cd apps/operator && pnpm dev
```
Open http://localhost:3000 — verify the dashboard shell loads without errors.

- [ ] **Step 5: Commit**

```bash
git add apps/operator/
git commit -m "feat: add operator portal activity feed and exceptions queue UI"
```

---

## Task 10: Stripe Billing Integration

**Files:**
- Create: `apps/api/src/modules/payments/stripe.service.ts`
- Create: `apps/api/src/modules/payments/stripe.service.test.ts`
- Create: `apps/api/src/modules/payments/webhooks.routes.ts`

- [ ] **Step 1: Install Stripe**

```bash
cd apps/api && pnpm add stripe
```

- [ ] **Step 2: Write the failing test**

```typescript
// apps/api/src/modules/payments/stripe.service.test.ts
import { describe, it, expect, vi } from 'vitest'
import { createStripeInvoice } from './stripe.service'

vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    customers: { create: vi.fn().mockResolvedValue({ id: 'cus_test' }) },
    invoices: {
      create: vi.fn().mockResolvedValue({ id: 'in_test', status: 'draft' }),
      finalizeInvoice: vi.fn().mockResolvedValue({ id: 'in_test', status: 'open' }),
      sendInvoice: vi.fn().mockResolvedValue({ id: 'in_test', status: 'open' }),
    },
    invoiceItems: { create: vi.fn().mockResolvedValue({ id: 'ii_test' }) },
  })),
}))

describe('createStripeInvoice', () => {
  it('creates and finalizes a Stripe invoice', async () => {
    const result = await createStripeInvoice({
      customerEmail: 'test@example.com',
      customerName: 'Acme Corp',
      amountDue: 150000, // cents
      description: 'H100 8x GPU — 12mo Reserved',
      daysUntilDue: 30,
    })
    expect(result.stripeInvoiceId).toBe('in_test')
    expect(result.status).toBe('open')
  })
})
```

- [ ] **Step 3: Implement Stripe service**

```typescript
// apps/api/src/modules/payments/stripe.service.ts
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-01-27.acacia' })

export interface CreateInvoiceInput {
  customerEmail: string
  customerName: string
  amountDue: number  // in cents
  description: string
  daysUntilDue: number
  stripeCustomerId?: string
}

export async function createStripeInvoice(input: CreateInvoiceInput) {
  let customerId = input.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: input.customerEmail,
      name: input.customerName,
    })
    customerId = customer.id
  }

  await stripe.invoiceItems.create({
    customer: customerId,
    amount: input.amountDue,
    currency: 'usd',
    description: input.description,
  })

  const invoice = await stripe.invoices.create({
    customer: customerId,
    collection_method: 'send_invoice',
    days_until_due: input.daysUntilDue,
    auto_advance: false,
  })

  const finalized = await stripe.invoices.finalizeInvoice(invoice.id)
  await stripe.invoices.sendInvoice(finalized.id)

  return { stripeInvoiceId: finalized.id, status: finalized.status, customerId }
}
```

- [ ] **Step 4: Write Stripe webhook handler for payment events**

```typescript
// apps/api/src/modules/payments/webhooks.routes.ts
import type { FastifyInstance } from 'fastify'
import Stripe from 'stripe'
import { invoices, payments } from '@gnomos/db'
import { eq } from 'drizzle-orm'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-01-27.acacia' })

export async function stripeWebhookRoutes(app: FastifyInstance) {
  app.post('/webhooks/stripe', {
    config: { rawBody: true },
  }, async (request, reply) => {
    const sig = request.headers['stripe-signature'] as string
    const event = stripe.webhooks.constructEvent(
      (request as any).rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!
    )

    if (event.type === 'invoice.paid') {
      const stripeInvoice = event.data.object as Stripe.Invoice
      const [invoice] = await app.db.select().from(invoices)
        .where(eq(invoices.stripeInvoiceId, stripeInvoice.id))

      if (invoice) {
        await app.db.insert(payments).values({
          tenantId: invoice.tenantId,
          invoiceId: invoice.id,
          amount: String((stripeInvoice.amount_paid / 100).toFixed(2)),
          method: stripeInvoice.payment_intent ? 'card' : 'ach',
          stripePaymentIntentId: String(stripeInvoice.payment_intent ?? ''),
          status: 'succeeded',
          processedAt: new Date(),
        })

        await app.db.update(invoices)
          .set({ status: 'paid', amountPaid: String((stripeInvoice.amount_paid / 100).toFixed(2)) })
          .where(eq(invoices.id, invoice.id))

        await app.audit({
          tenantId: invoice.tenantId, actorType: 'system', actorId: 'stripe-webhook',
          action: 'payment.reconciled', resourceType: 'invoice', resourceId: invoice.id,
          payload: { stripeInvoiceId: stripeInvoice.id },
          autonomousAction: true,
        })
      }
    }

    return reply.send({ received: true })
  })
}
```

- [ ] **Step 5: Run tests**

```bash
cd apps/api && pnpm vitest run src/modules/payments/stripe.service.test.ts
```
Expected: 1 passing

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/payments/
git commit -m "feat: add Stripe invoice creation and payment reconciliation webhook"
```

---

## Task 11: Tenant Portal (Lite)

**Files:**
- Create: `apps/tenant/app/quotes/page.tsx`
- Create: `apps/tenant/app/invoices/page.tsx`
- Create: `apps/tenant/app/layout.tsx`

- [ ] **Step 1: Initialize the tenant Next.js app**

```bash
cd apps/tenant
pnpm create next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias="@/*"
npx shadcn@latest init
npx shadcn@latest add card badge button table
```

- [ ] **Step 2: Create the quote view for tenants**

```tsx
// apps/tenant/app/quotes/page.tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

async function getQuotes(tenantToken: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenant/quotes`, {
    headers: { Authorization: `Bearer ${tenantToken}` },
    cache: 'no-store',
  })
  return res.json()
}

export default async function QuotesPage() {
  // In production, tenant token comes from session
  const quotes = await getQuotes(process.env.TENANT_DEV_TOKEN ?? '')

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold mb-6">Your Quotes</h1>
      <div className="space-y-4">
        {quotes.map((quote: any) => (
          <Card key={quote.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Quote #{quote.id.slice(0, 8)}</CardTitle>
                <Badge>{quote.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">${Number(quote.totalAmount).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Valid until {new Date(quote.validUntil).toLocaleDateString()}</p>
              {quote.status === 'sent' && (
                <div className="flex gap-2 mt-4">
                  <Button size="sm">Accept Quote</Button>
                  <Button size="sm" variant="outline">Request Changes</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/tenant/
git commit -m "feat: add tenant portal with quote and invoice views"
```

---

## Task 12: Benchmark Dashboard v1

**Files:**
- Create: `apps/api/src/modules/benchmarks/benchmarks.service.ts`
- Create: `apps/operator/app/(dashboard)/benchmarks/page.tsx`

- [ ] **Step 1: Create the benchmark data service (Phase 1 seed data)**

```typescript
// apps/api/src/modules/benchmarks/benchmarks.service.ts

export interface BenchmarkBand {
  gpuModel: string
  region: string
  termType: 'spot' | 'reserved_1mo' | 'reserved_12mo'
  lowPrice: number
  midPrice: number
  highPrice: number
  sampleSize: number  // anonymized count of contributor contracts
  updatedAt: Date
  trend: 'rising' | 'stable' | 'falling'
}

// Phase 1: Seed data based on public market signals (SemiAnalysis, Ornn OCPI)
// Phase 2: Replace with contributed contract data from operator customers
export async function getBenchmarkBands(
  gpuModel: string,
  region: string
): Promise<BenchmarkBand[]> {
  const seedData: Record<string, Record<string, BenchmarkBand[]>> = {
    H100: {
      'us-west': [
        {
          gpuModel: 'H100', region: 'us-west', termType: 'spot',
          lowPrice: 2.10, midPrice: 2.35, highPrice: 2.60,
          sampleSize: 12, updatedAt: new Date(), trend: 'rising',
        },
        {
          gpuModel: 'H100', region: 'us-west', termType: 'reserved_12mo',
          lowPrice: 1.90, midPrice: 2.15, highPrice: 2.40,
          sampleSize: 8, updatedAt: new Date(), trend: 'stable',
        },
      ],
    },
  }
  return seedData[gpuModel]?.[region] ?? []
}
```

- [ ] **Step 2: Create benchmark dashboard page**

```tsx
// apps/operator/app/(dashboard)/benchmarks/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

async function getBenchmarks() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/benchmarks?gpuModel=H100&region=us-west`, {
    cache: 'no-store'
  })
  return res.json()
}

export default async function BenchmarksPage() {
  const bands = await getBenchmarks()

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Market Benchmarks</h1>
        <Badge variant="outline">Contributor access</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bands.map((band: any, i: number) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {band.gpuModel} · {band.region} · {band.termType}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold">${band.midPrice}/hr</span>
                <Badge variant={band.trend === 'rising' ? 'destructive' : 'secondary'} className="mb-0.5">
                  {band.trend}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Range: ${band.lowPrice} – ${band.highPrice} · {band.sampleSize} contracts
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/benchmarks/ apps/operator/app/\(dashboard\)/benchmarks/
git commit -m "feat: add benchmark dashboard v1 with GPU market price bands"
```

---

## Phase 1 Completion Checklist

Before calling Phase 1 done, verify:

- [ ] `docker-compose up` starts postgres, redis, and cerbos cleanly
- [ ] `pnpm vitest run` passes all tests across all packages
- [ ] `pnpm dev` starts both operator and tenant portals without error
- [ ] Postmark inbound webhook receives test email, classifies intent, creates exception or queues quote
- [ ] A quote can be created, progress through state machine, and generate a Stripe invoice
- [ ] Audit log has rows for every agent action taken
- [ ] RLS prevents cross-tenant data access (write a test: query with wrong tenant_id, expect empty result)

---

## Subsystem Plans (create separately before execution)

Each of these warrants its own detailed plan with full task breakdown:

1. `2026-04-16-gnomos-auth.md` — Clerk or Auth.js for operator/tenant auth, RBAC
2. `2026-04-16-gnomos-contracts.md` — DocuSign/HelloSign integration, contract lifecycle
3. `2026-04-16-gnomos-negotiation.md` — AI counter-proposal agent, negotiation state machine
4. `2026-04-16-gnomos-collections.md` — Dunning logic, reminder sequences, collections playbooks
5. `2026-04-16-gnomos-handoff.md` — Internal ticket creation and routing, ops handoff engine
6. `2026-04-16-gnomos-benchmark-contrib.md` — Contributor data model, anonymization, tiered access
