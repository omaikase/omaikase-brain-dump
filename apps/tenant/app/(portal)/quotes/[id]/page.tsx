import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, Info, Clock } from 'lucide-react'
import { SEED_QUOTES } from '@/lib/seed-data'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'

function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export default async function QuoteDetailPage(props: PageProps<'/quotes/[id]'>) {
  const { id } = await props.params
  const quote = SEED_QUOTES.find((q) => q.id === id)

  if (!quote) notFound()

  const lineItemsTotal = quote.lineItems.reduce((sum, item) => sum + item.totalPrice, 0)

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <Link
          href="/quotes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="size-3.5" />
          Back to Quotes
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Quote {quote.id.toUpperCase()}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Issued {formatDate(quote.createdAt)} · Valid until {formatDate(quote.validUntil)}
            </p>
          </div>
          <StatusBadge status={quote.status} />
        </div>
      </div>

      {/* Line items */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
          <CardDescription>
            Compute resources included in this quote
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price / hr</TableHead>
                <TableHead className="text-right">Term</TableHead>
                <TableHead className="text-right pr-4">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quote.lineItems.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="pl-4 font-medium">{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right">{item.termMonths} mo</TableCell>
                  <TableCell className="text-right pr-4">{formatCurrency(item.totalPrice)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="pl-4 font-semibold" colSpan={4}>
                  Line items subtotal
                </TableCell>
                <TableCell className="text-right pr-4 font-semibold">
                  {formatCurrency(lineItemsTotal)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Pricing summary */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span className="text-sm">{formatCurrency(lineItemsTotal)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-3">
            <span className="text-base font-semibold">Total Contract Value</span>
            <span className="text-xl font-bold">{formatCurrency(quote.totalAmount, quote.currency)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Pricing rationale */}
      {quote.pricingRationale && (
        <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/50 px-4 py-3 mb-6">
          <Info className="size-4 mt-0.5 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">{quote.pricingRationale}</p>
        </div>
      )}

      {/* Actions */}
      {quote.status === 'sent' && (
        <div className="flex items-center gap-3">
          <Button variant="destructive" size="sm">
            <XCircle className="size-4" />
            Decline Quote
          </Button>
          <Button size="sm">
            <CheckCircle className="size-4" />
            Accept Quote
          </Button>
          <p className="ml-2 text-xs text-muted-foreground">
            Accepting binds you to the terms above. Contact your account manager to negotiate.
          </p>
        </div>
      )}
      {quote.status === 'negotiating' && (
        <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 rounded-lg border border-amber-200 dark:border-amber-800">
          <Clock className="size-4 shrink-0" />
          <span>Your counter-proposal is being reviewed. We will reach out with an updated quote.</span>
        </div>
      )}
      {quote.status === 'accepted' && (
        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-3 rounded-lg border border-green-200 dark:border-green-800">
          <CheckCircle className="size-4 shrink-0" />
          <span>This quote was accepted. Your contract has been issued.</span>
        </div>
      )}
    </div>
  )
}
