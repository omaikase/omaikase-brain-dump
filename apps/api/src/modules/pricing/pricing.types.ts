export type SkuType = 'gpu_reserved' | 'gpu_spot' | 'storage' | 'networking' | 'support'

export type GpuModel = 'H100' | 'H200' | 'A100' | 'B200'

export type Region = 'us-west' | 'us-east' | 'eu-west' | 'ap-southeast'

export type AccountTier = 'standard' | 'priority' | 'strategic'

export type BenchmarkPosition = 'below_market' | 'at_market' | 'above_market' | 'unknown'

export interface PricingInput {
  skuType: SkuType
  gpuModel?: GpuModel
  region: Region
  termMonths: number       // 1 | 3 | 6 | 12 | 24 | 36
  quantity: number         // GPU count, storage TB, etc.
  accountTier?: AccountTier
  benchmarkBandLow?: number   // $/hr lower bound from benchmark engine
  benchmarkBandHigh?: number  // $/hr upper bound from benchmark engine
}

export interface PricingOutput {
  unitPrice: number        // $/hr for GPU, $/TB/mo for storage
  totalPrice: number       // unitPrice × quantity × term × HOURS_PER_MONTH (for GPU)
  confidenceScore: number  // 0–1
  rationale: string        // human-readable explanation
  benchmarkPosition: BenchmarkPosition
  requiresReview: boolean  // true if confidence < 0.7 or out-of-policy
}
