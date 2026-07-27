# Order, Checkout & Payment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let customers pick a package, choose pickup or courier delivery, pay via Stripe Checkout, and land on a confirmation page — replacing the current "request a quote" CTA as the primary conversion path.

**Architecture:** React frontend (existing Vite app) collects order details in a new `OrderForm`, POSTs to a Netlify Function that creates a Stripe Checkout Session and a `pending` Supabase order row, redirects to Stripe, and a webhook function marks the order `paid`. A third function serves the order summary back to a new success view. See spec: `docs/superpowers/specs/2026-07-27-order-checkout-payment-design.md`.

**Tech Stack:** React 19 + TypeScript + Vite (existing), Netlify Functions (new), Stripe Node SDK (new dependency), Supabase (existing, service-role access added for functions).

## Global Constraints

- Currency is MYR throughout (spec).
- One package per order — no multi-item cart (spec).
- Customer pays the fixed tier price upfront; no partial/deposit logic (spec).
- Guest checkout only — no auth/login anywhere in this feature (spec).
- Courier fee is a hardcoded flat fee, two regions: Peninsular Malaysia / Sabah & Sarawak (spec).
- `orders` table has no anon RLS policies — only the service-role key (used inside Netlify Functions) may read/write it (spec).
- No automated test suite for this feature, matching the rest of the site (spec's explicit "Testing" section). Verification steps below are manual: `netlify dev` + `curl` / browser, one concrete command per step — not skipped, just not unit tests.
- Follow existing code style: Tailwind utility classes, existing color tokens (`cream`, `ink`, `terracotta`, `teal-dark`, `gold`), `framer-motion` for entrance animation, matching `PriceCalculator.tsx` / `LeadForm.tsx` patterns.

---

### Task 1: Netlify Functions setup + shared Stripe/Supabase clients

**Files:**
- Create: `netlify/functions/_lib.ts`
- Modify: `netlify.toml`
- Modify: `package.json`
- Modify: `.env.example`

**Interfaces:**
- Produces: `getStripe(): Stripe` and `getSupabaseAdmin(): SupabaseClient` from `netlify/functions/_lib.ts`, used by every function in Tasks 2-4.

- [ ] **Step 1: Install dependencies**

```bash
cd "moments-app" && npm install stripe && npm install -D @netlify/functions netlify-cli
```

- [ ] **Step 2: Add functions directory to Netlify config**

Modify `netlify.toml` to:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[functions]
  directory = "netlify/functions"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

- [ ] **Step 3: Add server-side env vars to `.env.example`**

Append to `.env.example`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Server-side only (Netlify Functions) — never prefix with VITE_, never expose to the client
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SITE_URL=http://localhost:8888
```

- [ ] **Step 4: Write the shared client helper**

Create `netlify/functions/_lib.ts`:

```ts
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
```

- [ ] **Step 5: Verify it compiles**

Run: `cd "moments-app" && npx tsc -b --noEmit`
Expected: no errors referencing `_lib.ts`.

- [ ] **Step 6: Commit**

```bash
cd "moments-app" && git add netlify/functions/_lib.ts netlify.toml package.json package-lock.json .env.example
git commit -m "Add Netlify Functions scaffolding + shared Stripe/Supabase clients"
```

---

### Task 2: `orders` table migration

**Files:**
- Modify: `supabase/schema.sql`

**Interfaces:**
- Produces: `orders` table with columns used verbatim by Tasks 3-5: `id, tier_name, package_price, courier_fee, total, currency, customer_name, customer_email, customer_phone, fulfillment_method, region, shipping_address, status, stripe_session_id, stripe_payment_intent_id, created_at`.

- [ ] **Step 1: Append the table definition**

Append to `supabase/schema.sql`:

```sql
-- Orders placed via Stripe Checkout. No anon policies: only the service-role
-- key (used inside Netlify Functions) reads/writes this table.
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  tier_name text not null,
  package_price numeric not null,
  courier_fee numeric not null default 0,
  total numeric not null,
  currency text not null default 'MYR',
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  fulfillment_method text not null check (fulfillment_method in ('pickup', 'courier')),
  region text check (region in ('peninsular', 'east_malaysia')),
  shipping_address jsonb,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

alter table orders enable row level security;
```

- [ ] **Step 2: Run it in Supabase**

In Supabase Studio → SQL Editor, paste and run the new block above (same manual-apply pattern as the rest of `schema.sql`).
Verify: Table Editor shows an empty `orders` table with those columns.

- [ ] **Step 3: Commit**

```bash
cd "moments-app" && git add supabase/schema.sql
git commit -m "Add orders table for checkout"
```

---

### Task 3: `create-checkout-session` function

**Files:**
- Create: `netlify/functions/create-checkout-session.ts`

**Interfaces:**
- Consumes: `getStripe()`, `getSupabaseAdmin()`, `COURIER_FEE` from `netlify/functions/_lib.ts` (Task 1); `orders` table columns (Task 2).
- Produces: `POST /.netlify/functions/create-checkout-session` — request body `{ tierName: string, tierPrice: number, fulfillment: 'pickup' | 'courier', region?: 'peninsular' | 'east_malaysia', customer: { name: string, email: string, phone?: string }, shippingAddress?: { line1: string, city: string, state: string, postcode: string } }`, response `{ url: string }` on success (200) or `{ error: string }` (400/500). Consumed by `OrderForm` in Task 6.

- [ ] **Step 1: Write the function**

Create `netlify/functions/create-checkout-session.ts`:

```ts
import type { Handler } from '@netlify/functions'
import { getStripe, getSupabaseAdmin, COURIER_FEE } from './_lib'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  let body: any
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { tierName, tierPrice, fulfillment, region, customer, shippingAddress } = body

  if (!tierName || typeof tierPrice !== 'number' || tierPrice <= 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing or invalid tier' }) }
  }
  if (fulfillment !== 'pickup' && fulfillment !== 'courier') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid fulfillment method' }) }
  }
  if (fulfillment === 'courier' && region !== 'peninsular' && region !== 'east_malaysia') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid region for courier delivery' }) }
  }
  if (!customer?.name || !customer?.email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing customer name or email' }) }
  }

  // Courier fee is always computed server-side — never trust a client-sent amount.
  const courierFee = fulfillment === 'courier' ? COURIER_FEE[region as 'peninsular' | 'east_malaysia'] : 0
  const total = tierPrice + courierFee

  const lineItems = [
    {
      price_data: {
        currency: 'myr',
        product_data: { name: `${tierName} package` },
        unit_amount: Math.round(tierPrice * 100),
      },
      quantity: 1,
    },
  ]
  if (courierFee > 0) {
    lineItems.push({
      price_data: {
        currency: 'myr',
        product_data: { name: `Courier delivery (${region === 'east_malaysia' ? 'Sabah & Sarawak' : 'Peninsular Malaysia'})` },
        unit_amount: Math.round(courierFee * 100),
      },
      quantity: 1,
    })
  }

  const siteUrl = process.env.SITE_URL ?? 'http://localhost:8888'
  const stripe = getStripe()

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card', 'fpx'],
    line_items: lineItems,
    customer_email: customer.email,
    success_url: `${siteUrl}/?session_id={CHECKOUT_SESSION_ID}#order-success`,
    cancel_url: `${siteUrl}/#pricing`,
  })

  const { error: dbError } = await getSupabaseAdmin().from('orders').insert({
    tier_name: tierName,
    package_price: tierPrice,
    courier_fee: courierFee,
    total,
    customer_name: customer.name,
    customer_email: customer.email,
    customer_phone: customer.phone ?? null,
    fulfillment_method: fulfillment,
    region: fulfillment === 'courier' ? region : null,
    shipping_address: fulfillment === 'courier' ? shippingAddress : null,
    status: 'pending',
    stripe_session_id: session.id,
  })

  if (dbError) {
    return { statusCode: 500, body: JSON.stringify({ error: dbError.message }) }
  }

  return { statusCode: 200, body: JSON.stringify({ url: session.url }) }
}
```

- [ ] **Step 2: Verify manually with `netlify dev`**

Run: `cd "moments-app" && netlify dev` (leave running), then in another terminal:

```bash
curl -s -X POST http://localhost:8888/.netlify/functions/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"tierName":"Basic","tierPrice":49.9,"fulfillment":"courier","region":"peninsular","customer":{"name":"Test User","email":"test@example.com"}}'
```

Expected: JSON response with a `url` field starting `https://checkout.stripe.com/...`. Confirm a new `pending` row appeared in the Supabase `orders` table with `courier_fee = 15` and `total = 64.9`.

