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
        return `<li data-checked="${checked}"><label><input type="checkbox"${checked ? ' checked' : ''}></label><div><p>${html}</p></div></li>`
      })
      return '\n<ul data-type="taskList">\n' + items.join('\n') + '\n</ul>\n'
    }
  )
  s = s.replace(/\x00CB(\d+)\x00/g, (_, i) => blocks[Number(i)])
  return s
}

export function mdToHtml(source: string): string {
  return md.render(preprocessTaskLists(source))
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
