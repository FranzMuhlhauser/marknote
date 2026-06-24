import { Node, mergeAttributes, PasteRule } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { useRef, useState, useEffect } from 'react'

export const MathBlock = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      tex: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-tex'),
        renderHTML: (attrs) => ({ 'data-tex': attrs.tex })
      }
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-math-block]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-math-block': '' })]
  },

  addPasteRules() {
    return [
      new PasteRule({
        find: /\$\$([\s\S]*?)\$\$/g,
        handler: ({ state, range, match }) => {
          const tex = (match[1] || '').trim()
          const nodeType = state.schema.nodes.mathBlock
          state.tr.replaceRangeWith(range.from, range.to, nodeType.create({ tex }))
        }
      })
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathBlockComponent)
  }
})

function MathBlockComponent({ node, updateAttributes }: any) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    if (!node.attrs.tex) { setHtml(''); return }
    try {
      const katex = (window as any).katex
      if (!katex) { setHtml(node.attrs.tex); return }
      const rendered = katex.renderToString(node.attrs.tex, { displayMode: true, throwOnError: false })
      setHtml(rendered)
    } catch {
      setHtml(node.attrs.tex)
    }
  }, [node.attrs.tex])

  return (
    <NodeViewWrapper>
      <div className="math-block" contentEditable={false}>
        {node.attrs.tex ? (
          <div className="math-rendered" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <textarea
            className="math-input"
            placeholder="Type LaTeX (e.g., \sum_{n=1}^{\infty} \frac{1}{n^2})"
            rows={2}
            onBlur={e => updateAttributes({ tex: e.target.value })}
          />
        )}
      </div>
    </NodeViewWrapper>
  )
}
