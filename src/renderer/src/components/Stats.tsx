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
      <div className="stats-title">Document Statistics</div>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-value">{stats.chars}</span>
          <span className="stat-label">Characters</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.words}</span>
          <span className="stat-label">Words</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.lines}</span>
          <span className="stat-label">Lines</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.paragraphs}</span>
          <span className="stat-label">Paragraphs</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.headings}</span>
          <span className="stat-label">Headings</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.readingTime}</span>
          <span className="stat-label">Reading time</span>
        </div>
      </div>
    </div>
  )
}
