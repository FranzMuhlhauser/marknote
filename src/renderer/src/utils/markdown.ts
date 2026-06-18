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

export function mdToHtml(source: string): string {
  return md.render(source)
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
