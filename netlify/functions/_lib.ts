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
