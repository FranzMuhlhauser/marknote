import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export const CurrentLineHighlight = Extension.create({
  name: 'currentLineHighlight',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('currentLineHighlight'),
        props: {
          decorations(state) {
            const { selection, doc } = state
            if (!selection.empty) return DecorationSet.empty
            const { $from } = selection
            const lineStart = $from.start()
            const lineEnd = $from.end()
            if (lineStart >= lineEnd) return DecorationSet.empty
            return DecorationSet.create(doc, [
              Decoration.inline(lineStart, lineEnd, { class: 'current-line' })
            ])
          }
        }
      })
    ]
  }
})
