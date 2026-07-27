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
          tierName: tier!.name,
          tierPrice: tier!.price,
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
