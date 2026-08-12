import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Typography from '@tiptap/extension-typography'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { wrappingInputRule } from '@tiptap/core'
import Table from '@tiptap/extension-table'
import { TextSelection } from '@tiptap/pm/state'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import { common, createLowlight } from 'lowlight'
import { MathInline } from './MathInline'
import { MathBlock } from './MathBlock'
import { MermaidBlock } from './MermaidBlock'
import { CurrentLineHighlight } from './CurrentLineHighlight'
import { CodeBlock } from './CodeBlock'
import { ResizableImage } from './ResizableImage'
import { VideoBlock } from './VideoBlock'
import { SlashCommand } from './SlashCommand'
import { BoldItalic } from './BoldItalic'
import { TableSort } from './TableSort'

const lowlight = createLowlight(common)

// Compartido entre celdas y encabezados: atributo `align` (left/center/right)
// persistido como style inline, compatible con HTML y con el markdown-it de export.
function withCellAlign() {
  return {
    addAttributes(this: any) {
      return {
        ...this.parent?.(),
        align: {
          default: null,
          parseHTML: (el: HTMLElement) => {
            const ta = el.style.textAlign
            if (ta && ['left', 'center', 'right'].includes(ta)) return ta
            const a = el.getAttribute('align')
            if (a && ['left', 'center', 'right'].includes(a)) return a
            return null
          },
          renderHTML: (attrs: { align?: string | null }) => {
            if (!attrs.align) return {}
            return { style: `text-align: ${attrs.align}` }
          }
        }
      }
    }
  }
}

const CustomTable = Table.extend({
  addKeyboardShortcuts() {
    return {
      'Tab': () => {
        const { state } = this.editor
        const { $anchor } = state.selection
        let d = $anchor.depth
        while (d >= 0 && $anchor.node(d).type.name !== 'table') d--
        if (d < 0) return false

        if (this.editor.commands.goToNextCell()) return true
        this.editor.chain().focus().addRowAfter().goToNextCell().run()
        return true
      },
      'Shift-Tab': () => {
        const { state } = this.editor
        const { $anchor } = state.selection
        let d = $anchor.depth
        while (d >= 0 && $anchor.node(d).type.name !== 'table') d--
        if (d < 0) return false
        const after = $anchor.after(d)
        this.editor.chain().focus()
          .command(({ tr, dispatch }) => {
            tr.insert(after, state.schema.nodes.paragraph.create())
            tr.setSelection(TextSelection.create(tr.doc, after + 1, after + 1))
            if (dispatch) dispatch(tr)
            return true
          }).run()
        return true
      },
    }
  },
})

export function getExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      codeBlock: false,
      history: { depth: 100 }
    }),
    Placeholder.configure({ placeholder: 'Empieza a escribir...' }),
    Underline,
    Link.configure({ openOnClick: false, HTMLAttributes: { class: 'editor-link' } }),
    Typography,
    TaskList,
    TaskItem.extend({
      addInputRules() {
        return [
          wrappingInputRule({
            find: /^\s*(?:[-*]\s+)?\[(x| ?)\]\s$/,
            type: this.type,
            getAttributes: match => ({
              checked: match[match.length - 1] === 'x',
            }),
          }),
        ]
      }
    }).configure({ nested: true }),
    CustomTable,
    TableRow,
    TableCell.extend(withCellAlign()),
    TableHeader.extend(withCellAlign()),
    Highlight,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    CodeBlock.configure({ lowlight }),
    ResizableImage,
    MathInline,
    MathBlock,
    MermaidBlock,
    VideoBlock,
    SlashCommand,
    BoldItalic,
    CurrentLineHighlight,
    TableSort
  ]
}
