import type { Editor } from '@tiptap/core'
import { useMemo, useState, useEffect } from 'react'
import { computeStats } from '../utils/stats'

interface StatusBarProps {
  editor: Editor | null
  modified: boolean
}

export function StatusBar({ editor, modified }: StatusBarProps) {
  const [cursor, setCursor] = useState({ line: 1, col: 1 })

  useEffect(() => {
    if (!editor) return
    const update = () => {
      const { from } = editor.state.selection
      const text = editor.state.doc.textBetween(0, from, '\n', '\n')
      const lines = text.split('\n')
      setCursor({ line: lines.length, col: (lines[lines.length - 1]?.length ?? 0) + 1 })
    }
    update()
    editor.on('selectionUpdate', update)
    editor.on('update', update)
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('update', update)
    }
  }, [editor])

  const stats = useMemo(() => {
    if (!editor) return null
    const html = editor.getHTML()
    const text = editor.state.doc.textBetween(0, editor.state.doc.content.size, '\n', ' ')
    return computeStats(html, text)
  }, [editor?.state.doc])

  return (
    <footer className="statusbar">

      <span className="statusbar-item">UTF-8</span>
      <span className="statusbar-sep">|</span>
      <span className="statusbar-item">Línea {cursor.line}</span>
      <span className="statusbar-sep">|</span>
      <span className="statusbar-item">Columna {cursor.col}</span>
      {stats && (
        <>
          <span className="statusbar-sep">|</span>
          <span className="statusbar-item">{stats.words.toLocaleString()} palabras</span>
          <span className="statusbar-sep">|</span>
          <span className="statusbar-item">{stats.readingTime} lectura</span>
        </>
      )}
      <span className="statusbar-spacer" />
      <span className={`statusbar-item statusbar-save ${modified ? 'unsaved' : 'saved'}`}>
        {modified ? 'Sin guardar ●' : 'Guardado ✓'}
      </span>
    </footer>
  )
}
