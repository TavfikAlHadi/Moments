import { motion } from 'framer-motion'

export default function NeverLost() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-semibold leading-tight text-ink dark:text-cream">
            The pictures time stole – we make whole.
            <br />
            Moments restored, memories adored.
          </h2>

          <p className="mt-6 text-ink/70 dark:text-cream/70 leading-relaxed">
            Every day, birthdays, weddings, and vacations captured in printed photos
            are lost to fire, flood, disaster, and decay.
          </p>
          <p className="mt-4 text-ink/70 dark:text-cream/70 leading-relaxed">
            Don't wait until it's too late – digitise and preserve with MOMENTS and
            be certain your cherished memories are safe for your lifetime &amp;
            generations beyond.
          </p>

          <a
            href="#contact"
            className="mt-8 inline-flex items-center rounded-full bg-terracotta text-cream px-7 py-3.5 font-semibold hover:bg-terracotta-dark transition-colors"
          >
            Protect Your Memories
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="aspect-4/3 overflow-hidden rounded-3xl shadow-xl"
        >
          <img
            src="https://images.unsplash.com/photo-1591123120675-6f7f1aae0e5b?w=900&q=75"
            alt="Holding a restored family photo"
            className="h-full w-full object-cover"
          />
        </motion.div>
      </div>
    </section>
  )
}
