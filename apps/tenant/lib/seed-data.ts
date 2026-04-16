export const SEED_QUOTES = [
  {
    id: 'q-001',
    accountName: 'Acme AI',
    status: 'sent',
    totalAmount: 1284160,
    currency: 'USD',
    validUntil: '2026-05-15',
    createdAt: '2026-04-10',
    lineItems: [
      {
        description: 'H100 GPU — Reserved 12mo (us-west)',
        skuType: 'gpu_reserved',
        quantity: 8,
        unitPrice: 2.20,
        termMonths: 12,
        totalPrice: 154521.60,
      },
      {
        description: 'H100 GPU — Reserved 12mo (us-east)',
        skuType: 'gpu_reserved',
        quantity: 16,
        unitPrice: 2.15,
        termMonths: 12,
        totalPrice: 302054.40,
      },
    ],
    pricingRationale: 'Pricing based on 12-month reserved rate with standard tier discount.',
  },
  {
    id: 'q-002',
    accountName: 'Acme AI',
    status: 'negotiating',
    totalAmount: 820000,
    currency: 'USD',
    validUntil: '2026-04-30',
    createdAt: '2026-04-05',
    lineItems: [
      {
        description: 'H200 GPU — Reserved 6mo (us-west)',
        skuType: 'gpu_reserved',
        quantity: 8,
        unitPrice: 3.10,
        termMonths: 6,
        totalPrice: 108516.00,
      },
    ],
    pricingRationale: 'H200 6-month reserved rate. Counter-proposal pending.',
  },
  {
    id: 'q-003',
    accountName: 'Acme AI',
    status: 'accepted',
    totalAmount: 560000,
    currency: 'USD',
    validUntil: '2026-03-01',
    createdAt: '2026-02-15',
    lineItems: [
      {
        description: 'A100 GPU — Reserved 12mo (us-east)',
        skuType: 'gpu_reserved',
        quantity: 8,
        unitPrice: 1.55,
        termMonths: 12,
        totalPrice: 108566.40,
      },
    ],
    pricingRationale: 'A100 annual reserved.',
  },
]

export const SEED_CONTRACTS = [
  {
    id: 'c-001',
    quoteId: 'q-003',
    status: 'active',
    startDate: '2026-03-01',
    endDate: '2027-03-01',
    totalValue: 560000,
    gpuSummary: '8× A100 (us-east)',
  },
]

export const SEED_INVOICES = [
  {
    id: 'inv-001',
    contractId: 'c-001',
    invoiceNumber: 'INV-2026-001',
    status: 'sent',
    amountDue: 46666.67,
    amountPaid: 0,
    dueDate: '2026-05-01',
    issuedAt: '2026-04-01',
    description: 'A100 GPU — April 2026',
  },
  {
    id: 'inv-002',
    contractId: 'c-001',
    invoiceNumber: 'INV-2026-002',
    status: 'paid',
    amountDue: 46666.67,
    amountPaid: 46666.67,
    dueDate: '2026-04-01',
    issuedAt: '2026-03-01',
    description: 'A100 GPU — March 2026',
  },
]
