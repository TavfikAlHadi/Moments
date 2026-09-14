import { motion } from 'framer-motion'
import BeforeAfterSlider from './BeforeAfterSlider'

export default function Hero() {
  return (
    <section id="top" className="grain relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-gold/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-teal/10 blur-3xl" />

      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <span className="inline-flex items-center rounded-full bg-terracotta/10 text-terracotta px-4 py-1.5 text-sm font-semibold">
            Moments — Photo Restoration &amp; Digitisation
          </span>
          <h1 className="mt-6 text-4xl md:text-6xl font-semibold leading-[1.05] tracking-tight text-ink dark:text-cream">
            Your memories,<br />made to last.
          </h1>
          <p className="mt-6 text-lg text-ink/70 dark:text-cream/70 max-w-md">
            Faded photos. Torn albums. Boxes you haven't opened in years.
            We restore and digitise them so they outlive the shoebox — and you.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#pricing"
              className="inline-flex items-center rounded-full bg-terracotta text-cream px-7 py-3.5 font-semibold hover:bg-terracotta-dark transition-colors"
            >
              Order Now
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center rounded-full border border-ink/20 px-7 py-3.5 font-semibold text-ink hover:border-ink/40 dark:border-cream/20 dark:text-cream dark:hover:border-cream/40 transition-colors"
            >
              See How It Works
            </a>
          </div>
          <p className="mt-6 text-sm text-ink/50 dark:text-cream/50">
            Kuala Lumpur, Malaysia · 3-week turnaround · Free 30-day cloud storage
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
        >
          <BeforeAfterSlider
            beforeSrc="https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=900&q=60&sat=-100&sepia=60"
            afterSrc="https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=900&q=80"
            beforeLabel="Before"
            afterLabel="After"
          />
          <p className="mt-3 text-center text-sm text-ink/50 dark:text-cream/50">
            Drag to see the restoration →
          </p>
        </motion.div>
      </div>
    </section>
  )
}
