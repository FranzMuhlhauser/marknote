import { useState, useCallback, useRef, useEffect } from 'react'
import type { Editor } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

const searchPluginKey = new PluginKey('search-highlight')

const searchPlugin = new Plugin({
  key: searchPluginKey,
  state: {
    init() { return DecorationSet.empty },
    apply(tr, set: DecorationSet) {
      const meta = tr.getMeta(searchPluginKey)
      if (meta !== undefined) return meta as DecorationSet
      return set.map(tr.mapping, tr.doc)
    }
  },
  props: {
    decorations(state) { return this.getState(state) }
  }
})

interface SearchReplaceProps {
  editor: Editor | null
  onClose: () => void
  initialFocus?: 'search' | 'replace'
}

function findMatches(editor: Editor, query: string): { from: number; to: number }[] {
  if (!query) return []
  const doc = editor.state.doc
  const lower = query.toLowerCase()
  const matches: { from: number; to: number }[] = []

  // Construye el texto plano del documento mapeando cada carácter a su
  // posición real en el doc. textBetween() devuelve un string cuyos índices
  // NO corresponden a posiciones del documento en docs multi-bloque, así que
  // se recorren los nodos con descendants y se acumula la posición real.
  let text = ''
  const positions: number[] = []
  let hasText = false

  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      const start = pos // un text node en `pos` ocupa [pos, pos+len)
      for (let i = 0; i < node.text.length; i++) {
        text += node.text[i]
        positions.push(start + i)
      }
      hasText = true
    } else if (node.isBlock && hasText) {
      text += '\n'
      positions.push(-1) // separador de bloque, sin posición real
    }
    return true
  })

  let idx = 0
  while (true) {
    idx = text.toLowerCase().indexOf(lower, idx)
    if (idx === -1) break
    const endIdx = idx + query.length - 1
    const span = positions.slice(idx, endIdx + 1)
    // Descarta matches que crucen separadores de bloque (no son contiguos).
    if (span.length === query.length && !span.includes(-1)) {
      matches.push({ from: span[0], to: span[span.length - 1] + 1 })
    }
    idx += 1
  }
  return matches
}

export function SearchReplace({ editor, onClose, initialFocus = 'search' }: SearchReplaceProps) {
  const [search, setSearch] = useState('')
  const [replace, setReplace] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const [matches, setMatches] = useState<{ from: number; to: number }[]>([])
  const [matchIdx, setMatchIdx] = useState(0)

  useEffect(() => {
    if (initialFocus === 'replace') {
      replaceInputRef.current?.focus()
    } else {
      inputRef.current?.focus()
    }
  }, [initialFocus])

  useEffect(() => {
    if (!editor || !search) { setMatches([]); return }
    const m = findMatches(editor, search)
    setMatches(m)
    setMatchIdx(0)
    if (m.length > 0) {
      editor.commands.setTextSelection({ from: m[0].from, to: m[0].to })
      editor.commands.scrollIntoView()
    }
  }, [search, editor])

  useEffect(() => {
    if (!editor) return
    editor.registerPlugin(searchPlugin)
    return () => { try { editor.unregisterPlugin(searchPluginKey) } catch {} }
  }, [editor])

  useEffect(() => {
    if (!editor) return
    const actives = new Set(matchIdx >= 0 && matchIdx < matches.length ? [matches[matchIdx]] : [])
    const decos = matches.map((m, i) =>
      Decoration.inline(m.from, m.to, {
        class: i === matchIdx ? 'search-match-active' : 'search-match-highlight'
      })
    )
    editor.view.dispatch(
      editor.state.tr.setMeta(searchPluginKey, DecorationSet.create(editor.state.doc, decos))
    )
  }, [editor, matches, matchIdx])

  const goTo = useCallback((idx: number) => {
    if (matches.length === 0) return
    const i = ((idx % matches.length) + matches.length) % matches.length
    setMatchIdx(i)
    editor?.commands.setTextSelection({ from: matches[i].from, to: matches[i].to })
    editor?.commands.scrollIntoView()
  }, [matches, editor])

  const replaceOne = useCallback(() => {
    if (!editor || matches.length === 0) return
    const { from, to } = matches[matchIdx]
    editor.chain().focus().deleteRange({ from, to }).insertContent(replace).run()
    setSearch(s => s)
  }, [editor, matches, matchIdx, replace])

  const replaceAll = useCallback(() => {
    if (!editor || !search) return
    const m = findMatches(editor, search)
    if (m.length === 0) return
    let tr = editor.state.tr
    for (let i = m.length - 1; i >= 0; i--) {
      const { from, to } = m[i]
      tr = tr.replaceWith(from, to, editor.state.schema.text(replace))
    }
    editor.view.dispatch(tr)
    setSearch('')
  }, [editor, search, replace])

  return (
    <div className="search-replace">
      <div className="search-row">
        <input ref={inputRef} type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && goTo(matchIdx + 1)} />
        <span className="search-count">{matches.length > 0 ? `${matchIdx + 1}/${matches.length}` : ''}</span>
        <button className="toolbar-btn" onClick={() => goTo(matchIdx + 1)} title="Next">↓</button>
        <button className="toolbar-btn" onClick={() => goTo(matchIdx - 1)} title="Previous">↑</button>
        <button className="toolbar-btn" onClick={onClose} title="Close (Esc)">✕</button>
      </div>
      <div className="search-row">
        <input ref={replaceInputRef} type="text" placeholder="Reemplazar..." value={replace} onChange={e => setReplace(e.target.value)} onKeyDown={e => e.key === 'Enter' && replaceOne()} />
        <button className="toolbar-btn" onClick={replaceOne} title="Replace">R</button>
        <button className="toolbar-btn" onClick={replaceAll} title="Replace all">All</button>
      </div>
    </div>
  )
}
