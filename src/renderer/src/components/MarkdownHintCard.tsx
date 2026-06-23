import { useEffect, useRef } from 'react'
import type { MarkdownHint } from '../utils/markdownHints'

interface MarkdownHintCardProps {
  hint: MarkdownHint
  anchorRect: DOMRect
  onClose: () => void
}

export function MarkdownHintCard({ hint, anchorRect, onClose }: MarkdownHintCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick, true)
    return () => document.removeEventListener('mousedown', handleClick, true)
  }, [onClose])

  let top = anchorRect.bottom + 8
  let left = anchorRect.left

  const cardW = 280
  if (left + cardW > window.innerWidth - 16) {
    left = window.innerWidth - cardW - 16
  }
  if (left < 16) left = 16

  return (
    <div
      ref={cardRef}
      className="markdown-hint-card"
      style={{ top, left }}
    >
      <div className="markdown-hint-header">
        <span className="markdown-hint-icon">💡</span>
        <span className="markdown-hint-title">{hint.title}</span>
      </div>
      <div className="markdown-hint-body">
        <div className="markdown-hint-section">
          <span className="markdown-hint-label">Markdown:</span>
          <code className="markdown-hint-syntax">{hint.markdown}</code>
        </div>
        <div className="markdown-hint-section">
          <span className="markdown-hint-label">Ejemplo:</span>
          <pre className="markdown-hint-example">{hint.example}</pre>
        </div>
        <p className="markdown-hint-explanation">{hint.explanation}</p>
      </div>
    </div>
  )
}
