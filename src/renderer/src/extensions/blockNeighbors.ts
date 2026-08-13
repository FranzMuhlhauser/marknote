import { NodeSelection, TextSelection } from '@tiptap/pm/state'
import type { Transaction } from '@tiptap/pm/state'

// Los nodos bloque "atom" (imagen, video, mermaid...) no pueden alojar el
// cursor para escribir: ProseMirror solo permite el cursor dentro de
// textblocks (párrafos). Si el nodo queda pegado a un borde del documento —
// o es el único contenido (doc > node) — no hay ningún párrafo adyacente
// donde escribir. Esta función inserta párrafos vacíos antes/después del
// nodo cuando falta uno y deja el cursor en el párrafo posterior.
export function ensureNeighborParagraphs(tr: Transaction, nodeFrom: number, nodeTo: number, focusAfter = true) {
  const paragraph = tr.doc.type.schema.nodes.paragraph
  if (!paragraph) return

  const $from = tr.doc.resolve(nodeFrom)
  const $to = tr.doc.resolve(nodeTo)
  const before = $from.nodeBefore
  const after = $to.nodeAfter
  const needsBefore = !before || !before.isTextblock
  const needsAfter = !after || !after.isTextblock
  if (!needsBefore && !needsAfter) return

  const paraSize = paragraph.create().nodeSize
  if (needsBefore) {
    tr.insert(nodeFrom, paragraph.create())
    nodeTo += paraSize
  }
  if (needsAfter) {
    tr.insert(nodeTo, paragraph.create())
  }
  if (focusAfter) {
    // Deja el cursor dentro del párrafo posterior (o del siguiente textblock)
    tr.setSelection(TextSelection.near(tr.doc.resolve(nodeTo + 1)))
  }
}

// Nombres de los nodos bloque "atom" que muestran medios embebidos.
export const MEDIA_NODE_NAMES = ['image', 'videoBlock', 'mermaidBlock']

// Al CARGAR contenido (setContent) el parser de ProseMirror puede dejar un
// nodo media pegado a un borde del documento — p. ej. un video o mermaid como
// único contenido, o una imagen tras ser "levantada" de su <p> — sin párrafos
// adyacentes donde escribir. Esta función garantiza un párrafo antes y después
// de cada nodo media. Se procesa en orden inverso para que las inserciones no
// desplacen las posiciones ya registradas.
export function ensureMediaNeighbors(tr: Transaction, nodeNames: string[] = MEDIA_NODE_NAMES) {
  const positions: { from: number; to: number }[] = []
  tr.doc.descendants((node, pos) => {
    if (nodeNames.includes(node.type.name)) {
      positions.push({ from: pos, to: pos + node.nodeSize })
    }
  })
  for (let i = positions.length - 1; i >= 0; i--) {
    ensureNeighborParagraphs(tr, positions[i].from, positions[i].to, false)
  }
}

// Atajos de teclado para nodos bloque atom: con el nodo seleccionado, Enter
// crea un párrafo después y las flechas suben/bajan al párrafo vecino
// (creándolo si no existe).
export function atomBlockKeyboardShortcuts(nodeName: string) {
  return {
    // Nodo seleccionado + Enter → crea un párrafo después y deja el cursor ahí
    Enter: ({ editor }: any) => {
      const { state } = editor
      const { selection, schema } = state
      if (!(selection instanceof NodeSelection) || selection.node.type.name !== nodeName) return false
      const paragraph = schema.nodes.paragraph
      if (!paragraph) return false
      const pos = selection.to
      editor.chain().insertContentAt(pos, paragraph.create()).focus(pos + 1).run()
      return true
    },
    // Nodo seleccionado + ↓ → baja al siguiente párrafo (lo crea si no existe)
    ArrowDown: ({ editor }: any) => {
      const { state } = editor
      const { selection, schema, doc } = state
      if (!(selection instanceof NodeSelection) || selection.node.type.name !== nodeName) return false
      const paragraph = schema.nodes.paragraph
      if (!paragraph) return false
      const after = doc.resolve(selection.to).nodeAfter
      if (after && after.isTextblock) {
        editor.commands.setTextSelection(selection.to + 1)
        return true
      }
      const pos = selection.to
      editor.chain().insertContentAt(pos, paragraph.create()).focus(pos + 1).run()
      return true
    },
    // Nodo seleccionado + ↑ → sube al párrafo anterior (lo crea si no existe)
    ArrowUp: ({ editor }: any) => {
      const { state } = editor
      const { selection, schema, doc } = state
      if (!(selection instanceof NodeSelection) || selection.node.type.name !== nodeName) return false
      const paragraph = schema.nodes.paragraph
      if (!paragraph) return false
      const before = doc.resolve(selection.from).nodeBefore
      if (before && before.isTextblock) {
        editor.commands.setTextSelection(selection.from - 1)
        return true
      }
      const pos = selection.from
      editor.chain().insertContentAt(pos, paragraph.create()).focus(pos + 1).run()
      return true
    },
  }
}

// Localiza el nodo atom recién insertado (normalmente queda seleccionado como
// NodeSelection) y garantiza párrafos alrededor. Se usa desde los comandos
// set* de cada extensión tras insertContent.
export function ensureParagraphsAroundInsertedNode(tr: Transaction, nodeName: string) {
  const { selection, doc } = tr
  let nodeFrom = -1
  let nodeTo = -1
  if (selection instanceof NodeSelection && selection.node.type.name === nodeName) {
    nodeFrom = selection.from
    nodeTo = selection.to
  } else {
    const start = Math.max(0, selection.from - 20)
    const end = Math.min(doc.content.size, selection.to + 20)
    doc.nodesBetween(start, end, (node, pos) => {
      if (node.type.name === nodeName) {
        nodeFrom = pos
        nodeTo = pos + node.nodeSize
      }
    })
  }
  if (nodeFrom >= 0) {
    ensureNeighborParagraphs(tr, nodeFrom, nodeTo)
  }
}
