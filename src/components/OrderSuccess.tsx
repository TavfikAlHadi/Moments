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
