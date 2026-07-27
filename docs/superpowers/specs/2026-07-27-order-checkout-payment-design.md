# Order, Checkout & Payment — Design

## Problem

Site currently only generates leads (WhatsApp/email handoff via `LeadForm`). Nav ("Get Free Quote") and Hero ("Get Your Free Quote") CTAs point there, duplicating the "Get an Instant Estimate" pricing section. We want customers to actually **order and pay online**, not just request a quote.

## Decisions

- **Order shape:** one package per order (Basic/Medium/Advance tier), no multi-item cart.
- **Payment timing:** customer pays the fixed tier price upfront at checkout. If their actual photo count exceeds the tier after physical inspection, staff follow up separately for the difference (existing "estimate only" disclaimer stays).
- **Gateway:** Stripe Checkout (hosted redirect page). Supports card + FPX for Malaysia, handles PCI scope, built-in shipping address collection.
- **Accounts:** guest checkout only. No login/auth. Confirmation via on-page success message + order number; existing WhatsApp/email channel used for any follow-up.
- **Fulfillment:** customer chooses Pickup (self-drop-off, free) or Courier Delivery (flat fee, two tiers: Peninsular Malaysia vs Sabah & Sarawak).

## Architecture

- **Frontend (React, existing Vite app):** new `OrderForm` component, new `/order-success` route/view.
- **Backend:** two Netlify Functions (site already deploys to Netlify).
  - `create-checkout-session` — receives tier + fulfillment details, creates Stripe Checkout Session, writes a `pending` row to Supabase `orders`, returns the Stripe redirect URL.
  - `stripe-webhook` — verifies Stripe signature, flips matching `orders` row to `paid` on `checkout.session.completed`.
  - `get-order` — given a `session_id`, returns that order's summary for the success page.
- **Database (Supabase):** new `orders` table, service-role only (no anon read/write — functions use the service role key server-side).
- **Secrets:** Stripe secret key + webhook signing secret live as Netlify environment variables, never shipped to the client. Only the Stripe *publishable* key (if needed) and Supabase anon key stay client-side, as today.

## Data flow

1. Customer clicks "Order [Tier]" on a pricing card, or "Order This Package" from the custom estimate (mapped to `suggestedTier`).
2. `OrderForm` opens (modal or dedicated section): name, email, phone, fulfillment method (Pickup / Courier), and if Courier — region (Peninsular / Sabah & Sarawak) + address fields (line, city, state, postcode). Live total = tier price + courier fee (if any).
3. Submit → POST to `create-checkout-session` with `{ tier, price, fulfillment, region, courierFee, customer }`.
4. Function creates a Stripe Checkout Session with line items `[package, courier fee?]`, inserts a `pending` `orders` row (including all form fields), returns `session.url`.
5. Browser redirects to Stripe's hosted checkout page.
6. Customer pays (card or FPX).
7. Stripe fires `checkout.session.completed` → `stripe-webhook` verifies signature, updates the matching `orders` row to `paid`, stores `stripe_payment_intent_id`.
8. Stripe redirects browser to `/order-success?session_id=...` — page shows order number, package, total paid, and pack-and-ship instructions (reusing `HowItWorks` copy for the Pickup/Courier case).

## Components

- **`Nav.tsx` / `Hero.tsx`:** CTA text changes from "Get Free Quote" / "Get Your Free Quote" → **"Order Now"**, `onClick` scrolls to `#pricing` instead of `#contact`.
- **`PriceCalculator.tsx`:** tier cards' `onClick` and the custom-estimate "Lock In This Quote" button open `OrderForm` (pre-filled with the selected/suggested tier) instead of scrolling to `LeadForm`.
- **`OrderForm.tsx` (new):** the form described above. Owns fulfillment/region/address state and the live total calculation. On submit, calls the Netlify function and redirects on success.
- **`OrderSuccess.tsx` (new):** rendered when the URL has `?session_id=`. Calls a third Netlify Function, `get-order`, which reads the matching `orders` row via the service-role key (table has no anon access) and returns the order summary. Displays confirmation + instructions.
- **`LeadForm.tsx`:** stays, but reframed as the secondary path for questions/custom needs (e.g. heading/CTA copy changes to "Have Questions? Ask Us" or similar) rather than the primary conversion CTA.

## Data model

```sql
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
-- No anon policies: only the service-role key (used inside Netlify Functions) touches this table.
```

## Courier fee constants

Hardcoded, same pattern as `BASE_FEE`/`PHOTO_RATE` in `PriceCalculator.tsx`:

```ts
const COURIER_FEE_PENINSULAR = 15 // RM
const COURIER_FEE_EAST_MALAYSIA = 25 // RM
```

No admin UI to edit these — change requires a code edit, matching how `BASE_FEE` etc. already work.

## Error handling

- `create-checkout-session` fails (network/Stripe error) → `OrderForm` shows inline error, stays on page, no partial state.
- Webhook signature invalid → function returns 400, logs, no DB write.
- Customer abandons Stripe checkout → `orders` row stays `pending` indefinitely. No cleanup job for now (YAGNI — add a cron sweep later only if stale `pending` rows become an operational problem).
- `/order-success` with an unknown/missing `session_id` → show a generic "we couldn't find that order, contact us" message with the existing WhatsApp link.

## Testing

Manual, no automated suite for this (matches the rest of the site, which has no tests):
- Stripe test mode + test card + test FPX flow, both Pickup and Courier (each region) paths.
- Confirm webhook flips the Supabase row to `paid`.
- Confirm `/order-success` renders correctly and handles a bad/missing session id.

## Out of scope (explicitly not building)

- Multi-item cart.
- Customer accounts/login/order history pages.
- Live courier API rates (using flat fees instead).
- Admin UI for editing pricing/courier fees (edit code, as today).
- Automated cleanup of abandoned `pending` orders.