- [ ] **Step 3: Commit**

```bash
cd "moments-app" && git add netlify/functions/create-checkout-session.ts
git commit -m "Add create-checkout-session function"
```

---

### Task 4: `stripe-webhook` function

**Files:**
- Create: `netlify/functions/stripe-webhook.ts`

**Interfaces:**
- Consumes: `getStripe()`, `getSupabaseAdmin()` from `netlify/functions/_lib.ts` (Task 1); `orders.stripe_session_id` written by Task 3.
- Produces: `POST /.netlify/functions/stripe-webhook` — Stripe webhook endpoint. On `checkout.session.completed`, sets that order's `status` to `'paid'` and stores `stripe_payment_intent_id`.

- [ ] **Step 1: Write the function**

Create `netlify/functions/stripe-webhook.ts`:

```ts
import type { Handler } from '@netlify/functions'
import { getStripe, getSupabaseAdmin } from './_lib'

export const handler: Handler = async (event) => {
  const signature = event.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret || !event.body) {
    return { statusCode: 400, body: 'Missing signature or body' }
  }

  const stripe = getStripe()
  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, signature, webhookSecret)
  } catch (err) {
    return { statusCode: 400, body: `Signature verification failed: ${(err as Error).message}` }
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as { id: string; payment_intent: string | null }

    const { error } = await getSupabaseAdmin()
      .from('orders')
      .update({ status: 'paid', stripe_payment_intent_id: session.payment_intent })
      .eq('stripe_session_id', session.id)

    if (error) {
      return { statusCode: 500, body: error.message }
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) }
}
```

