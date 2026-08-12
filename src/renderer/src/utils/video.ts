// Parsing de URLs de video compartido entre VideoBlock y el menú slash.
const YOUTUBE_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/

export function parseVideoUrl(url: string): { type: 'youtube' | 'url'; src: string } {
  const match = url.match(YOUTUBE_REGEX)
  if (match) {
    return { type: 'youtube', src: `https://www.youtube.com/embed/${match[1]}` }
  }
  return { type: 'url', src: url }
}
