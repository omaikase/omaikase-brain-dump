import Link from 'next/link'
import { FileText, CheckCircle, MessageSquare, Clock } from 'lucide-react'
import { SEED_QUOTES } from '@/lib/seed-data'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateStr))
}

export default function QuotesPage() {
  const quotes = SEED_QUOTES

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Quotes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review and respond to pricing proposals.</p>
      </div>

      {quotes.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={FileText}
              title="No quotes yet"
              description="Quotes from your account manager will appear here once they're sent."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {quotes.map((quote) => (
            <Card key={quote.id} className="hover:ring-foreground/20 transition-all">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-base">
                      Quote {quote.id.toUpperCase()}
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        — {quote.accountName}
                      </span>
                    </CardTitle>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Sent {formatDate(quote.createdAt)}</span>
                      <span>·</span>
                      <span>Valid until {formatDate(quote.validUntil)}</span>
                      <span>·</span>
                      <span>{quote.lineItems.length} line item{quote.lineItems.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <StatusBadge status={quote.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-semibold text-foreground">
                      {formatCurrency(quote.totalAmount, quote.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Total contract value</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {quote.status === 'sent' && (
                      <>
                        <Link
                          href={`/quotes/${quote.id}`}
                          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
                        >
                          <MessageSquare className="size-3.5" />
                          Request Changes
                        </Link>
                        <Link
                          href={`/quotes/${quote.id}`}
                          className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'gap-1.5')}
                        >
                          <CheckCircle className="size-3.5" />
                          Accept Quote
                        </Link>
                      </>
                    )}
                    {quote.status === 'negotiating' && (
                      <div className="flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-md border border-amber-200 dark:border-amber-800">
                        <Clock className="size-3.5" />
                        Counter-proposal in progress
                      </div>
                    )}
                    {quote.status === 'accepted' && (
                      <div className="flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400">
                        <CheckCircle className="size-4" />
                        Accepted
                      </div>
                    )}
                    <Link
                      href={`/quotes/${quote.id}`}
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
