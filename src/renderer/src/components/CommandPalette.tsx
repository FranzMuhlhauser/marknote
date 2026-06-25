import { useState, useCallback, useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/core'
import { showPrompt } from '../utils/prompt'
import { openTablePicker } from '../utils/tablePicker'
import { parseDelimitedText, insertTableData, showToast } from '../utils/tableParser'

interface Cmd {
  id: string
  label: string
  shortcut?: string
  action: (editor: Editor) => void
}

const COMMANDS: Cmd[] = [
  { id: 'bold', label: 'Negrita', shortcut: 'Ctrl+B', action: e => e.chain().focus().toggleBold().run() },
  { id: 'italic', label: 'Cursiva', shortcut: 'Ctrl+I', action: e => e.chain().focus().toggleItalic().run() },
  { id: 'underline', label: 'Subrayado', shortcut: 'Ctrl+U', action: e => e.chain().focus().toggleUnderline().run() },
  { id: 'strike', label: 'Tachado', action: e => e.chain().focus().toggleStrike().run() },
  { id: 'h1', label: 'Encabezado 1', shortcut: 'Ctrl+1', action: e => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { id: 'h2', label: 'Encabezado 2', shortcut: 'Ctrl+2', action: e => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { id: 'h3', label: 'Encabezado 3', shortcut: 'Ctrl+3', action: e => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { id: 'bullet', label: 'Lista con viñetas', action: e => e.chain().focus().toggleBulletList().run() },
  { id: 'ordered', label: 'Lista numerada', action: e => e.chain().focus().toggleOrderedList().run() },
  { id: 'task', label: 'Lista de tareas', action: e => e.chain().focus().toggleTaskList().run() },
  { id: 'quote', label: 'Cita', action: e => e.chain().focus().toggleBlockquote().run() },
  { id: 'code', label: 'Bloque de código', action: e => e.chain().focus().toggleCodeBlock().run() },
  { id: 'table', label: 'Insertar tabla', action: e => {
    const rect = document.querySelector('.ProseMirror')?.getBoundingClientRect()
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
    const y = rect ? rect.top + rect.height / 3 : window.innerHeight / 3
    openTablePicker(e, { x, y })
  } },
  { id: 'math-inline', label: 'Fórmula en línea', action: e => e.chain().focus().insertContent({ type: 'mathInline', attrs: { tex: '' } }).run() },
  { id: 'math-block', label: 'Bloque de fórmula', action: e => e.chain().focus().insertContent({ type: 'mathBlock', attrs: { tex: '' } }).run() },
  { id: 'mermaid', label: 'Diagrama Mermaid', action: e => e.chain().focus().insertContent({ type: 'mermaidBlock', attrs: { code: '' } }).run() },
  { id: 'hr', label: 'Línea horizontal', action: e => e.chain().focus().setHorizontalRule().run() },
  { id: 'link', label: 'Insertar enlace', action: async e => { const url = await showPrompt('URL:'); if (url) e.chain().focus().setLink({ href: url }).run() } },
  { id: 'image', label: 'Insertar imagen', action: e => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => e.chain().focus().setImage({ src: reader.result as string }).run()
      reader.readAsDataURL(file)
    }
    input.click()
  }},
  { id: 'csv-table', label: 'Convertir datos a tabla', action: async e => {
    const { from, to } = e.state.selection
    const hasSelection = from !== to
    const text = hasSelection
      ? e.state.doc.textBetween(from, to)
      : await showPrompt('Pega los datos (CSV, TSV o pipe):')
    if (!text) return
    const parsed = parseDelimitedText(text)
    if (!parsed) { showToast('No se detectó un formato CSV, TSV o delimitado por |.'); return }
    insertTableData(e, parsed)
  }},
]

interface CommandPaletteProps {
  editor: Editor | null
  onClose: () => void
}

export function CommandPalette({ editor, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState(0)

  const filtered = query
    ? COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || c.id.includes(query.toLowerCase()))
    : COMMANDS

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    setSelected(0)
  }, [query])

  const execute = useCallback((cmd: Cmd) => {
    if (!editor) return
    cmd.action(editor)
    onClose()
  }, [editor, onClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(i => Math.min(i + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && filtered[selected]) { e.preventDefault(); execute(filtered[selected]) }
    if (e.key === 'Escape') { e.preventDefault(); onClose() }
  }, [filtered, selected, execute, onClose])

  useEffect(() => {
    listRef.current?.children[selected]?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  if (!editor) return null

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={e => e.stopPropagation()}>
        <input ref={inputRef} type="text" placeholder="Buscar comandos..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown} />
        <div className="command-list" ref={listRef}>
          {filtered.map((cmd, i) => (
            <div key={cmd.id} className={`command-item ${i === selected ? 'selected' : ''}`} onClick={() => execute(cmd)} onMouseEnter={() => setSelected(i)}>
              <span className="command-label">{cmd.label}</span>
              {cmd.shortcut && <span className="command-shortcut">{cmd.shortcut}</span>}
            </div>
          ))}
          {filtered.length === 0 && <div className="command-empty">Sin resultados</div>}
        </div>
      </div>
    </div>
  )
}
