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
