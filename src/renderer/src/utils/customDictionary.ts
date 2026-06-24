const STORAGE_KEY = 'marknote-custom-dictionary'

export function getCustomWords(): string[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const words = JSON.parse(raw)
    return Array.isArray(words) ? words.filter(w => typeof w === 'string') : []
  } catch {
    return []
  }
}

export function addCustomWord(word: string): string[] {
  const words = getCustomWords()
  const trimmed = word.trim()
  if (!trimmed || words.includes(trimmed)) return words
  const updated = [...words, trimmed]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return updated
}

export function removeCustomWord(word: string): string[] {
  const words = getCustomWords()
  const updated = words.filter(w => w !== word)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return updated
}
