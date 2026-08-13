import { Node, mergeAttributes, PasteRule } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'

export const MathInline = Node.create({
  name: 'mathInline',
  group: 'inline',
  inline: true,
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
    return [{ tag: 'span[data-math-inline]' }]
  },

  renderHTML({ HTMLAttributes, node }) {
    // El texto interior evita que turndown trate el span como "blank" (su
    // blankRule descartaría la fórmula) y preserva los espacios adyacentes.
    return ['span', mergeAttributes(HTMLAttributes, { 'data-math-inline': '' }), `$${node.attrs.tex}$`]
  },

  addPasteRules() {
    return [
      new PasteRule({
        find: /(?<!\$)\$(\S[^$\n]*?)\$(?!\$)/g,
        handler: ({ state, range, match }) => {
          const tex = (match[1] || '').trim()
          const nodeType = state.schema.nodes.mathInline
          state.tr.replaceRangeWith(range.from, range.to, nodeType.create({ tex }))
        }
      })
    ]
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
