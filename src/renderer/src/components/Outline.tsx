import { useMemo } from 'react'
import type { Editor } from '@tiptap/core'

interface OutlineProps {
  editor: Editor | null
}

interface Heading {
  level: number
  text: string
  pos: number
}

export function Outline({ editor }: OutlineProps) {
  const headings = useMemo(() => {
    if (!editor) return []
    const result: Heading[] = []
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        const level = node.attrs.level as number
        if (level <= 3) {
          result.push({ level, text: node.textContent, pos })
        }
      }
    })
    return result
  }, [editor?.state.doc])

  const goTo = (pos: number) => {
    editor?.commands.setTextSelection({ from: pos + 1, to: pos + 1 })
    editor?.commands.focus()
  }

  return (
    <div className="outline-panel">
      <div className="outline-title">📖 Documento</div>
      {headings.length === 0 ? (
        <div className="outline-empty">
          <p className="outline-empty-text">Sin encabezados</p>
          <p className="outline-tip">💡 Usa H1, H2 y H3 para generar el índice.</p>
        </div>
      ) : headings.map((h, i) => (
        <div
          key={i}
          className="outline-item"
          style={{ paddingLeft: `${(h.level - 1) * 16}px` }}
          onClick={() => goTo(h.pos)}
        >
          {h.text || 'Sin título'}
        </div>
      ))}
    </div>
  )
}
