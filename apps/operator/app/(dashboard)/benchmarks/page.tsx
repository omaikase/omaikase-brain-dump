'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BenchmarkCard } from '@/components/benchmark-card'
import type { BenchmarkEntry } from '@/components/benchmark-card'

const BENCHMARK_DATA: BenchmarkEntry[] = [
  // H100
  { gpuModel: 'H100', region: 'us-west', termType: 'spot', low: 2.10, mid: 2.35, high: 2.60, trend: 'rising', sampleSize: 14, change30d: +0.25 },
  { gpuModel: 'H100', region: 'us-west', termType: 'reserved_12mo', low: 1.90, mid: 2.15, high: 2.40, trend: 'stable', sampleSize: 9, change30d: +0.02 },
  { gpuModel: 'H100', region: 'us-east', termType: 'spot', low: 2.05, mid: 2.30, high: 2.55, trend: 'rising', sampleSize: 11, change30d: +0.20 },
  { gpuModel: 'H100', region: 'eu-west', termType: 'spot', low: 2.25, mid: 2.50, high: 2.75, trend: 'rising', sampleSize: 6, change30d: +0.30 },
  // H200
  { gpuModel: 'H200', region: 'us-west', termType: 'spot', low: 3.00, mid: 3.25, high: 3.60, trend: 'stable', sampleSize: 7, change30d: -0.05 },
  { gpuModel: 'H200', region: 'us-west', termType: 'reserved_12mo', low: 2.80, mid: 3.05, high: 3.30, trend: 'stable', sampleSize: 4, change30d: 0 },
  // A100
  { gpuModel: 'A100', region: 'us-west', termType: 'spot', low: 1.45, mid: 1.65, high: 1.85, trend: 'falling', sampleSize: 18, change30d: -0.15 },
  { gpuModel: 'A100', region: 'us-east', termType: 'spot', low: 1.40, mid: 1.60, high: 1.80, trend: 'falling', sampleSize: 12, change30d: -0.12 },
  // B200
  { gpuModel: 'B200', region: 'us-west', termType: 'spot', low: 4.20, mid: 4.55, high: 5.00, trend: 'rising', sampleSize: 3, change30d: +0.45 },
]

const GPU_MODELS = ['All', 'H100', 'H200', 'A100', 'B200']
const REGIONS = ['All', 'us-west', 'us-east', 'eu-west']

export default function BenchmarksPage() {
  const [gpuFilter, setGpuFilter] = useState('All')
  const [regionFilter, setRegionFilter] = useState('All')

  const filteredData = useMemo(() => {
    return BENCHMARK_DATA.filter((entry) => {
      const gpuMatch = gpuFilter === 'All' || entry.gpuModel === gpuFilter
      const regionMatch = regionFilter === 'All' || entry.region === regionFilter
      return gpuMatch && regionMatch
    })
  }, [gpuFilter, regionFilter])

  // Summary stats — always computed over full dataset
  const totalModels = new Set(BENCHMARK_DATA.map((e) => e.gpuModel)).size
  const avg30dChange =
    BENCHMARK_DATA.reduce((sum, e) => sum + e.change30d, 0) / BENCHMARK_DATA.length
  const contributorContracts = BENCHMARK_DATA.reduce((sum, e) => sum + e.sampleSize, 0)

  const avg30dFormatted = (() => {
    if (avg30dChange === 0) return '$0.00'
    const sign = avg30dChange > 0 ? '+' : '-'
    return `${sign}$${Math.abs(avg30dChange).toFixed(2)}`
  })()

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Market Benchmarks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            GPU spot and reserved pricing across regions
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 mt-0.5" title="Contributor access: you receive deeper benchmark segmentation and earlier signal movement">
          Contributor access
        </Badge>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">GPU</span>
          <Select value={gpuFilter} onValueChange={(v) => setGpuFilter(v ?? 'All')}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GPU_MODELS.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Region</span>
          <Select value={regionFilter} onValueChange={(v) => setRegionFilter(v ?? 'All')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(gpuFilter !== 'All' || regionFilter !== 'All') && (
          <button
            onClick={() => { setGpuFilter('All'); setRegionFilter('All') }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 rounded-xl bg-muted/40 p-4 ring-1 ring-foreground/5">
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Models tracked</p>
          <p className="text-xl font-semibold">{totalModels}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg 30d change</p>
          <p className={`text-xl font-semibold ${avg30dChange > 0 ? 'text-amber-600 dark:text-amber-400' : avg30dChange < 0 ? 'text-slate-500' : ''}`}>
            {avg30dFormatted}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Contributor contracts</p>
          <p className="text-xl font-semibold">{contributorContracts}</p>
        </div>
      </div>

      {/* Cards grid */}
      {filteredData.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No benchmarks match the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredData.map((entry, idx) => (
            <BenchmarkCard key={`${entry.gpuModel}-${entry.region}-${entry.termType}`} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
