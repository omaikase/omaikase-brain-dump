import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CreditCard, CheckCircle, AlertCircle } from 'lucide-react'
import { SEED_INVOICES } from '@/lib/seed-data'
import { StatusBadge } from '@/components/status-badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const TODAY = new Date('2026-04-15')

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
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

function isOverdue(invoice: { status: string; dueDate: string }) {
  return invoice.status === 'sent' && new Date(invoice.dueDate) < TODAY
}

function getEffectiveStatus(invoice: { status: string; dueDate: string }) {
  if (isOverdue(invoice)) return 'overdue'
  return invoice.status
}

export default async function InvoiceDetailPage(props: PageProps<'/invoices/[id]'>) {
  const { id } = await props.params
  const invoice = SEED_INVOICES.find((inv) => inv.id === id)

  if (!invoice) notFound()

  const overdue = isOverdue(invoice)
  const effectiveStatus = getEffectiveStatus(invoice)
  const balance = invoice.amountDue - invoice.amountPaid

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="size-3.5" />
          Back to Invoices
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {invoice.invoiceNumber}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{invoice.description}</p>
          </div>
          <StatusBadge status={effectiveStatus} />
        </div>
      </div>

      {/* Invoice metadata */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
          <CardDescription>Contract {invoice.contractId.toUpperCase()}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-y-3 gap-x-8 text-sm">
            <div>
              <dt className="text-muted-foreground">Invoice Number</dt>
              <dd className="font-medium mt-0.5">{invoice.invoiceNumber}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="mt-0.5">
                <StatusBadge status={effectiveStatus} />
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Issue Date</dt>
              <dd className="font-medium mt-0.5">{formatDate(invoice.issuedAt)}</dd>
            </div>
            <div>
              <dt className={overdue ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                Due Date{overdue ? ' — OVERDUE' : ''}
              </dt>
              <dd className={`font-medium mt-0.5 ${overdue ? 'text-destructive' : ''}`}>
                {formatDate(invoice.dueDate)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Itemized amounts */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{invoice.description}</span>
              <span>{formatCurrency(invoice.amountDue)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Amount Due</span>
              <span>{formatCurrency(invoice.amountDue)}</span>
            </div>
            {invoice.amountPaid > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="text-green-700 dark:text-green-400">
                  − {formatCurrency(invoice.amountPaid)}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Balance Due</span>
              <span className={balance > 0 && overdue ? 'text-destructive' : ''}>
                {formatCurrency(balance)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment status / actions */}
      {invoice.status === 'paid' && (
        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-3 rounded-lg border border-green-200 dark:border-green-800 mb-4">
          <CheckCircle className="size-4 shrink-0" />
          <span>
            Payment of {formatCurrency(invoice.amountPaid)} received.
          </span>
        </div>
      )}
      {overdue && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 px-4 py-3 rounded-lg border border-destructive/20 mb-4">
          <AlertCircle className="size-4 shrink-0" />
          <span>This invoice is past due. Please arrange payment to avoid service interruption.</span>
        </div>
      )}
      {invoice.status === 'sent' && (
        <div className="flex items-center gap-3">
          <a
            href="#pay"
            className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'gap-1.5')}
          >
            <CreditCard className="size-4" />
            Pay {formatCurrency(balance)}
          </a>
          <p className="text-xs text-muted-foreground">
            Secure payment processing. You will be redirected to complete your payment.
          </p>
        </div>
      )}
    </div>
  )
}
