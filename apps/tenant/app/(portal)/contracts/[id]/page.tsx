import Link from 'next/link'
import { ArrowLeft, Server } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { SEED_CONTRACTS, SEED_QUOTES, SEED_INVOICES } from '@/lib/seed-data'

function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default async function ContractDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const contract = SEED_CONTRACTS.find((c) => c.id === id)

  if (!contract) {
    return <div className="p-6 text-muted-foreground">Contract not found.</div>
  }

  const relatedQuote = SEED_QUOTES.find((q) => q.id === contract.quoteId)
  const relatedInvoices = SEED_INVOICES.filter((inv) => inv.contractId === contract.id)

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/contracts"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Contracts
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{contract.id.toUpperCase()}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{contract.gpuSummary}</p>
        </div>
        <StatusBadge status={contract.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contract Terms</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Start Date</p>
            <p className="font-medium">{contract.startDate}</p>
          </div>
          <div>
            <p className="text-muted-foreground">End Date</p>
            <p className="font-medium">{contract.endDate}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Value</p>
            <p className="font-medium">{formatCurrency(contract.totalValue)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">GPU Allocation</p>
            <p className="font-medium flex items-center gap-1.5">
              <Server className="size-3.5 text-muted-foreground" />
              {contract.gpuSummary}
            </p>
          </div>
        </CardContent>
      </Card>

      {relatedQuote && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Originating Quote</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/quotes/${relatedQuote.id}`}
              className="text-sm underline underline-offset-2"
            >
              View Quote {relatedQuote.id.toUpperCase()} —{' '}
              {formatCurrency(relatedQuote.totalAmount)}
            </Link>
          </CardContent>
        </Card>
      )}

      {relatedInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {relatedInvoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between text-sm">
                <Link href={`/invoices/${inv.id}`} className="underline underline-offset-2">
                  {inv.invoiceNumber}
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    {formatCurrency(inv.amountDue)}
                  </span>
                  <StatusBadge status={inv.status} context="invoice" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
