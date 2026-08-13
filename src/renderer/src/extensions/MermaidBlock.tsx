import { Node, mergeAttributes } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'
import { ensureParagraphsAroundInsertedNode, atomBlockKeyboardShortcuts } from './blockNeighbors'

// Declara el comando setMermaid en la interface Commands (mismo patrón que
// setImage/setVideo) para que editor.chain().focus().setMermaid(...) compile
// y exista en runtime.
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mermaidBlock: {
      setMermaid: (options: { code: string }) => ReturnType
    }
  }
}

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
    return ReactNodeViewRenderer(MermaidComponent)
  },

  // Registra el comando setMermaid y garantiza párrafos alrededor del bloque
  // para poder escribir arriba/abajo (ver ensureParagraphsAroundInsertedNode).
  addCommands() {
    return {
      setMermaid: (options: { code: string }) => ({ commands, tr }) => {
        const ok = commands.insertContent({ type: this.name, attrs: { code: options.code } })
        if (!ok) return false
        ensureParagraphsAroundInsertedNode(tr, this.name)
        return true
      },
    }
  },

  addKeyboardShortcuts() {
    return atomBlockKeyboardShortcuts(this.name)
  }
})

function MermaidComponent({ node, updateAttributes }: any) {
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
      <NodeViewWrapper>
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
            }}>Renderizar</button>
          </div>
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper>
      <div className="mermaid-block" contentEditable={false}>
        <div ref={containerRef} className="mermaid-rendered" />
        {error && <div className="mermaid-error">{error}</div>}
        <div className="mermaid-actions">
          <button className="toolbar-btn" onClick={() => setEditing(true)}>Editar</button>
        </div>
      </div>
    </NodeViewWrapper>
  )
}
