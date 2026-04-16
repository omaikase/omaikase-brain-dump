import Link from 'next/link'
import { Receipt, CreditCard } from 'lucide-react'
import { SEED_INVOICES } from '@/lib/seed-data'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const TODAY = new Date('2026-04-15')

function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateStr))
}

function isOverdue(invoice: { status: string; dueDate: string }) {
  return invoice.status === 'sent' && new Date(invoice.dueDate) < TODAY
}

function getEffectiveStatus(invoice: { status: string; dueDate: string }) {
  if (isOverdue(invoice)) return 'overdue'
  return invoice.status
}

export default function InvoicesPage() {
  const invoices = SEED_INVOICES

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Invoices</h1>
        <p className="mt-1 text-sm text-muted-foreground">Monthly billing statements for your compute usage.</p>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Receipt}
              title="No invoices yet"
              description="Invoices are generated monthly once your contract is active."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {invoices.map((invoice) => {
            const overdue = isOverdue(invoice)
            const effectiveStatus = getEffectiveStatus(invoice)

            return (
              <Card
                key={invoice.id}
                className={cn(
                  'hover:ring-foreground/20 transition-all',
                  overdue && 'ring-destructive/30 hover:ring-destructive/50'
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold">{invoice.invoiceNumber}</span>
                        <StatusBadge status={effectiveStatus} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Issued {formatDate(invoice.issuedAt)}</span>
                        <span>·</span>
                        <span className={cn(overdue && 'text-destructive font-semibold')}>
                          Due {formatDate(invoice.dueDate)}
                          {overdue && ' — OVERDUE'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{invoice.description}</p>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xl font-bold text-foreground">
                            {formatCurrency(invoice.amountDue)}
                          </p>
                          <p className="text-xs text-muted-foreground">Amount due</p>
                        </div>
                        {invoice.amountPaid > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                              {formatCurrency(invoice.amountPaid)}
                            </p>
                            <p className="text-xs text-muted-foreground">Paid</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {invoice.status === 'sent' && (
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'gap-1.5')}
                        >
                          <CreditCard className="size-3.5" />
                          Pay Now
                        </Link>
                      )}
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                      >
                        View Invoice
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