- [ ] **Step 2: Verify manually with the Stripe CLI**

Run (Stripe CLI already authenticated, `netlify dev` still running from Task 3):

```bash
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

Copy the `whsec_...` value it prints into `STRIPE_WEBHOOK_SECRET` in your local `.env`, restart `netlify dev`, then in a third terminal:

```bash
stripe trigger checkout.session.completed
```

Expected: the webhook function logs `200`, and (for a real session created via Task 3's curl + completing payment on the returned Stripe URL with test card `4242 4242 4242 4242`) the matching `orders` row flips to `status = 'paid'` with `stripe_payment_intent_id` populated.

- [ ] **Step 3: Commit**

```bash
cd "moments-app" && git add netlify/functions/stripe-webhook.ts
git commit -m "Add stripe-webhook function to mark orders paid"
```

---

### Task 5: `get-order` function

**Files:**
- Create: `netlify/functions/get-order.ts`

**Interfaces:**
- Consumes: `getSupabaseAdmin()` from `netlify/functions/_lib.ts` (Task 1).
- Produces: `GET /.netlify/functions/get-order?session_id=...` — response `{ order: { tierName: string, courierFee: number, total: number, currency: string, fulfillment: 'pickup' | 'courier', status: 'pending' | 'paid' | 'failed', customerName: string } }` (200), or `{ error: string }` (404/400). Consumed by `OrderSuccess` in Task 8.

- [ ] **Step 1: Write the function**

Create `netlify/functions/get-order.ts`:

```ts
import type { Handler } from '@netlify/functions'
import { getSupabaseAdmin } from './_lib'

