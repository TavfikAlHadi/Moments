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

  if (
    stripeEvent.type === 'checkout.session.completed' ||
    stripeEvent.type === 'checkout.session.expired' ||
    stripeEvent.type === 'checkout.session.async_payment_failed' ||
    stripeEvent.type === 'checkout.session.async_payment_succeeded'
  ) {
    const session = stripeEvent.data.object as {
      id: string
      payment_intent: string | null
      payment_status?: string
    }

    const paid =
      stripeEvent.type === 'checkout.session.async_payment_succeeded' ||
      (stripeEvent.type === 'checkout.session.completed' && session.payment_status === 'paid')
    const update =
      stripeEvent.type === 'checkout.session.completed' || stripeEvent.type === 'checkout.session.async_payment_succeeded'
        ? { status: paid ? 'paid' : 'pending', stripe_payment_intent_id: session.payment_intent }
        : { status: 'failed' }

    const { data, error } = await getSupabaseAdmin()
      .from('orders')
      .update(update)
      .eq('stripe_session_id', session.id)
      .select('id')

    if (error) {
      console.error(`Failed to update order for session ${session.id}:`, error.message)
      return { statusCode: 500, body: error.message }
    }
    if (!data || data.length === 0) {
      console.error(`No order found for stripe session ${session.id} (${stripeEvent.type})`)
      return { statusCode: 500, body: 'No matching order' }
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) }
}
