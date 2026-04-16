import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface Exception {
  id: string
  type: string
  resourceType: string
  resourceId: string
  description: string
  suggestedAction: string | null
  createdAt: string
}

const EXCEPTION_TYPE_LABELS: Record<string, string> = {
  out_of_policy: 'Out of policy',
  low_confidence: 'Low confidence',
  major_contract_deviation: 'Contract deviation',
  payment_dispute: 'Payment dispute',
}

const EXCEPTION_TYPE_VARIANTS: Record<string, 'destructive' | 'default' | 'secondary'> = {
  out_of_policy: 'destructive',
  payment_dispute: 'destructive',
  low_confidence: 'default',
  major_contract_deviation: 'default',
}

export function ExceptionCard({ exception }: { exception: Exception }) {
  const label = EXCEPTION_TYPE_LABELS[exception.type] ?? exception.type
  const variant = EXCEPTION_TYPE_VARIANTS[exception.type] ?? 'secondary'

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant={variant} className="text-xs">{label}</Badge>
            <span className="text-xs text-muted-foreground">
              {exception.resourceType} · {exception.resourceId.slice(0, 8)}
            </span>
          </div>
          <p className="text-sm font-medium">{exception.description}</p>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {new Date(exception.createdAt).toLocaleTimeString()}
        </span>
      </CardHeader>
      {exception.suggestedAction && (
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground mb-3">
            Suggested: {exception.suggestedAction}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">Review</Button>
            <Button size="sm" variant="ghost" className="text-muted-foreground">Dismiss</Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
