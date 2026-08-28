import MarkdownIt from 'markdown-it'
import Turndown from 'turndown'
import DOMPurify from 'dompurify'
import { parseVideoUrl } from './video'

const md = new MarkdownIt({ html: true, linkify: true, typographer: true })

// Serializadores de los nodos "atom" (imagen, video, mermaid, matemáticas):
// sus datos viajan en atributos y el elemento queda vacío, así que turndown
// los marca como "blank" (textContent vacío) y su blankRule —que tiene
// prioridad sobre cualquier addRule— los descartaría silenciosamente. Por eso
// se enchufan a blankReplacement en lugar de registrarse como reglas.
function imageReplacement(node: any): string {
  const src = node.getAttribute('src') || ''
  if (!src) return ''
  const alt = node.getAttribute('alt') || ''
  const title = node.getAttribute('title')
  const width = node.getAttribute('width')
  const height = node.getAttribute('height')
  const align = node.getAttribute('align')
  // Sin tamaño/alineación personalizados: Markdown estándar.
  if (!width && !height && (!align || align === 'center')) {
    return `\n\n![${alt}](${src}${title ? ` "${title}"` : ''})\n\n`
  }
  // Con personalización: HTML (el parseHTML del nodo image acepta <img>).
  const attrs = [`src="${src}"`, `alt="${alt}"`]
  if (title) attrs.push(`title="${title}"`)
  if (width) attrs.push(`width="${width}"`)
  if (height) attrs.push(`height="${height}"`)
  if (align && align !== 'center') attrs.push(`align="${align}"`)
  return `\n\n<img ${attrs.join(' ')}>\n\n`
}

// Videos: fence ```video con la URL (sintaxis documentada en la base de
// conocimiento); al cargar, preprocessMediaBlocks los restaura.
function videoReplacement(node: any): string {
  const src = (node.getAttribute('src') || '').trim()
  if (!src) return ''
  return `\n\n\`\`\`video\n${src}\n\`\`\`\n\n`
}

// Mermaid: fence ```mermaid estándar (lo renderiza GitHub y otros visores).
function mermaidReplacement(node: any): string {
  const code = node.getAttribute('code') || ''
  if (!code.trim()) return ''
  return `\n\n\`\`\`mermaid\n${code}\n\`\`\`\n\n`
}

// Devuelve la serialización del nodo si es un bloque atom conocido, o null
// para que blankReplacement aplique el comportamiento por defecto.
function serializeAtomNode(node: any): string | null {
  if (node.nodeName === 'DIV') {
    if (node.getAttribute?.('data-resizable-image') !== null) return imageReplacement(node)
    if (node.getAttribute?.('data-video-block') !== null) return videoReplacement(node)
    if (node.getAttribute?.('data-mermaid') !== null) return mermaidReplacement(node)
    if (node.getAttribute?.('data-math-block') !== null) {
      return `$$\n${node.getAttribute('data-tex') || ''}\n$$`
    }
  } else if (node.nodeName === 'SPAN' && node.getAttribute?.('data-math-inline') !== null) {
    return `$${node.getAttribute('data-tex') || ''}$`
  }
  return null
}

const turndown = new Turndown({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  blankReplacement: (_content: string, node: any) =>
    serializeAtomNode(node) ?? (node.isBlock ? '\n\n' : '')
})

turndown.addRule('strikethrough', {
  filter: ['s', 'del'],
  replacement: content => `~~${content}~~`
})

turndown.addRule('highlight', {
  filter: ['mark'],
  replacement: content => `==${content}==`
})

// Math inline: el span lleva la fórmula como texto interior (ver renderHTML
// de MathInline), así que no es "blank" y esta regla sí llega a evaluarse.
turndown.addRule('mathInline', {
  filter: (node: any) => {
    return node.nodeName === 'SPAN' && node.getAttribute?.('data-math-inline') !== null
  },
  replacement: (_content: string, node: any) => {
    return `$${node.getAttribute('data-tex') || ''}$`
  }
})

turndown.addRule('taskList', {
  filter: (node: any) => {
    return node.nodeName === 'UL' && node.getAttribute?.('data-type') === 'taskList'
  },
  replacement: (_content: string, node: any) => {
    const items = Array.from(node.childNodes)
      .filter((child: any) => child.nodeName === 'LI')
      .map((li: any) => {
        const checked = li.getAttribute('data-checked') === 'true'
        const div = li.querySelector('div')
        let text = ''
        let nestedHtml = ''
        if (div) {
          for (const child of div.childNodes) {
            if (child.nodeName === 'UL' && child.getAttribute?.('data-type') === 'taskList') {
              nestedHtml = turndown.turndown(child.outerHTML)
            } else if (child.nodeType === 1 || (child.nodeType === 3 && child.textContent.trim())) {
              text += child.nodeType === 3 ? child.textContent : child.outerHTML
            }
          }
          text = turndown.turndown(text.trim()).trim()
        }
        const line = `- [${checked ? 'x' : ' '}] ${text}`
        if (nestedHtml) {
          nestedHtml = nestedHtml.replace(/\n+$/, '')
          const indented = nestedHtml.split('\n').map(l => '  ' + l).join('\n')
          return line + '\n' + indented
        }
        return line
      })
    return items.join('\n') + '\n\n'
  }
})

