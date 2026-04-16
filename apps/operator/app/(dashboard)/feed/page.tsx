import { ActivityFeed, type ActivityEvent } from '@/components/activity-feed'

// Seed data — will be replaced by real API call once backend is wired
const SEED_EVENTS: ActivityEvent[] = [
  {
    id: '1',
    action: 'quote.sent',
    resourceType: 'quote',
    resourceId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    autonomousAction: true,
    confidenceScore: 0.87,
    actorId: 'quote-agent',
    createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  },
  {
    id: '2',
    action: 'invoice.issued',
    resourceType: 'invoice',
    resourceId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    autonomousAction: true,
    confidenceScore: 0.95,
    actorId: 'billing-agent',
    createdAt: new Date(Date.now() - 22 * 60_000).toISOString(),
  },
  {
    id: '3',
    action: 'payment.reconciled',
    resourceType: 'payment',
    resourceId: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    autonomousAction: true,
    confidenceScore: null,
    actorId: 'stripe-webhook',
    createdAt: new Date(Date.now() - 60 * 60_000).toISOString(),
  },
]

export default function FeedPage() {
  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Activity</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Everything gnomos has done autonomously
          </p>
        </div>
      </div>
      <ActivityFeed events={SEED_EVENTS} />
    </div>
  )
}
