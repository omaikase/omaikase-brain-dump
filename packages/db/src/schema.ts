import {
  pgTable, uuid, text, timestamp, boolean, jsonb,
  pgEnum, numeric, integer, index
} from 'drizzle-orm/pg-core'

// ─── Enums ─────────────────────────────────────────────────────────────────

export const autonomyModeEnum = pgEnum('autonomy_mode', ['shadow', 'assisted', 'full'])

export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'succeeded', 'failed', 'refunded'])

// ─── Tenants ───────────────────────────────────────────────────────────────

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  autonomyMode: autonomyModeEnum('autonomy_mode').notNull().default('shadow'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Accounts & Contacts ───────────────────────────────────────────────────

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  type: text('type').notNull(), // operator | tenant_customer
  region: text('region'),
  tier: text('tier'), // standard | priority | strategic
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('accounts_tenant_id_idx').on(t.tenantId),
])

export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('contacts_tenant_id_idx').on(t.tenantId),
])

// ─── Quotes ────────────────────────────────────────────────────────────────

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
  validUntil: timestamp('valid_until', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  autonomousAction: boolean('autonomous_action').notNull().default(false),
  confidenceScore: numeric('confidence_score', { precision: 4, scale: 3 }),
  pricingRationale: jsonb('pricing_rationale'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('quotes_tenant_id_idx').on(t.tenantId),
])

export const quoteLineItems = pgTable('quote_line_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  quoteId: uuid('quote_id').notNull().references(() => quotes.id),
  description: text('description').notNull(),
  skuType: text('sku_type').notNull(), // gpu_reserved | gpu_spot | storage | networking | support
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 15, scale: 6 }).notNull(),
  totalPrice: numeric('total_price', { precision: 15, scale: 2 }).notNull(),
  termMonths: integer('term_months'),
  metadata: jsonb('metadata'),
}, (t) => [
  index('quote_line_items_quote_id_idx').on(t.quoteId),
])

// ─── Contracts ─────────────────────────────────────────────────────────────

export const contractStatusEnum = pgEnum('contract_status', [
  'draft', 'pending_signature', 'active', 'expired', 'terminated'
])

export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  quoteId: uuid('quote_id').references(() => quotes.id),
  status: contractStatusEnum('status').notNull().default('draft'),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  totalValue: numeric('total_value', { precision: 15, scale: 2 }),
  signedAt: timestamp('signed_at', { withTimezone: true }),
  signatureProvider: text('signature_provider'),
  signatureDocumentId: text('signature_document_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('contracts_tenant_id_idx').on(t.tenantId),
])

// ─── Invoices ──────────────────────────────────────────────────────────────

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
  dueDate: timestamp('due_date', { withTimezone: true }),
  issuedAt: timestamp('issued_at', { withTimezone: true }),
  stripeInvoiceId: text('stripe_invoice_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('invoices_tenant_id_idx').on(t.tenantId),
])

// ─── Payments ──────────────────────────────────────────────────────────────

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  method: text('method').notNull(), // card | ach | wire
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  status: paymentStatusEnum('status').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('payments_tenant_id_idx').on(t.tenantId),
])

// ─── Audit Log (immutable) ─────────────────────────────────────────────────

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  // No FK on tenant_id intentionally — audit records must survive tenant soft-delete
  tenantId: uuid('tenant_id').notNull(),
  actorType: text('actor_type').notNull(), // user | agent | system
  actorId: text('actor_id').notNull(),
  action: text('action').notNull(), // quote.sent | invoice.issued | payment.reconciled
  resourceType: text('resource_type').notNull(),
  resourceId: uuid('resource_id').notNull(),
  payload: jsonb('payload'),
  policyRuleId: text('policy_rule_id'),
  confidenceScore: numeric('confidence_score', { precision: 4, scale: 3 }),
  autonomousAction: boolean('autonomous_action').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('audit_log_tenant_id_idx').on(t.tenantId),
])

// ─── Exceptions ────────────────────────────────────────────────────────────

export const exceptions = pgTable('exceptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  type: text('type').notNull(), // out_of_policy | low_confidence | major_contract_deviation | payment_dispute
  resourceType: text('resource_type').notNull(),
  resourceId: uuid('resource_id').notNull(),
  description: text('description').notNull(),
  suggestedAction: text('suggested_action'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedBy: uuid('resolved_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('exceptions_tenant_id_idx').on(t.tenantId),
])
