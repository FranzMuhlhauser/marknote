// Materialización de medios embebidos: al guardar, los src data:/blob: de
// imágenes y videos se escriben como archivos en <doc>.assets junto al .md y
// las referencias del Markdown se reemplazan por rutas relativas, de modo que
// el documento quede portable y legible en cualquier editor.

const MIME_EXT: Record<string, string> = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp',
  'image/bmp': 'bmp', 'image/svg+xml': 'svg',
  'video/mp4': 'mp4', 'video/webm': 'webm', 'video/ogg': 'ogg', 'video/quicktime': 'mov'
}

// Extrae extensión y base64 de un src embebido. Devuelve null para mimes no
// soportados o blob URLs ilegibles: esos src se dejan tal cual en el Markdown.
async function srcToBase64(src: string): Promise<{ kind: 'image' | 'video'; ext: string; base64: string } | null> {
  if (src.startsWith('data:')) {
    const m = src.match(/^data:([^;,]+);base64,(.*)$/s)
    const ext = m && MIME_EXT[m[1]]
    if (!m || !ext) return null
    return { kind: m[1].startsWith('video/') ? 'video' : 'image', ext, base64: m[2] }
  }
  if (src.startsWith('blob:')) {
    try {
      const blob = await (await fetch(src)).blob()
      const ext = MIME_EXT[blob.type]
      if (!ext) return null
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(blob)
      })
      return { kind: blob.type.startsWith('video/') ? 'video' : 'image', ext, base64: dataUrl.slice(dataUrl.indexOf(',') + 1) }
    } catch {
      return null
    }
  }
  return null
}

// Escribe en disco los medios embebidos del Markdown y devuelve el Markdown
// resultante junto al mapa src original → ruta relativa (para que el editor
// actualice los nodos y los guardados siguientes sean idempotentes).
export async function materializeMedia(markdown: string, mdPath: string): Promise<{ markdown: string; replacements: Map<string, string> }> {
  const srcs = new Set<string>()
  // Imágenes: ![alt](data:...|blob:...) o <img src="data:...|blob:...">
  for (const m of markdown.matchAll(/!\[[^\]]*\]\((data:[^)\s]+|blob:[^)\s]+)/g)) srcs.add(m[1])
  for (const m of markdown.matchAll(/<img [^>]*src="(data:[^"]+|blob:[^"]+)"/g)) srcs.add(m[1])
  // Videos: fence ```video cuyo contenido es una URL embebida
  for (const m of markdown.matchAll(/```video[ \t]*\n(data:[^\n]+|blob:[^\n]+)\n[ \t]*```/g)) srcs.add(m[1])

  const replacements = new Map<string, string>()
  const counters: Record<string, number> = {}
  let result = markdown
  for (const src of srcs) {
    const parsed = await srcToBase64(src)
    if (!parsed) continue
    const n = (counters[parsed.kind] = (counters[parsed.kind] ?? 0) + 1)
    const rel = await window.api.saveAsset({ mdPath, fileName: `${parsed.kind}-${n}.${parsed.ext}`, dataBase64: parsed.base64 })
    if (!rel) continue
    replacements.set(src, rel)
    result = result.split(src).join(rel)
  }
  return { markdown: result, replacements }
}

// Referencias locales de medios (imágenes y videos) en un Markdown: excluye las
// embebidas (data:/blob:) y las remotas (http/https, incluido YouTube). Son las
// rutas que deben existir junto al .md —normalmente bajo <doc>.assets—.
function extractLocalMediaSrcs(markdown: string): string[] {
  const srcs = new Set<string>()
  for (const m of markdown.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) srcs.add(m[1])
  for (const m of markdown.matchAll(/<img [^>]*src="([^"]+)"/g)) srcs.add(m[1])
  for (const m of markdown.matchAll(/```video[ \t]*\n([^\n]+)\n[ \t]*```/g)) srcs.add(m[1])
  return Array.from(srcs).filter(s => s && !/^(data:|blob:|https?:)/i.test(s))
}

// Cuenta cuántas referencias locales apuntan a archivos inexistentes en disco,
// reutilizando file:readMedia (null ⇒ archivo ausente o mime no soportado).
// Cubre pestañas activas y en segundo plano porque analiza el texto guardado,
// no los nodos montados del editor. Costo asumido: readMedia devuelve el
// archivo completo en base64, así que el chequeo escala con el tamaño de los medios.
export async function countMissingLocalMedia(markdown: string, docDir: string | null): Promise<number> {
  const checks: Promise<number>[] = extractLocalMediaSrcs(markdown).map(src =>
    window.api.readMedia(src, docDir ?? undefined).then(result => (result ? 1 : 0))
  )
  const results = await Promise.all(checks)
  return results.reduce((total, n) => total + n, 0)
}