export const handler: Handler = async (event) => {
  const sessionId = event.queryStringParameters?.session_id
  if (!sessionId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing session_id' }) }
  }

  const { data, error } = await getSupabaseAdmin()
    .from('orders')
    .select('tier_name, courier_fee, total, currency, fulfillment_method, status, customer_name')
    .eq('stripe_session_id', sessionId)
    .single()

  if (error || !data) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Order not found' }) }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      order: {
        tierName: data.tier_name,
        courierFee: data.courier_fee,
        total: data.total,
        currency: data.currency,
        fulfillment: data.fulfillment_method,
        status: data.status,
        customerName: data.customer_name,
      },
    }),
  }
}
```

- [ ] **Step 2: Verify manually**

With the `pending`/`paid` order from Tasks 3-4 (`netlify dev` still running):

```bash
curl -s "http://localhost:8888/.netlify/functions/get-order?session_id=<the session id from Task 3>"
```

Expected: `{"order":{"tierName":"Basic","courierFee":15,...}}`. Also try a bogus `session_id` and confirm you get a 404 with `{"error":"Order not found"}`.

- [ ] **Step 3: Commit**

```bash
cd "moments-app" && git add netlify/functions/get-order.ts
git commit -m "Add get-order function for the success page"
```

---

### Task 6: `OrderForm` component

**Files:**
- Create: `src/components/OrderForm.tsx`

**Interfaces:**
- Consumes: `POST /.netlify/functions/create-checkout-session` (Task 3).
- Produces: `OrderForm` React component, props `{ tier: { name: string, price: number } | null, onClose: () => void }`. Rendered from `App.tsx` in Task 7. Renders nothing when `tier` is `null`.

- [ ] **Step 1: Write the component**

Create `src/components/OrderForm.tsx`:

```tsx
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const COURIER_FEE = { peninsular: 15, east_malaysia: 25 } as const

interface OrderFormProps {
  tier: { name: string; price: number } | null
  onClose: () => void
}

