import { cn } from '@/lib/utils'

export type Trend = 'rising' | 'stable' | 'falling'

interface TrendIndicatorProps {
  trend: Trend
  className?: string
}

const TREND_CONFIG: Record<Trend, { label: string; icon: string; className: string }> = {
  rising: {
    label: 'Rising',
    icon: '↑',
    className: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-800',
  },
  stable: {
    label: 'Stable',
    icon: '→',
    className: 'text-muted-foreground bg-muted border-border',
  },
  falling: {
    label: 'Falling',
    icon: '↓',
    className: 'text-slate-500 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-900/30 dark:border-slate-700',
  },
}

export function BenchmarkTrendIndicator({ trend, className }: TrendIndicatorProps) {
  const config = TREND_CONFIG[trend]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  )
}
