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
}

function findMatches(editor: Editor, query: string): { from: number; to: number }[] {
  if (!query) return []
  const doc = editor.state.doc
  const text = doc.textBetween(0, doc.content.size, '\n', '')
  const matches: { from: number; to: number }[] = []
  const lower = query.toLowerCase()
  let pos = 0
  while (true) {
    const idx = text.toLowerCase().indexOf(lower, pos)
    if (idx === -1) break
    matches.push({ from: idx, to: idx + query.length })
    pos = idx + 1
  }
  return matches
}

export function SearchReplace({ editor, onClose }: SearchReplaceProps) {
  const [search, setSearch] = useState('')
  const [replace, setReplace] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [matches, setMatches] = useState<{ from: number; to: number }[]>([])
  const [matchIdx, setMatchIdx] = useState(0)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!editor || !search) { setMatches([]); return }
    const m = findMatches(editor, search)
    setMatches(m)
    setMatchIdx(0)
    if (m.length > 0) {
      editor.commands.setTextSelection({ from: m[0].from + 1, to: m[0].to + 1 })
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
      Decoration.inline(m.from + 1, m.to + 1, {
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
    editor?.commands.setTextSelection({ from: matches[i].from + 1, to: matches[i].to + 1 })
    editor?.commands.scrollIntoView()
  }, [matches, editor])

  const replaceOne = useCallback(() => {
    if (!editor || matches.length === 0) return
    const { from, to } = matches[matchIdx]
    editor.chain().focus().deleteRange({ from: from + 1, to: to + 1 }).insertContent(replace).run()
    setSearch(s => s)
  }, [editor, matches, matchIdx, replace])

  const replaceAll = useCallback(() => {
    if (!editor || !search) return
    const m = findMatches(editor, search)
    if (m.length === 0) return
    let tr = editor.state.tr
    for (let i = m.length - 1; i >= 0; i--) {
      const { from, to } = m[i]
      tr = tr.replaceWith(from + 1, to + 1, editor.state.schema.text(replace))
    }
    editor.view.dispatch(tr)
    setSearch('')
  }, [editor, search, replace])

  return (
    <div className="search-replace">
      <div className="search-row">
        <input ref={inputRef} type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && goTo(matchIdx + 1)} />
        <span className="search-count">{matches.length > 0 ? `${matchIdx + 1}/${matches.length}` : ''}</span>
        <button className="toolbar-btn" onClick={() => goTo(matchIdx + 1)} title="Next">↓</button>
        <button className="toolbar-btn" onClick={() => goTo(matchIdx - 1)} title="Previous">↑</button>
        <button className="toolbar-btn" onClick={onClose} title="Close (Esc)">✕</button>
      </div>
      <div className="search-row">
        <input type="text" placeholder="Replace..." value={replace} onChange={e => setReplace(e.target.value)} onKeyDown={e => e.key === 'Enter' && replaceOne()} />
        <button className="toolbar-btn" onClick={replaceOne} title="Replace">R</button>
        <button className="toolbar-btn" onClick={replaceAll} title="Replace all">All</button>
      </div>
    </div>
  )
}
