import type { PricingInput, PricingOutput } from './pricing.types.js'

export const HOURS_PER_MONTH = 730

// Base rates per GPU-hour (USD) — Phase 1 seed data
// Phase 2: replaced by contributed benchmark engine
const BASE_RATES: Record<string, Partial<Record<string, number>>> = {
  H100: { 'us-west': 2.20, 'us-east': 2.15, 'eu-west': 2.35, 'ap-southeast': 2.45 },
  H200: { 'us-west': 3.10, 'us-east': 3.05, 'eu-west': 3.25, 'ap-southeast': 3.40 },
  A100: { 'us-west': 1.60, 'us-east': 1.55, 'eu-west': 1.70, 'ap-southeast': 1.75 },
  B200: { 'us-west': 4.50, 'us-east': 4.40, 'eu-west': 4.75 }, // ap-southeast not yet seeded
}

const TERM_DISCOUNTS: Record<number, number> = {
  1: 0,
  3: 0.03,
  6: 0.06,
  12: 0.10,
  24: 0.15,
  36: 0.20,
}

const TIER_ADJUSTMENTS: Record<string, number> = {
  standard: 0,
  priority: -0.02,
  strategic: -0.05,
}

export function calculatePrice(input: PricingInput): PricingOutput {
  const {
    skuType, gpuModel, region, termMonths, quantity,
    accountTier = 'standard', benchmarkBandLow, benchmarkBandHigh,
  } = input

  // Non-GPU SKUs: return placeholder until Phase 2
  if (skuType !== 'gpu_reserved' && skuType !== 'gpu_spot') {
    return {
      unitPrice: 0,
      totalPrice: 0,
      confidenceScore: 0.3,
      rationale: `Non-GPU SKU (${skuType}) — pricing requires manual review`,
      benchmarkPosition: 'unknown',
      requiresReview: true,
    }
  }

  const regionRates = gpuModel ? BASE_RATES[gpuModel] : undefined
  const baseRate = regionRates?.[region]

  if (baseRate === undefined) {
    return {
      unitPrice: 0,
      totalPrice: 0,
      confidenceScore: 0.3,
      rationale: `No base rate data for ${gpuModel ?? 'unknown'} in ${region} — manual pricing required`,
      benchmarkPosition: 'unknown',
      requiresReview: true,
    }
  }

  const termDiscount = TERM_DISCOUNTS[termMonths] ?? 0
  const tierAdjustment = TIER_ADJUSTMENTS[accountTier] ?? 0
  const unitPrice = baseRate * (1 - termDiscount + tierAdjustment)
  const totalPrice = unitPrice * quantity * termMonths * HOURS_PER_MONTH

  // Confidence: base 0.75 without benchmark (known rate), 0.85 with benchmark
  let confidenceScore = 0.75
  let benchmarkPosition: PricingOutput['benchmarkPosition'] = 'unknown'

  if (benchmarkBandLow !== undefined && benchmarkBandHigh !== undefined) {
    confidenceScore = 0.85
    if (unitPrice < benchmarkBandLow) benchmarkPosition = 'below_market'
    else if (unitPrice > benchmarkBandHigh) benchmarkPosition = 'above_market'
    else benchmarkPosition = 'at_market'
  }

  const termDiscountPct = (termDiscount * 100).toFixed(0)
  const tierAdjPct = (Math.abs(tierAdjustment) * 100).toFixed(0)
  const tierLabel = tierAdjustment < 0 ? `${tierAdjPct}% tier discount` : 'no tier discount'

  const rationale =
    `${gpuModel} ${region} ${termMonths}mo reserved: ` +
    `base $${baseRate.toFixed(2)}/hr, ${termDiscountPct}% term discount, ${tierLabel}. ` +
    `Unit price: $${unitPrice.toFixed(4)}/hr. ` +
    (benchmarkPosition !== 'unknown'
      ? `Benchmark position: ${benchmarkPosition} (band $${benchmarkBandLow}–$${benchmarkBandHigh}/hr).`
      : 'No benchmark data provided.')

  return {
    unitPrice,
    totalPrice,
    confidenceScore,
    rationale,
    benchmarkPosition,
    requiresReview: confidenceScore < 0.7,
  }
}
