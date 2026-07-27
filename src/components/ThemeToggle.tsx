import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { getTheme, setTheme } from '../lib/theme'

export default function ThemeToggle() {
  const [theme, setLocalTheme] = useState(getTheme)

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setLocalTheme(next)
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="flex h-10 w-10 items-center justify-center rounded-full text-ink/70 hover:text-ink dark:text-cream/70 dark:hover:text-cream transition-colors"
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}
