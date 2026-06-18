import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'

export const MermaidBlock = Node.create({
  name: 'mermaidBlock',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return { code: { default: '' } }
  },

  parseHTML() {
    return [{ tag: 'div[data-mermaid]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-mermaid': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(({ node, updateAttributes }) => {
      const containerRef = useRef<HTMLDivElement>(null)
      const [error, setError] = useState('')
      const [editing, setEditing] = useState(!node.attrs.code)
      const [code, setCode] = useState(node.attrs.code || '')

      useEffect(() => {
        if (!code || editing) return
        setError('')
        const render = async () => {
          try {
            const mermaid = (window as any).mermaid
            if (!mermaid) { setError('Mermaid not loaded'); return }
            mermaid.mermaidAPI.initialize({ startOnLoad: false, theme: 'default' })
            const { svg } = await mermaid.mermaidAPI.render('mermaid-' + Math.random().toString(36).slice(2), code)
            if (containerRef.current) {
              containerRef.current.innerHTML = svg
            }
          } catch (e: any) {
            setError(e.message || 'Render error')
          }
        }
        render()
      }, [code, editing])

      if (editing) {
        return (
          <div className="mermaid-block">
            <textarea
              className="mermaid-input"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={`graph TD\n  A[Start] --> B[End]`}
              rows={4}
            />
            <div className="mermaid-actions">
              <button className="toolbar-btn" onClick={() => {
                setEditing(false)
                updateAttributes({ code })
              }}>Render</button>
            </div>
          </div>
        )
      }

      return (
        <div className="mermaid-block" contentEditable={false}>
          <div ref={containerRef} className="mermaid-rendered" />
          {error && <div className="mermaid-error">{error}</div>}
          <div className="mermaid-actions">
            <button className="toolbar-btn" onClick={() => setEditing(true)}>Edit</button>
          </div>
        </div>
      )
    })
  }
})
