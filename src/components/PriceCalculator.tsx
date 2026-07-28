import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase, supabaseEnabled } from '../lib/supabase'

const PHOTO_RATE = 0.85 // RM per photo, scanning
const RESTORE_RATE = 0.65 // RM per photo, restoration add-on
const BASE_FEE = 15 // RM handling/shipping

// Fallback used until (or unless) `pricing_tiers` loads from Supabase — keeps
// the calculator working even if the table is empty or env vars aren't set.
const FALLBACK_TIERS = [
  {
    name: 'Basic',
    price: 49.9,
    photos: 20,
    img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&q=70',
  },
  {
    name: 'Medium',
    price: 159.9,
    photos: 250,
    img: 'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=500&q=70',
  },
  {
    name: 'Advance',
    price: 269.9,
    photos: 400,
    img: 'https://images.unsplash.com/photo-1519638831568-d9897f54ed69?w=500&q=70',
  },
]

interface PriceCalculatorProps {
  onOrder: (tier: { name: string; price: number; notes?: string }) => void
}

export default function PriceCalculator({ onOrder }: PriceCalculatorProps) {
  const [photos, setPhotos] = useState(150)
  const [restore, setRestore] = useState(true)
  const [TIERS, setTiers] = useState(FALLBACK_TIERS)

  useEffect(() => {
    if (!supabaseEnabled || !supabase) return

    supabase
      .from('pricing_tiers')
      .select('name, price, photos, image_url')
      .order('sort_order')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setTiers(data.map((t) => ({ name: t.name, price: t.price, photos: t.photos, img: t.image_url })))
        }
      })
  }, [])

  const estimate = useMemo(() => {
    const raw = BASE_FEE + photos * PHOTO_RATE + (restore ? photos * RESTORE_RATE : 0)
    return Math.round(raw * 100) / 100
  }, [photos, restore])

  const suggestedTier = useMemo(() => {
    return TIERS.find((t) => photos <= t.photos) ?? TIERS[TIERS.length - 1]
  }, [photos])

  return (
    <section id="pricing" className="relative overflow-hidden py-24 bg-teal-dark text-cream">
      <div className="pointer-events-none absolute -top-32 -left-20 h-96 w-96 rounded-full bg-terracotta/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-gold/25 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-cream/10 blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="max-w-xl">
          <h2 className="text-3xl md:text-4xl font-semibold">Get an Instant Estimate</h2>
          <p className="mt-3 text-cream/70">
            Drag the slider — see your price update live, in Ringgit, no surprises.
          </p>
        </div>

        <div className="mt-14 grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-10">
            <div>
              <div className="flex justify-between text-sm font-medium mb-3">
                <span>Photos to digitise</span>
                <span className="text-gold">{photos}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1000}
                step={10}
                value={photos}
                onChange={(e) => setPhotos(Number(e.target.value))}
                className="w-full accent-terracotta"
              />
            </div>

            <label className="flex items-center justify-between rounded-xl bg-cream/10 border border-cream/15 px-5 py-4 cursor-pointer backdrop-blur-md">
              <span>
                <span className="block font-medium">Add restoration &amp; enhancement</span>
                <span className="block text-sm text-cream/50">Colour correction, damage repair, AI touch-up</span>
              </span>
              <input
                type="checkbox"
                checked={restore}
                onChange={(e) => setRestore(e.target.checked)}
                className="h-5 w-5 accent-terracotta"
              />
            </label>

            <p className="text-xs text-cream/50">
              Estimate only — final pricing confirmed after we inspect your order.
              Closest package: <span className="text-gold font-semibold">{suggestedTier.name}</span>.
            </p>
          </div>

          <motion.div
            key={estimate}
            initial={{ scale: 0.96, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="rounded-3xl bg-cream text-ink p-10 text-center shadow-2xl"
          >
            <p className="text-sm font-semibold text-ink/50 uppercase tracking-wide">
              Estimated Price
            </p>
            <p className="mt-3 font-display text-5xl font-semibold text-terracotta">
              RM {estimate.toFixed(2)}
            </p>
            <p className="mt-2 text-sm text-ink/50">
              includes handling, high-res scanning &amp; 30-day cloud backup
            </p>
            <button
              type="button"
              onClick={() =>
                onOrder({
                  name: suggestedTier.name,
                  price: suggestedTier.price,
                  notes: `${photos} photos${restore ? ' with restoration' : ''} — customer's own estimate was RM${estimate.toFixed(2)}`,
                })
              }
              className="mt-8 inline-flex items-center justify-center rounded-full bg-terracotta text-cream px-7 py-3.5 font-semibold hover:bg-terracotta-dark transition-colors w-full"
            >
              Order {suggestedTier.name} — RM{suggestedTier.price.toFixed(2)}
            </button>
          </motion.div>
        </div>

        <div className="mt-16 grid sm:grid-cols-3 gap-6">
          {TIERS.map((t, i) => {
            const isSuggested = t.name === suggestedTier.name
            return (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                role="button"
                tabIndex={0}
                onClick={() => onOrder({ name: t.name, price: t.price })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click()
                }}
                className={`group relative overflow-hidden rounded-3xl border p-px transition-all cursor-pointer ${
                  isSuggested
                    ? 'border-gold/60 bg-gradient-to-b from-gold/40 via-cream/10 to-transparent'
                    : 'border-cream/15 bg-gradient-to-b from-cream/15 via-cream/5 to-transparent'
                }`}
              >
                <div className="relative h-full rounded-[calc(1.5rem-1px)] bg-cream/10 backdrop-blur-xl overflow-hidden">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={t.img}
                      alt={`${t.name} package sample photos`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-teal-dark/70 via-transparent to-transparent" />
                    {isSuggested && (
                      <span className="absolute top-3 right-3 rounded-full bg-gold/90 px-3 py-1 text-xs font-semibold text-ink backdrop-blur">
                        Best Match
                      </span>
                    )}
                  </div>

                  <div className="p-6">
                    <p className="font-semibold text-gold">{t.name}</p>
                    <p className="mt-1 font-display text-2xl font-semibold text-cream">
                      RM{t.price.toFixed(2)}
                    </p>
                    <p className="mt-1 text-sm text-cream/60">Up to {t.photos} photos</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
