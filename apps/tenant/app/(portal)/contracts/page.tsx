import Link from 'next/link'
import { ScrollText, Server } from 'lucide-react'
import { SEED_CONTRACTS } from '@/lib/seed-data'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateStr))
}

function getDurationLabel(startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))
  return `${months} months`
}

export default function ContractsPage() {
  const contracts = SEED_CONTRACTS

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Contracts</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your active and historical compute agreements.</p>
      </div>

      {contracts.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={ScrollText}
              title="No contracts yet"
              description="Contracts are created once a quote is accepted. Accept a quote to get started."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {contracts.map((contract) => (
            <Card key={contract.id} className="hover:ring-foreground/20 transition-all">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold">{contract.id.toUpperCase()}</span>
                      <StatusBadge status={contract.status} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Quote {contract.quoteId.toUpperCase()}</span>
                      <span>·</span>
                      <span>
                        {formatDate(contract.startDate)} – {formatDate(contract.endDate)}
                      </span>
                      <span>·</span>
                      <span>{getDurationLabel(contract.startDate, contract.endDate)}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Server className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{contract.gpuSummary}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-foreground">{formatCurrency(contract.totalValue)}</p>
                      <p className="text-xs text-muted-foreground">Total contract value</p>
                    </div>
                    <Link
                      href={`/contracts/${contract.id}`}
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    >
                      View Contract
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
