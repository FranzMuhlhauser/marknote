import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Typography from '@tiptap/extension-typography'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { wrappingInputRule } from '@tiptap/core'
import Table from '@tiptap/extension-table'
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
import { TableSort, tableSortKey } from './TableSort'

export { tableSortKey }

const lowlight = createLowlight(common)

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
    Table.configure({ resizable: false }),
    TableRow,
    TableCell,
    TableHeader,
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
