import { motion } from 'framer-motion'

const cases = [
  {
    title: 'Preserve & Relive',
    body: 'Perfect for anyone who wants to preserve and relive their family memories in stunning quality.',
    img: 'https://images.unsplash.com/photo-1476234251651-f353703a034d?w=700&q=70',
  },
  {
    title: 'Restore & Enhance',
    body: 'Restore old black-and-white portraits, adding warmth and colour back into your photo albums.',
    img: 'https://images.unsplash.com/photo-1495954380655-01e28a790aa7?w=700&q=70',
  },
  {
    title: 'Archive & Protect',
    body: 'Businesses and museums can restore vintage photography and archival footage to professional standard.',
    img: 'https://images.unsplash.com/photo-1502085671122-2d218cd434e6?w=700&q=70',
  },
]

export default function UseCases() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-semibold text-ink dark:text-cream text-center">
          Bring Your Past to Life
        </h2>
        <p className="mt-3 text-ink/70 dark:text-cream/70 text-center max-w-xl mx-auto">
          Whichever way you keep your memories, we'll bring them back to their best.
        </p>

        <div className="mt-14 grid md:grid-cols-3 gap-8">
          {cases.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group overflow-hidden rounded-2xl bg-paper dark:bg-midnight"
            >
              <div className="aspect-4/3 overflow-hidden">
                <img
                  src={c.img}
                  alt={c.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-ink dark:text-cream">{c.title}</h3>
                <p className="mt-2 text-sm text-ink/60 dark:text-cream/60 leading-relaxed">{c.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
