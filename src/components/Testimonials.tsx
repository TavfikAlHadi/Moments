import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'

const reviews = [
  {
    name: 'Siti Rahman',
    location: 'Petaling Jaya',
    quote:
      "I found a box of my late father's photos and thought the memories were fading for good. Moments brought them back to life — I cried seeing his face in colour again.",
  },
  {
    name: 'Wei Jian Tan',
    location: 'Subang Jaya',
    quote:
      'Sent in three albums of my grandparents\' wedding photos. The colour restoration was stunning — better than I imagined possible.',
  },
  {
    name: 'Priya Nair',
    location: 'Kuala Lumpur',
    quote:
      'Fast, transparent pricing, and the cloud storage means I can finally share these with my siblings overseas. Worth every ringgit.',
  },
]

export default function Testimonials() {
  const [index, setIndex] = useState(0)

  const next = () => setIndex((i) => (i + 1) % reviews.length)
  const prev = () => setIndex((i) => (i - 1 + reviews.length) % reviews.length)

  return (
    <section className="py-24 bg-paper dark:bg-midnight">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-semibold text-ink dark:text-cream">Loved by Families Across Malaysia</h2>

        <div className="mt-12 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35 }}
            >
              <div className="flex justify-center gap-1 text-gold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={18} fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <p className="mt-6 text-xl md:text-2xl font-display text-ink dark:text-cream leading-snug">
                "{reviews[index].quote}"
              </p>
              <p className="mt-6 font-semibold text-ink dark:text-cream">{reviews[index].name}</p>
              <p className="text-sm text-ink/50 dark:text-cream/50">{reviews[index].location}</p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              onClick={prev}
              aria-label="Previous review"
              className="h-10 w-10 flex items-center justify-center rounded-full border border-ink/15 hover:border-ink/30 dark:border-cream/15 dark:hover:border-cream/30 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-2">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to review ${i + 1}`}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    i === index ? 'bg-terracotta' : 'bg-ink/20 dark:bg-cream/20'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={next}
              aria-label="Next review"
              className="h-10 w-10 flex items-center justify-center rounded-full border border-ink/15 hover:border-ink/30 dark:border-cream/15 dark:hover:border-cream/30 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
