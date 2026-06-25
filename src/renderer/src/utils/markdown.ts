import MarkdownIt from 'markdown-it'
import Turndown from 'turndown'

const md = new MarkdownIt({ html: true, linkify: true, typographer: true })
const turndown = new Turndown({ headingStyle: 'atx', codeBlockStyle: 'fenced' })

turndown.addRule('strikethrough', {
  filter: ['s', 'del'],
  replacement: content => `~~${content}~~`
})

turndown.addRule('highlight', {
  filter: ['mark'],
  replacement: content => `==${content}==`
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
        const text = div ? turndown.turndown(div.innerHTML) : ''
        return `- [${checked ? 'x' : ' '}] ${text.trim()}`
      })
    return items.join('\n') + '\n\n'
  }
})

turndown.addRule('mathBlock', {
  filter: (node: any) => {
    return node.nodeName === 'DIV' && node.getAttribute?.('data-math-block') !== null
  },
  replacement: (_content: string, node: any) => {
    const tex = node.getAttribute('data-tex') || ''
    return `$$\n${tex}\n$$`
  }
})

turndown.addRule('mathInline', {
  filter: (node: any) => {
    return node.nodeName === 'SPAN' && node.getAttribute?.('data-math-inline') !== null
  },
  replacement: (_content: string, node: any) => {
    const tex = node.getAttribute('data-tex') || ''
    return `$${tex}$`
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

function preprocessTaskLists(source: string): string {
  const blocks: string[] = []
  let s = source.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (m) => {
    blocks.push(m)
    return `\x00CB${blocks.length - 1}\x00`
  })
  s = s.replace(
    /(?:^|\n)((?:[*-] \[[ x]\] .+(?:\n|$))+)/gm,
    (block) => {
      const lines = block.trim().split('\n')
      const items = lines.map(line => {
        const m = line.match(/^[*-] \[([ x])\] (.+)$/)
        if (!m) return ''
        const checked = m[1] === 'x'
        const html = md.renderInline(m[2])
        return `<li data-type="taskItem" data-checked="${checked}"><label><input type="checkbox"${checked ? ' checked' : ''}></label><div><p>${html}</p></div></li>`
      })
      return '\n<ul data-type="taskList">\n' + items.join('\n') + '\n</ul>\n'
    }
  )
  s = s.replace(/\x00CB(\d+)\x00/g, (_, i) => blocks[Number(i)])
  return s
}

function preprocessMath(source: string): string {
  const blocks: string[] = []
  let s = source.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (m) => {
    blocks.push(m)
    return `\x00MP${blocks.length - 1}\x00`
  })
  s = s.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
    const t = tex.trim().replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    return `<div data-math-block data-tex="${t}"></div>\n\n`
  })
  s = s.replace(/(?<!\$)\$(\S[^$\n]*?)\$(?!\$)/g, (_, tex) => {
    const t = tex.trim().replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    return `<span data-math-inline data-tex="${t}"></span>`
  })
  s = s.replace(/\x00MP(\d+)\x00/g, (_, i) => blocks[Number(i)])
  return s
}

export function mdToHtml(source: string): string {
  return md.render(preprocessTaskLists(preprocessMath(source)))
}

export function htmlToMd(html: string): string {
  return turndown.turndown(html)
}

export const DEFAULT_MD = `# Welcome to Marknote

Start typing in **Markdown** — see the result *instantly*.

## Features

- **Bold**, *italic*, ~~strikethrough~~, ==highlight==, \`inline code\`
- Headings, lists, and [links](https://example.com)
- Tables, task lists, and code blocks
- Math with KaTeX: $E = mc^2$
- Diagrams with Mermaid

### Example Table

| Feature | Status |
|---------|--------|
| Tables  | ✅     |
| Math    | ✅     |

\`\`\`js
console.log('Hello, Marknote!')
\`\`\`

- [x] Task one
- [ ] Task two
`
