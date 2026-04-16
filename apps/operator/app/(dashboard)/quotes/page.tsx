'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type QuoteStatus = 'draft' | 'pending_review' | 'sent' | 'negotiating' | 'accepted' | 'rejected' | 'expired'

interface Quote {
  id: string
  accountName: string
  status: QuoteStatus
  totalAmount: number
  currency: string
  gpuSummary: string
  confidenceScore: number | null
  autonomousAction: boolean
  createdAt: string
  sentAt: string | null
}

const SEED_QUOTES: Quote[] = [
  {
    id: 'q-001',
    accountName: 'Acme AI',
    status: 'sent',
    totalAmount: 1284160,
    currency: 'USD',
    gpuSummary: '8× H100 (us-west) + 16× H100 (us-east)',
    confidenceScore: 0.87,
    autonomousAction: true,
    createdAt: '2026-04-10T09:32:00Z',
    sentAt: '2026-04-10T09:32:14Z',
  },
  {
    id: 'q-002',
    accountName: 'Meridian Cloud',
    status: 'negotiating',
    totalAmount: 820000,
    currency: 'USD',
    gpuSummary: '8× H200 (us-west)',
    confidenceScore: 0.81,
    autonomousAction: true,
    createdAt: '2026-04-05T14:10:00Z',
    sentAt: '2026-04-05T14:10:44Z',
  },
  {
    id: 'q-003',
    accountName: 'Acme AI',
    status: 'accepted',
    totalAmount: 560000,
    currency: 'USD',
    gpuSummary: '8× A100 (us-east)',
    confidenceScore: 0.92,
    autonomousAction: true,
    createdAt: '2026-02-15T11:00:00Z',
    sentAt: '2026-02-15T11:00:52Z',
  },
  {
    id: 'q-004',
    accountName: 'Nova Compute',
    status: 'pending_review',
    totalAmount: 0,
    currency: 'USD',
    gpuSummary: '4× B200 (ap-southeast)',
    confidenceScore: 0.42,
    autonomousAction: false,
    createdAt: '2026-04-16T08:15:00Z',
    sentAt: null,
  },
]

const STATUS_STYLES: Record<QuoteStatus, { label: string; className: string }> = {
  draft:          { label: 'Draft',           className: 'bg-zinc-100 text-zinc-700' },
  pending_review: { label: 'Needs Review',    className: 'bg-amber-100 text-amber-800' },
  sent:           { label: 'Sent',            className: 'bg-blue-100 text-blue-800' },
  negotiating:    { label: 'Negotiating',     className: 'bg-purple-100 text-purple-800' },
  accepted:       { label: 'Accepted',        className: 'bg-emerald-100 text-emerald-800' },
  rejected:       { label: 'Rejected',        className: 'bg-red-100 text-red-800' },
  expired:        { label: 'Expired',         className: 'bg-zinc-100 text-zinc-500' },
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const ALL_STATUSES: QuoteStatus[] = ['draft', 'pending_review', 'sent', 'negotiating', 'accepted', 'rejected', 'expired']

export default function QuotesPage() {
  const [filter, setFilter] = useState<QuoteStatus | 'all'>('all')

  const filtered = filter === 'all' ? SEED_QUOTES : SEED_QUOTES.filter(q => q.status === filter)

  const pendingCount = SEED_QUOTES.filter(q => q.status === 'pending_review').length

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Quotes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {SEED_QUOTES.length} total · {pendingCount} need review
          </p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setFilter('all')}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${filter === 'all' ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-muted'}`}
        >
          All
        </button>
        {ALL_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${filter === s ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-muted'}`}
          >
            {STATUS_STYLES[s].label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">No quotes match this filter.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(quote => {
            const { label, className } = STATUS_STYLES[quote.status]
            return (
              <Card key={quote.id} className="ring-1 ring-transparent hover:ring-foreground/20 transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-sm">{quote.accountName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{quote.gpuSummary}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {quote.autonomousAction && (
                        <span className="text-xs text-muted-foreground">Autonomous</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${className}`}>
                        {label}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {quote.totalAmount > 0 ? (
                      <p className="text-lg font-semibold">
                        ${quote.totalAmount.toLocaleString()}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Pricing pending</p>
                    )}
                    {quote.confidenceScore !== null && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {Math.round(quote.confidenceScore * 100)}% confidence
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs text-muted-foreground"
                    title={new Date(quote.createdAt).toLocaleString()}
                  >
                    {formatRelativeTime(quote.createdAt)}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
