import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { supabase, supabaseEnabled } from '../lib/supabase'

type Status = 'idle' | 'submitting' | 'success' | 'error'

const WHATSAPP_NUMBER = '601164947110' // 011-64947110, Malaysia country code

function encodeFormData(data: Record<string, string>) {
  return Object.entries(data)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
}

interface LeadFormProps {
  prefill: string
}

export default function LeadForm({ prefill }: LeadFormProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setError('')

    const form = new FormData(e.currentTarget)
    const lead = {
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      phone: String(form.get('phone') ?? ''),
      message: String(form.get('message') ?? ''),
    }

    if (supabaseEnabled && supabase) {
      const { error: dbError } = await supabase.from('leads').insert(lead)
      if (dbError) {
        setStatus('error')
        setError(dbError.message)
        return
      }
    }

    const summary = [
      `New quote request from ${lead.name}`,
      `Email: ${lead.email}`,
      lead.phone && `Phone: ${lead.phone}`,
      lead.message && `Details: ${lead.message}`,
    ]
      .filter(Boolean)
      .join('\n')

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(summary)}`, '_blank')

    // Fire-and-forget: Netlify Forms submission gives the team an email copy.
    // Never blocks the WhatsApp handoff above, which is the primary path.
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encodeFormData({ 'form-name': 'quote-request', ...lead }),
    }).catch(() => {})

    setStatus('success')
  }

  return (
    <section id="contact" className="py-24 bg-ink text-cream">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-semibold">Have Questions? Ask Us</h2>
          <p className="mt-3 text-cream/60">
            Tell us a little about your collection and we'll get back to you within one business day.
          </p>
        </div>

        {status === 'success' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 flex flex-col items-center gap-3 rounded-2xl bg-cream/5 p-10 text-center"
          >
            <CheckCircle2 className="text-terracotta" size={40} />
            <p className="text-lg font-semibold">Thanks — we've got your request.</p>
            <p className="text-cream/60 text-sm">A member of the team will reach out shortly.</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 grid sm:grid-cols-2 gap-5">
            <input
              name="name"
              required
              placeholder="Full name"
              className="rounded-xl bg-cream/10 border border-cream/15 px-4 py-3 placeholder:text-cream/40 outline-none focus:border-terracotta transition-colors sm:col-span-1"
            />
            <input
              name="phone"
              placeholder="Phone number"
              className="rounded-xl bg-cream/10 border border-cream/15 px-4 py-3 placeholder:text-cream/40 outline-none focus:border-terracotta transition-colors sm:col-span-1"
            />
            <input
              name="email"
              type="email"
              required
              placeholder="Email address"
              className="rounded-xl bg-cream/10 border border-cream/15 px-4 py-3 placeholder:text-cream/40 outline-none focus:border-terracotta transition-colors sm:col-span-2"
            />
            <textarea
              key={prefill}
              name="message"
              rows={4}
              defaultValue={prefill}
              placeholder="What would you like digitised? (e.g. 200 photos, 2 albums)"
              className="rounded-xl bg-cream/10 border border-cream/15 px-4 py-3 placeholder:text-cream/40 outline-none focus:border-terracotta transition-colors sm:col-span-2 resize-none"
            />

            {status === 'error' && (
              <p className="sm:col-span-2 text-sm text-terracotta">{error}</p>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="sm:col-span-2 inline-flex items-center justify-center rounded-full bg-terracotta text-cream px-7 py-3.5 font-semibold hover:bg-terracotta-dark transition-colors disabled:opacity-50"
            >
              {status === 'submitting' ? 'Sending…' : 'Send WhatsApp'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
