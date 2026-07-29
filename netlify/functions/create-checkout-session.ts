import type { Handler } from '@netlify/functions'
import { getStripe, getSupabaseAdmin, COURIER_FEE, computeCustomEstimate } from './_lib'

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

  const { tierName, custom, fulfillment, region, customer, shippingAddress, notes } = body

  const isCustom = custom != null
  if (isCustom) {
    if (typeof custom.photos !== 'number' || !Number.isFinite(custom.photos) || custom.photos <= 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid photo count' }) }
    }
    if (typeof custom.restore !== 'boolean') {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid restoration flag' }) }
    }
  } else if (typeof tierName !== 'string' || tierName.trim() === '') {
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
  if (fulfillment === 'courier') {
    const nonEmpty = (v: unknown) => typeof v === 'string' && v.trim() !== ''
    if (
      !shippingAddress ||
      !nonEmpty(shippingAddress.line1) ||
      !nonEmpty(shippingAddress.city) ||
      !nonEmpty(shippingAddress.state) ||
      !nonEmpty(shippingAddress.postcode)
    ) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing shipping address' }) }
    }
    if (!nonEmpty(customer.phone)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Phone number required for courier delivery' }) }
    }
  }

  // Price is always computed/looked up server-side — never trust a client-sent amount.
  let tierPrice: number
  let orderTierName: string
  let productName: string
  if (isCustom) {
    tierPrice = await computeCustomEstimate(custom.photos, custom.restore)
    orderTierName = 'Custom Estimate'
    productName = `Custom digitisation — ${custom.photos} photos${custom.restore ? ' + restoration' : ''}`
  } else {
    const { data: tier, error: tierError } = await getSupabaseAdmin()
      .from('pricing_tiers')
      .select('name, price')
      .eq('name', tierName)
      .single()

    if (tierError || !tier) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Unknown package tier' }) }
    }

    tierPrice = Number(tier.price)
    orderTierName = tierName
    productName = `${tierName} package`
  }

  // Courier fee is always computed server-side — never trust a client-sent amount.
  const courierFee = fulfillment === 'courier' ? COURIER_FEE[region as 'peninsular' | 'east_malaysia'] : 0
  const total = tierPrice + courierFee

  const lineItems = [
    {
      price_data: {
        currency: 'myr',
        product_data: { name: productName },
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

  let session
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'fpx'],
      line_items: lineItems,
      customer_email: customer.email,
      success_url: `${siteUrl}/?session_id={CHECKOUT_SESSION_ID}#order-success`,
      cancel_url: `${siteUrl}/#pricing`,
    })
  } catch (err) {
    console.error('Stripe checkout session creation failed:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to create checkout session' }) }
  }

  const customNotes = isCustom
    ? `Custom estimate: ${custom.photos} photos${custom.restore ? ' with restoration' : ''}`
    : null

  const { error: dbError } = await getSupabaseAdmin().from('orders').insert({
    tier_name: orderTierName,
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
    notes: customNotes ?? (typeof notes === 'string' && notes.trim() !== '' ? notes : null),
  })

  if (dbError) {
    return { statusCode: 500, body: JSON.stringify({ error: dbError.message }) }
  }

  return { statusCode: 200, body: JSON.stringify({ url: session.url }) }
}
