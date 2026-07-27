import { useState } from 'react'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const links = [
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contact', label: 'Contact' },
]

interface NavProps {
  onGetQuote: () => void
}

export default function Nav({ onGetQuote }: NavProps) {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-cream/80 border-b border-ink/10 dark:bg-ink/80 dark:border-cream/10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center">
          <img src="/moments-logo.svg" alt="Moments" className="h-[38px] w-auto" />
        </a>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-ink/70 dark:text-cream/70">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-terracotta transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <a
            href="#contact"
            onClick={onGetQuote}
            className="hidden md:inline-flex items-center rounded-full bg-terracotta text-cream px-5 py-2.5 text-sm font-semibold hover:bg-terracotta-dark transition-colors"
          >
            Get Free Quote
          </a>

          <button
            className="md:hidden text-ink dark:text-cream"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <motion.nav
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="md:hidden flex flex-col gap-1 px-6 pb-4 bg-cream border-b border-ink/10 dark:bg-ink dark:border-cream/10"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-2 text-ink/80 dark:text-cream/80 font-medium"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#contact"
            onClick={() => {
              setOpen(false)
              onGetQuote()
            }}
            className="mt-2 inline-flex items-center justify-center rounded-full bg-terracotta text-cream px-5 py-2.5 text-sm font-semibold"
          >
            Get Free Quote
          </a>
        </motion.nav>
      )}
    </header>
  )
}