turndown.addRule('table', {
  filter: 'table',
  replacement: (_content: string, node: any) => {
    const rows: string[][] = []
    const aligns: Record<number, string | null> = {}
    let numCols = 0

    const thead = node.querySelector('thead')
    if (thead) {
      const tr = thead.querySelector('tr')
      if (tr) {
        const cells: string[] = []
        const ths = tr.querySelectorAll('th, td')
        for (let i = 0; i < ths.length; i++) {
          cells.push(turndown.turndown(ths[i].innerHTML).replace(/\n/g, ' ').replace(/\|/g, '\\|'))
          const ta = ths[i].style.textAlign
          if (ta && ['left', 'center', 'right'].includes(ta)) aligns[i] = ta
        }
        if (cells.length) { rows.push(cells); numCols = Math.max(numCols, cells.length) }
      }
    }

    const tbody = node.querySelector('tbody')
    if (tbody) {
      const trs = tbody.querySelectorAll('tr')
      for (let i = 0; i < trs.length; i++) {
        const cells: string[] = []
        const tds = trs[i].querySelectorAll('td, th')
        for (let j = 0; j < tds.length; j++) {
          cells.push(turndown.turndown(tds[j].innerHTML).replace(/\n/g, ' ').replace(/\|/g, '\\|'))
          if (!(j in aligns)) {
            const ta = tds[j].style.textAlign
            if (ta && ['left', 'center', 'right'].includes(ta)) aligns[j] = ta
          }
        }
        if (cells.length) { rows.push(cells); numCols = Math.max(numCols, cells.length) }
      }
    }

    if (!numCols) return ''

    const padded = rows.map(r => { while (r.length < numCols) r.push(''); return r })
    const out: string[] = []
    out.push('| ' + padded[0].join(' | ') + ' |')
    const sep = '|' + Array.from({ length: numCols }, (_, i) => {
      const a = aligns[i]
      if (a === 'center') return ':---:'
      if (a === 'right') return '---:'
      if (a === 'left') return ':---'
      return '---'
    }).join('|') + '|'
    out.push(sep)
    for (let i = 1; i < padded.length; i++) {
      out.push('| ' + padded[i].join(' | ') + ' |')
    }
    return out.join('\n') + '\n\n'
  }
})

function escapeAttr(s: string): string {
  // &#10; mantiene los saltos de línea dentro del atributo en una sola línea
  // física: un HTML block de markdown-it termina en la primera línea en
  // blanco, y getAttribute los decodifica de vuelta a '\n'.
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/\n/g, '&#10;')
}

// Convierte los fences ```video / ```mermaid en los divs que los nodos del
// editor reconocen. Debe ejecutarse antes que preprocessMath y
// preprocessTaskLists, que esconden los bloques ``` restantes.
function preprocessMediaBlocks(source: string): string {
  return source.replace(/```(video|mermaid)[ \t]*\n([\s\S]*?)\n[ \t]*```/g, (_, lang, body) => {
    if (lang === 'video') {
      const src = body.trim()
      if (!src) return ''
      const { type, src: normalized } = parseVideoUrl(src)
      return `<div data-video-block src="${escapeAttr(normalized)}" type="${type}"></div>\n\n`
    }
    if (!body.trim()) return ''
    return `<div data-mermaid code="${escapeAttr(body)}"></div>\n\n`
  })
}

function preprocessTaskLists(source: string): string {
  const blocks: string[] = []
  let s = source.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (m) => {
    blocks.push(m)
    return `\uE000${blocks.length - 1}\uE001`
  })
  s = s.replace(
    /(?:^|\n)((?:[ \t]*[*-] \[[ x]\] .+(?:\n|$))+)/gm,
    (block) => {
      const lines = block.trim().split('\n')
      const parsed = lines.map(line => {
        const m = line.match(/^([ \t]*)[*-] \[([ x])\] (.+)$/)
        if (!m) return null
        return { indent: m[1].length, checked: m[2] === 'x', content: m[3] }
      }).filter(Boolean) as { indent: number; checked: boolean; content: string }[]
      if (!parsed.length) return ''

      function buildList(idx: number, minIndent: number): { html: string; nextIdx: number } {
        const items: string[] = []
        let i = idx
        while (i < parsed.length && parsed[i].indent >= minIndent) {
          if (parsed[i].indent > minIndent) { i++; continue }
          const { checked, content } = parsed[i]
          const html = md.renderInline(content)
          let nested = ''
          if (i + 1 < parsed.length && parsed[i + 1].indent > minIndent) {
            const result = buildList(i + 1, parsed[i + 1].indent)
            nested = result.html
            i = result.nextIdx - 1
          }
          items.push(`<li data-type="taskItem" data-checked="${checked}"><label><input type="checkbox"${checked ? ' checked' : ''}></label><div><p>${html}</p>${nested}</div></li>`)
          i++
        }
        return { html: '\n<ul data-type="taskList">\n' + items.join('\n') + '\n</ul>\n', nextIdx: i }
      }

      return buildList(0, parsed[0].indent).html
    }
  )
  s = s.replace(/\uE000(\d+)\uE001/g, (_, i) => blocks[Number(i)])
  return s
}

function preprocessMath(source: string): string {
  const blocks: string[] = []
  let s = source.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (m) => {
    blocks.push(m)
    return `\uE002${blocks.length - 1}\uE003`
  })
  s = s.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
    const t = tex.trim().replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    return `<div data-math-block data-tex="${t}"></div>\n\n`
  })
  s = s.replace(/(?<!\$)\$(\S[^$\n]*?)\$(?!\$)/g, (_, tex) => {
    const t = tex.trim().replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    return `<span data-math-inline data-tex="${t}"></span>`
  })
  s = s.replace(/\uE002(\d+)\uE003/g, (_, i) => blocks[Number(i)])
  return s
}

export function mdToHtml(source: string): string {
  const html = md.render(preprocessTaskLists(preprocessMath(preprocessMediaBlocks(source))))
  // El Markdown puede contener HTML crudo (html: true); se sanea antes de
  // insertarlo en el editor para neutralizar scripts/eventos maliciosos.
  return DOMPurify.sanitize(html)
}

export function htmlToMd(html: string): string {
  return turndown.turndown(html)
}
