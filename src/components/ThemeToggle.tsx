import { useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { getThemePref, setThemePref, type ThemePref } from '../lib/theme'

const NEXT: Record<ThemePref, ThemePref> = { system: 'light', light: 'dark', dark: 'system' }
const ICON = { system: Monitor, light: Sun, dark: Moon }
const LABEL = { system: 'System theme', light: 'Light theme', dark: 'Dark theme' }

export default function ThemeToggle() {
  const [pref, setPref] = useState(getThemePref)
  const Icon = ICON[pref]

  function cycle() {
    const next = NEXT[pref]
    setThemePref(next)
    setPref(next)
  }

  return (
    <button
      onClick={cycle}
      aria-label={`${LABEL[pref]} — click to change`}
      title={LABEL[pref]}
      className="flex h-10 w-10 items-center justify-center rounded-full text-ink/70 hover:text-ink dark:text-cream/70 dark:hover:text-cream transition-colors"
    >
      <Icon size={20} />
    </button>
  )
}