export default function OrderForm({ tier, onClose }: OrderFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [fulfillment, setFulfillment] = useState<'pickup' | 'courier'>('pickup')
  const [region, setRegion] = useState<'peninsular' | 'east_malaysia'>('peninsular')
  const [line1, setLine1] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postcode, setPostcode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const courierFee = fulfillment === 'courier' ? COURIER_FEE[region] : 0
  const total = useMemo(() => (tier ? tier.price + courierFee : 0), [tier, courierFee])

  if (!tier) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierName: tier.name,
          tierPrice: tier.price,
          fulfillment,
          region: fulfillment === 'courier' ? region : undefined,
          customer: { name, email, phone },
          shippingAddress: fulfillment === 'courier' ? { line1, city, state, postcode } : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      window.location.href = data.url
    } catch (err) {
      setError((err as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-3xl bg-cream text-ink p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-semibold">Order: {tier.name}</h3>
              <p className="text-ink/60 text-sm mt-1">RM{tier.price.toFixed(2)} package</p>
            </div>
            <button onClick={onClose} aria-label="Close" className="text-ink/50 hover:text-ink">
              <X size={22} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              required
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-ink/15 px-4 py-3 outline-none focus:border-terracotta"
            />
            <input
              required
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-ink/15 px-4 py-3 outline-none focus:border-terracotta"
            />
            <input
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-ink/15 px-4 py-3 outline-none focus:border-terracotta"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFulfillment('pickup')}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold ${fulfillment === 'pickup' ? 'border-terracotta bg-terracotta/10' : 'border-ink/15'}`}
              >
                Self drop-off (free)
              </button>
              <button
                type="button"
                onClick={() => setFulfillment('courier')}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold ${fulfillment === 'courier' ? 'border-terracotta bg-terracotta/10' : 'border-ink/15'}`}
              >
                Courier delivery
              </button>
            </div>

            {fulfillment === 'courier' && (
              <div className="space-y-4 rounded-xl bg-ink/5 p-4">
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value as 'peninsular' | 'east_malaysia')}
                  className="w-full rounded-xl border border-ink/15 px-4 py-3 bg-cream"
                >
                  <option value="peninsular">Peninsular Malaysia (+RM{COURIER_FEE.peninsular})</option>
                  <option value="east_malaysia">Sabah &amp; Sarawak (+RM{COURIER_FEE.east_malaysia})</option>
                </select>
                <input
                  required
                  placeholder="Address line"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  className="w-full rounded-xl border border-ink/15 px-4 py-3 outline-none focus:border-terracotta"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    required
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="rounded-xl border border-ink/15 px-4 py-3 outline-none focus:border-terracotta"
                  />
                  <input
                    required
                    placeholder="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="rounded-xl border border-ink/15 px-4 py-3 outline-none focus:border-terracotta"
                  />
                </div>
                <input
                  required
                  placeholder="Postcode"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  className="w-full rounded-xl border border-ink/15 px-4 py-3 outline-none focus:border-terracotta"
                />
              </div>
            )}

            <div className="flex items-center justify-between border-t border-ink/10 pt-4 text-lg font-semibold">
              <span>Total</span>
              <span className="text-terracotta">RM {total.toFixed(2)}</span>
            </div>

            {error && <p className="text-sm text-terracotta">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center rounded-full bg-terracotta text-cream px-7 py-3.5 font-semibold hover:bg-terracotta-dark transition-colors disabled:opacity-50"
            >
              {submitting ? 'Redirecting to payment…' : 'Continue to Payment'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Verify manually**

Run: `cd "moments-app" && npm run dev`, temporarily render `<OrderForm tier={{ name: 'Basic', price: 49.9 }} onClose={() => {}} />` at the top of `App.tsx`'s returned JSX, load the page in a browser.
Expected: modal renders, switching Pickup/Courier toggles the address fields and updates the total live. Remove the temporary render before moving on — Task 7 wires it in properly.

- [ ] **Step 3: Commit**

```bash
cd "moments-app" && git add src/components/OrderForm.tsx
git commit -m "Add OrderForm component"
```

---

### Task 7: Wire ordering into `PriceCalculator` and `App`

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/PriceCalculator.tsx`

**Interfaces:**
- Consumes: `OrderForm` from Task 6.
- Produces: `PriceCalculator` gains prop `onOrder: (tier: { name: string; price: number }) => void`, called instead of scrolling to `#contact` when a tier card or "Lock In This Quote" is clicked.

- [ ] **Step 1: Add order state and render `OrderForm` in `App.tsx`**

Modify `src/App.tsx`:

```tsx
import { useState } from 'react'
import Nav from './components/Nav'
import Hero from './components/Hero'
import NeverLost from './components/NeverLost'
import HowItWorks from './components/HowItWorks'
import UseCases from './components/UseCases'
import PriceCalculator from './components/PriceCalculator'
import Testimonials from './components/Testimonials'
import FAQ from './components/FAQ'
import VideoTeaser from './components/VideoTeaser'
import LeadForm from './components/LeadForm'
import Footer from './components/Footer'
import OrderForm from './components/OrderForm'

export default function App() {
  const [quotePrefill, setQuotePrefill] = useState('')
  const [orderTier, setOrderTier] = useState<{ name: string; price: number } | null>(null)

  return (
    <div className="min-h-screen">
      <Nav onOrderNow={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} />
      <main>
        <Hero onOrderNow={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} />
        <NeverLost />
        <HowItWorks />
        <UseCases />
        <PriceCalculator onSelectQuote={setQuotePrefill} onOrder={setOrderTier} />
        <Testimonials />
        <FAQ />
        <VideoTeaser />
        <LeadForm prefill={quotePrefill} />
      </main>
      <Footer />
      <OrderForm tier={orderTier} onClose={() => setOrderTier(null)} />
    </div>
  )
}
```

(`Nav`/`Hero` prop rename to `onOrderNow` happens in Task 9 — this task only adds `orderTier` state and the `PriceCalculator` wiring; leave `Nav`/`Hero` props as-is for now if Task 9 hasn't run yet, i.e. keep `onGetQuote` names until Task 9 renames them. If executing tasks in order, Task 9 comes after this one, so temporarily keep `onGetQuote={...}` here and revisit in Task 9.)

- [ ] **Step 2: Wire tier cards and the custom-estimate button to `onOrder`**

In `src/components/PriceCalculator.tsx`:
- Add `onOrder: (tier: { name: string; price: number }) => void` to `PriceCalculatorProps`.
- Replace the `<a href="#contact" onClick={() => onSelectQuote(...)}>Lock In This Quote</a>` block with a button calling `onOrder(suggestedTier)`:

```tsx
<button
  type="button"
  onClick={() => onOrder({ name: suggestedTier.name, price: suggestedTier.price })}
  className="mt-8 inline-flex items-center justify-center rounded-full bg-terracotta text-cream px-7 py-3.5 font-semibold hover:bg-terracotta-dark transition-colors w-full"
>
  Order This Package
</button>
```

- Replace the tier card `onClick` (currently `onSelectQuote(...)` + scroll to `#contact`) with:

```tsx
onClick={() => onOrder({ name: t.name, price: t.price })}
```

(Keep the `onKeyDown` Enter/Space handler as-is — it already calls `.click()`.)

- [ ] **Step 3: Verify manually**

Run: `cd "moments-app" && npm run dev`, open the pricing section, click a tier card.
Expected: `OrderForm` modal opens pre-loaded with that tier's name/price. Click "Order This Package" under the custom estimate slider — same modal opens with the slider's `suggestedTier`.

- [ ] **Step 4: Commit**

```bash
cd "moments-app" && git add src/App.tsx src/components/PriceCalculator.tsx
git commit -m "Wire pricing tiers and custom estimate into OrderForm"
```

---

### Task 8: `OrderSuccess` view

**Files:**
- Create: `src/components/OrderSuccess.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `GET /.netlify/functions/get-order` (Task 5).
- Produces: `OrderSuccess` component, no props, reads `session_id` from `window.location.search` itself. `App.tsx` renders it instead of the normal page when that param is present.

- [ ] **Step 1: Write the component**

Create `src/components/OrderSuccess.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

interface OrderSummary {
  tierName: string
  courierFee: number
  total: number
  currency: string
  fulfillment: 'pickup' | 'courier'
  status: 'pending' | 'paid' | 'failed'
  customerName: string
}

export default function OrderSuccess() {
  const [order, setOrder] = useState<OrderSummary | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get('session_id')
    if (!sessionId) {
      setError('No order found in this link.')
      return
    }
    fetch(`/.netlify/functions/get-order?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Order not found')
        setOrder(data.order)
      })
      .catch((err) => setError(err.message))
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-cream text-ink">
        <XCircle className="text-terracotta" size={48} />
        <p className="mt-4 text-lg font-semibold">We couldn't find that order.</p>
        <p className="mt-2 text-ink/60">
          Message us on{' '}
          <a href="https://wa.me/601164947110" className="text-terracotta underline">
            WhatsApp
          </a>{' '}
          and we'll sort it out.
        </p>
      </div>
    )
  }

  if (!order) {
    return <div className="min-h-screen flex items-center justify-center text-ink/50">Loading your order…</div>
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-cream text-ink">
      <CheckCircle2 className="text-terracotta" size={48} />
      <p className="mt-4 text-lg font-semibold">
        {order.status === 'paid' ? 'Payment received — thank you!' : 'Order received, finalising payment…'}
      </p>
      <p className="mt-2 text-ink/70">
        {order.tierName} package · Total RM {order.total.toFixed(2)}
      </p>
      <div className="mt-8 max-w-md rounded-2xl bg-ink/5 p-6 text-left text-sm text-ink/70">
        {order.fulfillment === 'pickup' ? (
          <p>
            Pack your photos or albums into any sturdy box and drop them off at our studio. We'll confirm the
            address by email/WhatsApp shortly.
          </p>
        ) : (
          <p>
            Pack your photos or albums into any sturdy box. Our courier partner will contact you at the number
            you provided to arrange pickup.
          </p>
        )}
      </div>
      <a href="/" className="mt-8 text-sm text-terracotta underline">
        Back to homepage
      </a>
    </div>
  )
}
```

- [ ] **Step 2: Render it conditionally from `App.tsx`**

Modify `src/App.tsx` — add the check above the main render:

```tsx
import OrderSuccess from './components/OrderSuccess'

export default function App() {
  const [quotePrefill, setQuotePrefill] = useState('')
  const [orderTier, setOrderTier] = useState<{ name: string; price: number } | null>(null)

  if (new URLSearchParams(window.location.search).has('session_id')) {
    return <OrderSuccess />
  }

  return (
    // ... existing JSX unchanged
  )
}
```

- [ ] **Step 3: Verify manually**

With a `session_id` from Task 3/4's testing, visit `http://localhost:5173/?session_id=<that id>` (or `netlify dev`'s port for the full functions-included flow).
Expected: page shows the order summary and matching pickup/courier instructions. Visit with a bogus `session_id` and confirm the "couldn't find that order" state renders.

- [ ] **Step 4: Commit**

```bash
cd "moments-app" && git add src/components/OrderSuccess.tsx src/App.tsx
git commit -m "Add OrderSuccess view"
```

---

### Task 9: CTA copy — Nav, Hero, LeadForm

**Files:**
- Modify: `src/components/Nav.tsx`
- Modify: `src/components/Hero.tsx`
- Modify: `src/components/LeadForm.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `Nav` and `Hero` props renamed `onGetQuote` → `onOrderNow`; button text "Get Free Quote" / "Get Your Free Quote" → "Order Now".

- [ ] **Step 1: Rename `Nav`'s prop and button text**

In `src/components/Nav.tsx`: rename `NavProps.onGetQuote` to `onOrderNow`, update both usages in the function body, and change both `Get Free Quote` button texts to `Order Now`. Change both `<a href="#contact" ...>` to `<a href="#pricing" ...>` (target the pricing section, not the lead form).

- [ ] **Step 2: Rename `Hero`'s prop and button text**

In `src/components/Hero.tsx`: rename `HeroProps.onGetQuote` to `onOrderNow`, update its usage, change `Get Your Free Quote` to `Order Now`, and change `href="#contact"` to `href="#pricing"`.

- [ ] **Step 3: Update `App.tsx` to match the renamed props**

In `src/App.tsx`, change:

```tsx
<Nav onOrderNow={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} />
```

and

```tsx
<Hero onOrderNow={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} />
```

(If Task 7 already left these as `onGetQuote` placeholders per its note, this is where that gets cleaned up — both props are now `onOrderNow` and both scroll to `#pricing` since the anchor tags already point there via `href`, so the `onClick` handler is now redundant but harmless; simplest is to drop the `onClick` entirely and just keep `href="#pricing"` — remove the `onOrderNow` prop and its usages from `Nav`/`Hero`/`App` entirely since smooth-scroll via anchor `href` already works without JS.)

- [ ] **Step 4: Reframe `LeadForm` as the secondary/questions path**

In `src/components/LeadForm.tsx`, change the heading from `Get Your Free Quote` to `Have Questions? Ask Us` and the submit button text from `Request My Free Quote` to `Send Message`.

- [ ] **Step 5: Verify manually**

Run: `cd "moments-app" && npm run dev`. Confirm Nav and Hero both show "Order Now" and scroll to the pricing section on click. Confirm the bottom contact section now reads "Have Questions? Ask Us".

- [ ] **Step 6: Commit**

```bash
cd "moments-app" && git add src/components/Nav.tsx src/components/Hero.tsx src/components/LeadForm.tsx src/App.tsx
git commit -m "Change primary CTA to Order Now, reframe contact form as secondary"
```

---

### Task 10: Deployment config — Netlify env vars

**Files:**
- Modify: `README.md`

**Interfaces:**
- None (documentation only).

- [ ] **Step 1: Document required Netlify env vars**

Add a section to `README.md` (near any existing deployment/env notes):

```markdown
## Checkout environment variables

Set these in Netlify's site settings (Site configuration → Environment variables), never commit real values:

- `SUPABASE_URL` — same value as `VITE_SUPABASE_URL`, no `VITE_` prefix (server-side, used by Netlify Functions)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (Project Settings → API), server-side only
- `STRIPE_SECRET_KEY` — from the Stripe Dashboard (use a `sk_test_...` key until go-live)
- `STRIPE_WEBHOOK_SECRET` — from the Stripe Dashboard webhook endpoint pointed at `https://<your-site>/.netlify/functions/stripe-webhook`
- `SITE_URL` — the deployed site's base URL (e.g. `https://moments.example.com`), used to build Stripe's success/cancel redirect URLs
```

- [ ] **Step 2: Commit**

```bash
cd "moments-app" && git add README.md
git commit -m "Document checkout environment variables"
```
