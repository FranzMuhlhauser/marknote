import { Node, mergeAttributes } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'

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
    return ReactNodeViewRenderer(MathInlineComponent)
  }
})

function MathInlineComponent({ node }: any) {
  try {
    const katex = (window as any).katex
    if (katex && node.attrs.tex) {
      const html = katex.renderToString(node.attrs.tex, { throwOnError: false })
      return <NodeViewWrapper as="span"><span dangerouslySetInnerHTML={{ __html: html }} /></NodeViewWrapper>
    }
  } catch (e) {}
  return <NodeViewWrapper as="span"><span className="math-inline-plain">{node.attrs.tex}</span></NodeViewWrapper>
}
