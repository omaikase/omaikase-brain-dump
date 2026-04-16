import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export interface ActivityEvent {
  id: string
  action: string
  resourceType: string
  resourceId: string
  autonomousAction: boolean
  confidenceScore: number | null
  actorId: string
  createdAt: string
}

const ACTION_LABELS: Record<string, string> = {
  'quote.sent': 'Quote sent to customer',
  'quote.pending_review': 'Quote held for human review',
  'quote.accepted': 'Quote accepted by customer',
  'invoice.issued': 'Invoice issued',
  'invoice.sent': 'Invoice sent to customer',
  'payment.reconciled': 'Payment reconciled',
  'contract.signed': 'Contract signed',
  'exception.created': 'Exception raised',
}

function formatAction(action: string): string {
  return ACTION_LABELS[action] ?? action
}

function getBorderColor(action: string): string {
  if (action.includes('pending_review') || action.includes('exception')) return 'border-l-amber-400'
  if (action.includes('reject') || action.includes('dispute')) return 'border-l-destructive'
  return 'border-l-emerald-500'
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

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No autonomous actions yet. gnomos will record activity here.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <Card key={event.id} className={`border-l-4 ${getBorderColor(event.action)}`}>
          <CardContent className="py-3 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{formatAction(event.action)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {event.resourceType} ·{' '}
                <Link href={`/${event.resourceType}s/${event.resourceId}`} className="underline underline-offset-2">
                  {event.resourceId.slice(0, 8)}
                </Link>{' '}
                ·{' '}
                <span title={new Date(event.createdAt).toLocaleString()}>
                  {formatRelativeTime(event.createdAt)}
                </span>
              </p>
            </div>
            <div className="flex gap-2 items-center shrink-0">
              {event.autonomousAction && (
                <Badge variant="secondary" className="text-xs">Autonomous</Badge>
              )}
              {event.confidenceScore !== null && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {Math.round(event.confidenceScore * 100)}%
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
