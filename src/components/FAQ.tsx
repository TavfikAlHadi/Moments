import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'

const faqs = [
  {
    q: 'Will my photos be safe?',
    a: 'Yes. Every item is barcoded and tracked from the moment it arrives, scanned by trained technicians, and returned to you along with your digital files. Physical originals are never discarded without your confirmation.',
  },
  {
    q: 'What formats can you digitise?',
    a: 'Photos and photo albums, negatives, and slides.',
  },
  {
    q: 'How long does it take?',
    a: 'Around 3 weeks from the time we receive your box and you approve your order, to the time your files are ready online.',
  },
  {
    q: 'How do I receive my digital files?',
    a: 'Through a secure download link, plus 30 days of free storage on Moments Cloud so you can stream from any device.',
  },
  {
    q: 'What if I have more than 400 photos?',
    a: 'Contact us for a custom quote — we handle larger collections and business/archival projects too.',
  },
  {
    q: 'Is there a guarantee if something arrives damaged?',
    a: "Yes — contact our support team within 7 days of delivery and we'll make it right.",
  },
  {
    q: 'Do you digitise VHS tapes or home videos?',
    a: "Not yet — we're photo-only for now while we source professional tape-transfer equipment. Join the waitlist further down this page and we'll notify you the moment video digitisation launches.",
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="py-24">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-semibold text-ink dark:text-cream text-center">
          Frequently Asked Questions
        </h2>

        <div className="mt-12 divide-y divide-ink/10 border-y border-ink/10 dark:divide-cream/10 dark:border-cream/10">
          {faqs.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={item.q}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="font-semibold text-ink dark:text-cream">{item.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 text-terracotta"
                  >
                    <Plus size={20} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 text-ink/60 dark:text-cream/60 leading-relaxed">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
