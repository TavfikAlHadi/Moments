import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clapperboard, CheckCircle2 } from 'lucide-react'
import { supabase, supabaseEnabled } from '../lib/supabase'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function VideoTeaser() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setError('')

    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') ?? '')

    if (!supabaseEnabled || !supabase) {
      setStatus('error')
      setError('Waitlist storage isn\'t configured yet.')
      return
    }

    const { error: dbError } = await supabase.from('leads').insert({
      name: 'Video waitlist',
      email,
      message: 'Signed up for VHS/video digitisation waitlist',
    })

    if (dbError) {
      setStatus('error')
      setError(dbError.message)
      return
    }

    setStatus('success')
  }

  return (
    <section className="py-20 bg-paper dark:bg-midnight">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-dashed border-teal/30 bg-cream dark:bg-ink p-10 text-center"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal text-cream">
            <Clapperboard size={26} />
          </div>
          <span className="mt-5 inline-flex items-center rounded-full bg-gold/15 text-terracotta-dark px-4 py-1.5 text-sm font-semibold">
            Coming Soon
          </span>
          <h2 className="mt-4 text-2xl md:text-3xl font-semibold text-ink dark:text-cream">
            VHS &amp; Home Video Digitisation
          </h2>
          <p className="mt-3 text-ink/60 dark:text-cream/60 max-w-md mx-auto">
            We're setting up professional tape-transfer equipment to bring your VHS,
            MiniDV, and home videos back to life. Leave your email and we'll notify
            you the moment it launches — first on the list gets a launch discount.
          </p>

          {status === 'success' ? (
            <p className="mt-6 flex items-center justify-center gap-2 font-semibold text-teal">
              <CheckCircle2 size={20} /> You're on the list — we'll be in touch.
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                name="email"
                type="email"
                required
                placeholder="you@email.com"
                className="flex-1 rounded-full border border-ink/15 dark:border-cream/15 dark:text-cream px-5 py-3 outline-none focus:border-terracotta transition-colors"
              />
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="rounded-full bg-teal text-cream px-6 py-3 font-semibold hover:bg-teal-dark transition-colors disabled:opacity-50"
              >
                {status === 'submitting' ? 'Joining…' : 'Notify Me'}
              </button>
            </form>
          )}
          {status === 'error' && (
            <p className="mt-3 text-sm text-terracotta">{error}</p>
          )}
        </motion.div>
      </div>
    </section>
  )
}
