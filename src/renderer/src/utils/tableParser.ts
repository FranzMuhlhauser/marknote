function showToast(message: string): void {
  const el = document.createElement('div')
  el.textContent = message
  Object.assign(el.style, {
    position: 'fixed',
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--bg, #1e1e1e)',
    color: 'var(--text, #ccc)',
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid var(--border, #444)',
    zIndex: '10001',
    fontSize: '14px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  })
  document.body.appendChild(el)
  setTimeout(() => {
    el.style.opacity = '0'
    el.style.transition = 'opacity 0.3s'
    setTimeout(() => el.parentNode?.removeChild(el), 300)
  }, 2500)
}

export function parseDelimitedText(text: string): { headers: string[]; rows: string[][] } | null {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').filter(l => l.trim() !== '')
  if (lines.length === 0) return null

  if (looksLikeMarkdownTable(lines)) return null

  const delim = detectDelimiter(lines)
  if (!delim) return null

  const rows = lines
    .map(l => {
      const cells = l.split(delim).map(c => c.trim())
      if (delim === '|') {
        while (cells.length > 0 && cells[0] === '') cells.shift()
        while (cells.length > 0 && cells[cells.length - 1] === '') cells.pop()
      }
      return cells
    })
    .filter(cells => {
      const nonEmpty = cells.filter(c => c !== '')
      return nonEmpty.length > 0 && !nonEmpty.every(c => /^---?$/.test(c))
    })

  if (rows.length === 0) return null

  const cols = Math.max(...rows.map(r => r.length))
  const normalized = rows.map(r => {
    const copy = [...r]
    while (copy.length < cols) copy.push('')
    return copy
  })

  return { headers: normalized[0], rows: normalized.slice(1) }
}

function looksLikeMarkdownTable(lines: string[]): boolean {
  return (
    lines.length >= 2 &&
    lines[0].trim().startsWith('|') &&
    /^\|[\s\-:|]+\|$/.test(lines[1].trim()) &&
    lines[1].includes('---')
  )
}

function detectDelimiter(lines: string[]): string | null {
  const delimiters: [string, ...string[]] = ['|', '\t', ';', ',']
  const counts = delimiters.map(d =>
    lines.reduce((sum, l) => sum + (l.split(d).length - 1), 0)
  )
  const maxIdx = counts.indexOf(Math.max(...counts))
  return counts[maxIdx] > 0 ? delimiters[maxIdx] : null
}

export function createTableNode(schema: any, headers: string[], rows: string[][]): any {
  const cell = (type: string, text: string) => {
    const p = text
      ? schema.nodes.paragraph.create({}, schema.text(text))
      : schema.nodes.paragraph.create()
    return schema.nodes[type].create({}, p)
  }
  const headerRow = schema.nodes.tableRow.create(
    {},
    headers.map(h => cell('tableHeader', h))
  )
  const dataRows = rows.map(r =>
    schema.nodes.tableRow.create({}, r.map(c => cell('tableCell', c)))
  )
  return schema.nodes.table.create({}, [headerRow, ...dataRows])
}

export function insertTableData(editor: any, data: { headers: string[]; rows: string[][] }): void {
  const { from } = editor.state.selection
  const node = createTableNode(editor.schema, data.headers, data.rows)

  editor.chain().focus().insertContentAt(from, node).run()

  const doc = editor.state.doc
  for (let i = from; i < doc.content.size; i++) {
    const n = doc.nodeAt(i)
    if (n?.isText && n.text) {
      editor.commands.setTextSelection({ from: i, to: i })
      return
    }
  }
}

export { showToast }
