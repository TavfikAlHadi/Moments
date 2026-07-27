import { motion } from 'framer-motion'
import { PackageOpen, ScanLine, Wand2, CloudUpload } from 'lucide-react'

const steps = [
  {
    icon: PackageOpen,
    title: 'Place Your Order',
    body: 'Choose a package online and pack your photos or albums into any sturdy box — no special kit required.',
  },
  {
    icon: ScanLine,
    title: 'Professional Scanning',
    body: 'Trained technicians scan every item using high-resolution, professional-grade equipment.',
  },
  {
    icon: Wand2,
    title: 'Restoration & Enhancement',
    body: 'We perform manual colour correction, damage repair, and AI-assisted enhancement on request.',
  },
  {
    icon: CloudUpload,
    title: 'Digital Delivery',
    body: 'Files arrive via a secure download link, backed up to Moments Cloud for 30 days, free.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-paper dark:bg-midnight">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-xl">
          <h2 className="text-3xl md:text-4xl font-semibold text-ink dark:text-cream">How It Works</h2>
          <p className="mt-3 text-ink/70 dark:text-cream/70">
            The most important thing you can do for your family — in four easy steps.
          </p>
        </div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal text-cream">
                <step.icon size={26} />
              </div>
              <span className="absolute top-0 right-0 font-display text-4xl text-ink/10 dark:text-cream/10 font-semibold">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-5 text-lg font-semibold text-ink dark:text-cream">{step.title}</h3>
              <p className="mt-2 text-sm text-ink/60 dark:text-cream/60 leading-relaxed">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
