import { motion } from 'framer-motion'
import { ShieldCheck, Lock, Timer, Fingerprint } from 'lucide-react'

const points = [
  {
    icon: Fingerprint,
    title: 'Handled individually',
    body: 'Every photo, negative and album is barcoded and tracked from the moment it arrives, so nothing gets mixed up or lost.',
  },
  {
    icon: ShieldCheck,
    title: 'Never shared',
    body: 'Your photographs are private. We never publish or share them without your permission.',
  },
  {
    icon: Timer,
    title: 'Files kept 30 days, then deleted',
    body: 'Your digital files stay on Moments Cloud for 30 days for free re-downloads, then are removed from our servers.',
  },
  {
    icon: Lock,
    title: 'No third-party AI uploads',
    body: 'Restoration is done by our own team in Kuala Lumpur. Your photos are never sent to third-party AI services.',
  },
]

export default function TrustSection() {
  return (
    <section className="py-24 bg-paper dark:bg-midnight">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-xl">
          <h2 className="text-3xl md:text-4xl font-semibold text-ink dark:text-cream">
            You're trusting us with the irreplaceable
          </h2>
          <p className="mt-3 text-ink/70 dark:text-cream/70">
            Here's exactly how we handle your originals and your files.
          </p>
        </div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {points.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal text-cream">
                <p.icon size={26} />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-ink dark:text-cream">{p.title}</h3>
              <p className="mt-2 text-sm text-ink/60 dark:text-cream/60 leading-relaxed">{p.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
