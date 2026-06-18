import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { useRef, useState, useEffect } from 'react'

export const MathBlock = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return { tex: { default: '' } }
  },

  parseHTML() {
    return [{ tag: 'div[data-math-block]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-math-block': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(({ node, updateAttributes }) => {
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
      )
    })
  }
})
