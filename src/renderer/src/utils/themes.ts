export type ThemeId = 'light' | 'dark' | 'system' | 'nord' | 'dracula' | 'solarized' | 'github' | 'custom'

export interface CustomTheme {
  name: string
  bg: string
  text: string
  border: string
  accent: string
  codeBg: string
}

export const THEMES: { id: ThemeId; label: string }[] = [
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Oscuro' },
  { id: 'system', label: 'Sistema' },
  { id: 'nord', label: 'Nord' },
  { id: 'dracula', label: 'Dracula' },
  { id: 'solarized', label: 'Solarized' },
  { id: 'github', label: 'GitHub' }
]

export function loadTheme(): ThemeId {
  const saved = localStorage.getItem('marknote-theme')
  if (saved && (THEMES.some(t => t.id === saved) || saved === 'custom')) return saved as ThemeId
  return 'light'
}

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function resolveTheme(theme: ThemeId): 'light' | 'dark' | 'nord' | 'dracula' | 'solarized' | 'github' | 'custom' {
  if (theme === 'system') return getSystemTheme()
  return theme
}

export function saveTheme(theme: ThemeId): void {
  localStorage.setItem('marknote-theme', theme)
  // Restore custom theme CSS if applicable
  if (theme === 'custom') {
    const saved = localStorage.getItem('marknote-custom-theme')
    if (saved) {
      const ct = JSON.parse(saved) as CustomTheme
      const root = document.documentElement
      root.style.setProperty('--bg', ct.bg)
      root.style.setProperty('--text', ct.text)
      root.style.setProperty('--border', ct.border)
      root.style.setProperty('--accent', ct.accent)
      root.style.setProperty('--code-bg', ct.codeBg)
      root.style.setProperty('--hover', `color-mix(in srgb, ${ct.bg}, ${ct.text} 8%)`)
      root.style.setProperty('--sidebar-bg', ct.bg)
      root.style.setProperty('--toolbar-bg', ct.bg)
      root.style.setProperty('--titlebar-bg', ct.bg)
    }
  }
}
