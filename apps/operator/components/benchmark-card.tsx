import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BenchmarkTrendIndicator } from '@/components/benchmark-trend-indicator'
import type { Trend } from '@/components/benchmark-trend-indicator'
import { cn } from '@/lib/utils'

export interface BenchmarkEntry {
  gpuModel: string
  region: string
  termType: string
  low: number
  mid: number
  high: number
  trend: Trend
  sampleSize: number
  change30d: number
}

function formatTermType(termType: string): string {
  if (termType === 'spot') return 'Spot'
  if (termType === 'reserved_12mo') return '12mo Reserved'
  // Generic fallback: "reserved_6mo" → "6mo Reserved"
  return termType.replace('reserved_', '').replace('mo', 'mo ') + 'Reserved'
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

function formatChange(change: number): string {
  if (change === 0) return '$0.00'
  const sign = change > 0 ? '+' : '-'
  return `${sign}$${Math.abs(change).toFixed(2)}`
}

interface BenchmarkCardProps {
  entry: BenchmarkEntry
}

export function BenchmarkCard({ entry }: BenchmarkCardProps) {
  const { gpuModel, region, termType, low, mid, high, trend, sampleSize, change30d } = entry
  const isSparse = sampleSize < 5
  const changePositive = change30d > 0
  const changeZero = change30d === 0

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{gpuModel}</span>
              <span className="text-xs text-muted-foreground">{region}</span>
              <Badge variant="outline" className="text-xs">
                {formatTermType(termType)}
              </Badge>
              {isSparse && (
                <Badge variant="secondary" className="text-xs">
                  Sparse data
                </Badge>
              )}
            </div>
          </div>
          <BenchmarkTrendIndicator trend={trend} className="shrink-0" />
        </div>
      </CardHeader>

      <CardContent className="pt-3 space-y-3">
        {/* Mid price — large and prominent */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight">
            {formatPrice(mid)}
          </span>
          <span className="text-sm text-muted-foreground">/hr</span>
        </div>

        {/* Price range */}
        <p className="text-sm text-muted-foreground">
          Low {formatPrice(low)} · High {formatPrice(high)}
        </p>

        {/* 30d change + sample size */}
        <div className="flex items-center justify-between pt-1 border-t">
          <span
            className={cn(
              'text-sm font-medium',
              changeZero
                ? 'text-muted-foreground'
                : changePositive
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-500 dark:text-slate-400'
            )}
          >
            {formatChange(change30d)} <span className="font-normal text-muted-foreground text-xs">30d</span>
          </span>
          <span className="text-xs text-muted-foreground">
            {sampleSize} contract{sampleSize !== 1 ? 's' : ''}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
