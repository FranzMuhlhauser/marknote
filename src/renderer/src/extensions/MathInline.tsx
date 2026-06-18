import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'

export const MathInline = Node.create({
  name: 'mathInline',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return { tex: { default: '' } }
  },

  parseHTML() {
    return [{ tag: 'span[data-math-inline]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-math-inline': '' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(({ node }) => {
      try {
        const katex = (window as any).katex
        if (katex && node.attrs.tex) {
          const html = katex.renderToString(node.attrs.tex, { throwOnError: false })
          return <span dangerouslySetInnerHTML={{ __html: html }} />
        }
      } catch {}
      return <span className="math-inline-plain">{node.attrs.tex}</span>
    })
  }
})
