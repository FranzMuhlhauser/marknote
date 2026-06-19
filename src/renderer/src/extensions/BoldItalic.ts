import { Extension, InputRule, PasteRule } from '@tiptap/core'

const starInputRegex = /(?:^|\s)(\*\*\*(?!\s+\*\*\*)((?:[^*]+))\*\*\*(?!\s+\*\*\*))$/
const starPasteRegex = /(?:^|\s)(\*\*\*(?!\s+\*\*\*)((?:[^*]+))\*\*\*(?!\s+\*\*\*))/g

export const BoldItalic = Extension.create({
  name: 'boldItalic',

  addInputRules() {
    return [
      new InputRule({
        find: starInputRegex,
        handler: ({ state, range, match }) => {
          const { tr } = state
          const captureGroup = match[match.length - 1]
          const fullMatch = match[0]
          if (!captureGroup) return

          const startSpaces = fullMatch.search(/\S/)
          const textStart = range.from + fullMatch.indexOf(captureGroup)
          const textEnd = textStart + captureGroup.length

          if (textEnd < range.to) {
            tr.delete(textEnd, range.to)
          }
          if (textStart > range.from) {
            tr.delete(range.from + startSpaces, textStart)
          }

          const markEnd = range.from + startSpaces + captureGroup.length
          const boldType = state.schema.marks.bold
          const italicType = state.schema.marks.italic

          if (boldType && italicType) {
            tr.addMark(range.from + startSpaces, markEnd, boldType.create())
            tr.addMark(range.from + startSpaces, markEnd, italicType.create())
            tr.removeStoredMark(boldType)
            tr.removeStoredMark(italicType)
          }
        }
      })
    ]
  },

  addPasteRules() {
    return [
      new PasteRule({
        find: starPasteRegex,
        handler: ({ state, range, match }) => {
          const { tr } = state
          const captureGroup = match[match.length - 1]
          const fullMatch = match[0]
          if (!captureGroup) return

          const startSpaces = fullMatch.search(/\S/)
          const textStart = range.from + fullMatch.indexOf(captureGroup)
          const textEnd = textStart + captureGroup.length

          if (textEnd < range.to) {
            tr.delete(textEnd, range.to)
          }
          if (textStart > range.from) {
            tr.delete(range.from + startSpaces, textStart)
          }

          const markEnd = range.from + startSpaces + captureGroup.length
          const boldType = state.schema.marks.bold
          const italicType = state.schema.marks.italic

          if (boldType && italicType) {
            tr.addMark(range.from + startSpaces, markEnd, boldType.create())
            tr.addMark(range.from + startSpaces, markEnd, italicType.create())
            tr.removeStoredMark(boldType)
            tr.removeStoredMark(italicType)
          }
        }
      })
    ]
  }
})
