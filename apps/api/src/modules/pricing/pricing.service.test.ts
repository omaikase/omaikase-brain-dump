import { describe, it, expect } from 'vitest'
import { calculatePrice, HOURS_PER_MONTH } from './pricing.service.js'

describe('calculatePrice', () => {
  describe('GPU reserved pricing', () => {
    it('returns a positive price for H100 us-west 12-month reserved', () => {
      const result = calculatePrice({
        skuType: 'gpu_reserved',
        gpuModel: 'H100',
        region: 'us-west',
        termMonths: 12,
        quantity: 8,
        accountTier: 'standard',
      })
      expect(result.unitPrice).toBeGreaterThan(0)
      expect(result.totalPrice).toBeCloseTo(result.unitPrice * 8 * 12 * HOURS_PER_MONTH, 2)
      expect(result.confidenceScore).toBeGreaterThan(0)
      expect(result.confidenceScore).toBeLessThanOrEqual(1)
      expect(result.rationale).toBeTruthy()
      expect(result.requiresReview).toBe(false) // known model+region
    })

    it('applies longer-term discount — 12mo cheaper per-hour than 1mo', () => {
      const oneMonth = calculatePrice({
        skuType: 'gpu_reserved', gpuModel: 'H100', region: 'us-west',
        termMonths: 1, quantity: 1,
      })
      const twelveMonth = calculatePrice({
        skuType: 'gpu_reserved', gpuModel: 'H100', region: 'us-west',
        termMonths: 12, quantity: 1,
      })
      expect(twelveMonth.unitPrice).toBeLessThan(oneMonth.unitPrice)
    })

    it('applies strategic tier discount — strategic cheaper than standard', () => {
      const standard = calculatePrice({
        skuType: 'gpu_reserved', gpuModel: 'H100', region: 'us-west',
        termMonths: 6, quantity: 4, accountTier: 'standard',
      })
      const strategic = calculatePrice({
        skuType: 'gpu_reserved', gpuModel: 'H100', region: 'us-west',
        termMonths: 6, quantity: 4, accountTier: 'strategic',
      })
      expect(strategic.unitPrice).toBeLessThan(standard.unitPrice)
    })

    it('H200 is more expensive than H100 in same region and term', () => {
      const h100 = calculatePrice({
        skuType: 'gpu_reserved', gpuModel: 'H100', region: 'us-west', termMonths: 12, quantity: 1,
      })
      const h200 = calculatePrice({
        skuType: 'gpu_reserved', gpuModel: 'H200', region: 'us-west', termMonths: 12, quantity: 1,
      })
      expect(h200.unitPrice).toBeGreaterThan(h100.unitPrice)
    })

    it('eu-west is more expensive than us-west for same GPU and term', () => {
      const usWest = calculatePrice({
        skuType: 'gpu_reserved', gpuModel: 'H100', region: 'us-west', termMonths: 12, quantity: 1,
      })
      const euWest = calculatePrice({
        skuType: 'gpu_reserved', gpuModel: 'H100', region: 'eu-west', termMonths: 12, quantity: 1,
      })
      expect(euWest.unitPrice).toBeGreaterThan(usWest.unitPrice)
    })
  })

  describe('benchmark positioning', () => {
    it('marks at_market when unitPrice is within benchmark band', () => {
      const result = calculatePrice({
        skuType: 'gpu_reserved', gpuModel: 'H100', region: 'us-west',
        termMonths: 12, quantity: 8,
        benchmarkBandLow: 1.80, benchmarkBandHigh: 2.50,
      })
      expect(result.benchmarkPosition).toBe('at_market')
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0.8)
      expect(result.requiresReview).toBe(false)
    })

    it('marks below_market when unitPrice is below benchmark band', () => {
      const result = calculatePrice({
        skuType: 'gpu_reserved', gpuModel: 'H100', region: 'us-west',
        termMonths: 36, quantity: 8,         // max term discount → lowest price
        benchmarkBandLow: 2.50, benchmarkBandHigh: 3.00,  // set band higher
      })
      expect(result.benchmarkPosition).toBe('below_market')
    })

    it('marks above_market when unitPrice is above benchmark band', () => {
      const result = calculatePrice({
        skuType: 'gpu_reserved', gpuModel: 'H100', region: 'us-west',
        termMonths: 1, quantity: 1,          // no term discount → highest price
        benchmarkBandLow: 0.50, benchmarkBandHigh: 1.00, // set band lower
      })
      expect(result.benchmarkPosition).toBe('above_market')
    })

    it('returns unknown benchmark position when no band provided', () => {
      const result = calculatePrice({
        skuType: 'gpu_reserved', gpuModel: 'H100', region: 'us-west',
        termMonths: 12, quantity: 1,
      })
      expect(result.benchmarkPosition).toBe('unknown')
    })
  })

  describe('low confidence / requires review', () => {
    it('flags requiresReview true for unknown GPU model+region combo', () => {
      const result = calculatePrice({
        skuType: 'gpu_reserved',
        gpuModel: 'B200',
        region: 'ap-southeast',
        termMonths: 1,
        quantity: 1,
      })
      expect(result.requiresReview).toBe(true)
      expect(result.confidenceScore).toBeLessThan(0.7)
    })

    it('non-GPU SKU returns requiresReview true', () => {
      const result = calculatePrice({
        skuType: 'storage',
        region: 'us-west',
        termMonths: 1,
        quantity: 100,
      })
      expect(result.requiresReview).toBe(true)
    })
  })

  describe('rationale', () => {
    it('rationale mentions GPU model, region, and term', () => {
      const result = calculatePrice({
        skuType: 'gpu_reserved', gpuModel: 'H100', region: 'us-west',
        termMonths: 12, quantity: 8,
      })
      expect(result.rationale).toContain('H100')
      expect(result.rationale).toContain('us-west')
      expect(result.rationale).toContain('12')
    })
  })
})
