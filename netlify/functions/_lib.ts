import Stripe from 'stripe'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    stripe = new Stripe(key)
  }
  return stripe
}

let supabaseAdmin: SupabaseClient | null = null
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set')
    supabaseAdmin = createClient(url, key)
  }
  return supabaseAdmin
}

export const COURIER_FEE: Record<'peninsular' | 'east_malaysia', number> = {
  peninsular: 15,
  east_malaysia: 25,
}

const BASE_FEE = 15
const NO_RESTORE_DISCOUNT = 0.25

// Mirrors the piecewise-linear interpolation in PriceCalculator.tsx — anchors
// the estimate to actual pricing_tiers rows so it tallies with the package
// price at each tier's photo count, instead of a flat per-photo rate.
export function interpolatePrice(photos: number, tiers: { photos: number; price: number }[]): number {
  const sorted = [...tiers].sort((a, b) => a.photos - b.photos)
  if (sorted.length === 0) return BASE_FEE

  const first = sorted[0]
  if (photos <= first.photos) {
    return BASE_FEE + (photos / first.photos) * (first.price - BASE_FEE)
  }
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]
    const b = sorted[i + 1]
    if (photos <= b.photos) {
      const t = (photos - a.photos) / (b.photos - a.photos)
      return a.price + t * (b.price - a.price)
    }
  }
  const a = sorted[sorted.length - 2] ?? { photos: 0, price: BASE_FEE }
  const b = sorted[sorted.length - 1]
  const slope = (b.price - a.price) / (b.photos - a.photos)
  return b.price + slope * (photos - b.photos)
}

export async function computeCustomEstimate(photos: number, restore: boolean): Promise<number> {
  const { data } = await getSupabaseAdmin().from('pricing_tiers').select('photos, price')
  const raw = interpolatePrice(photos, data ?? [])
  const withDiscount = restore ? raw : raw * (1 - NO_RESTORE_DISCOUNT)
  return Math.round(withDiscount * 100) / 100
}
