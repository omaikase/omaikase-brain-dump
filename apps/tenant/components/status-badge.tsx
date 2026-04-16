import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  // Quote statuses
  sent: {
    label: 'Awaiting Response',
    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
  },
  negotiating: {
    label: 'Negotiating',
    className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
  },
  accepted: {
    label: 'Accepted',
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300',
  },
  declined: {
    label: 'Declined',
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300',
  },
  expired: {
    label: 'Expired',
    className: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400',
  },
  // Contract statuses
  active: {
    label: 'Active',
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300',
  },
  terminated: {
    label: 'Terminated',
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300',
  },
  // Invoice statuses
  paid: {
    label: 'Paid',
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300',
  },
  overdue: {
    label: 'Overdue',
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300',
  },
  draft: {
    label: 'Draft',
    className: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400',
  },
}

interface StatusBadgeProps {
  status: string
  context?: 'quote' | 'invoice'
  className?: string
}

export function StatusBadge({ status, context, className }: StatusBadgeProps) {
  // For invoices, 'sent' means payment is due
  if (context === 'invoice' && status === 'sent') {
    return (
      <Badge
        variant="outline"
        className={cn('bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 font-medium', className)}
      >
        Payment Due
      </Badge>
    )
  }

  const config = STATUS_CONFIG[status] ?? {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    className: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  }

  return (
    <Badge
      variant="outline"
      className={cn(config.className, 'font-medium', className)}
    >
      {config.label}
    </Badge>
  )
}
