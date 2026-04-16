import { ExceptionCard, type Exception } from '@/components/exception-card'

const SEED_EXCEPTIONS: Exception[] = [
  {
    id: '1',
    type: 'low_confidence',
    resourceType: 'quote',
    resourceId: 'd4e5f6a7-b8c9-0123-defa-234567890123',
    description: 'Inbound quote request for B200 GPUs in ap-southeast — no benchmark data available for this region.',
    suggestedAction: 'Review pricing manually and set benchmark band before sending.',
    createdAt: new Date(Date.now() - 8 * 60_000).toISOString(),
  },
  {
    id: '2',
    type: 'out_of_policy',
    resourceType: 'quote',
    resourceId: 'e5f6a7b8-c9d0-1234-efab-345678901234',
    description: 'Requested discount of 18% exceeds the 10% autonomous approval threshold.',
    suggestedAction: 'Approve the discount manually or counter at 8%.',
    createdAt: new Date(Date.now() - 35 * 60_000).toISOString(),
  },
]

export default function ExceptionsPage() {
  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Exceptions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {SEED_EXCEPTIONS.length} items require your attention
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {SEED_EXCEPTIONS.map((ex) => (
          <ExceptionCard key={ex.id} exception={ex} />
        ))}
      </div>
    </div>
  )
}
