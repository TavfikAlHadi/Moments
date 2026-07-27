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
