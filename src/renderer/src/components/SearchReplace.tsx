import { useState, useCallback, useRef, useEffect } from 'react'
import type { Editor } from '@tiptap/core'

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
    const doc = editor.state.doc
    const text = doc.textBetween(0, doc.content.size, '\n', '')
    const replaced = text.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), replace)
    editor.commands.setContent(replaced)
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
