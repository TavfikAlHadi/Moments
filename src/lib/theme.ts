export type ThemePref = 'system' | 'light' | 'dark'

const media = matchMedia('(prefers-color-scheme: dark)')

function apply(pref: ThemePref) {
  const dark = pref === 'system' ? media.matches : pref === 'dark'
  document.documentElement.classList.toggle('dark', dark)
}

export function getThemePref(): ThemePref {
  const stored = localStorage.getItem('theme')
  return stored === 'light' || stored === 'dark' ? stored : 'system'
}

export function setThemePref(pref: ThemePref) {
  if (pref === 'system') localStorage.removeItem('theme')
  else localStorage.setItem('theme', pref)
  apply(pref)
}

// Track OS changes live while the user is on "system".
media.addEventListener('change', () => {
  if (getThemePref() === 'system') apply('system')
})
