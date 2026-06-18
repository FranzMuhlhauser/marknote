export interface DocStats {
  chars: number
  words: number
  lines: number
  paragraphs: number
  headings: number
  readingTime: string
}

export function computeStats(html: string, text: string): DocStats {
  const chars = text.length
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const lines = text.split('\n').length
  const paragraphs = (html.match(/<p[ >]/g) || []).length
  const headings = (html.match(/<h[1-6][ >]/g) || []).length
  const minutes = Math.ceil(words / 200)
  const readingTime = minutes < 1 ? '<1 min' : `${minutes} min`

  return { chars, words, lines, paragraphs, headings, readingTime }
}
