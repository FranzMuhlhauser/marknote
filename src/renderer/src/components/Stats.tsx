import { useMemo } from 'react'
import type { Editor } from '@tiptap/core'
import { computeStats } from '../utils/stats'

interface StatsProps {
  editor: Editor | null
}

export function Stats({ editor }: StatsProps) {
  const stats = useMemo(() => {
    if (!editor) return null
    const html = editor.getHTML()
    const text = editor.state.doc.textBetween(0, editor.state.doc.content.size, '\n', ' ')
    return computeStats(html, text)
  }, [editor?.state.doc])

  if (!stats) return null

  return (
    <div className="stats-panel">
      <div className="stats-title">Estadísticas del documento</div>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-value">{stats.chars}</span>
          <span className="stat-label">Caracteres</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.words}</span>
          <span className="stat-label">Palabras</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.lines}</span>
          <span className="stat-label">Líneas</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.paragraphs}</span>
          <span className="stat-label">Párrafos</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.headings}</span>
          <span className="stat-label">Encabezados</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.readingTime}</span>
          <span className="stat-label">Tiempo lectura</span>
        </div>
      </div>
    </div>
  )
}
