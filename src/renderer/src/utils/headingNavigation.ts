import type { Editor } from '@tiptap/core'

// Normaliza encabezados y anclas para poder compararlos: minúsculas, sin
// acentos y con cualquier separador (espacios, guiones, guiones bajos,
// puntuación) reducido a '-'. Así `#Mi Título`, `#mi-titulo` y `#introducción`
// resuelven el mismo encabezado.
export function normalizeAnchor(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Posición del primer encabezado que coincide con el ancla, o null si ninguno.
export function findHeadingPosition(editor: Editor, anchor: string): number | null {
  const wanted = normalizeAnchor(anchor)
  if (!wanted) return null

  let found: number | null = null
  editor.state.doc.descendants((node, pos) => {
    if (found !== null) return false
    if (node.type.name === 'heading' && normalizeAnchor(node.textContent) === wanted) {
      found = pos
    }
    return true
  })
  return found
}

// Desplaza la vista al encabezado y lo resalta un instante. Es el mismo
// comportamiento que ya usaba el panel «Documento» (Outline).
export function goToHeading(editor: Editor, pos: number): void {
  editor.commands.setTextSelection({ from: pos + 1, to: pos + 1 })
  editor.commands.focus()

  const domNode = editor.view.nodeDOM(pos) as HTMLElement | null
  if (!domNode || !domNode.scrollIntoView) return

  domNode.scrollIntoView({ behavior: 'smooth', block: 'center' })
  domNode.classList.add('heading-highlight')
  setTimeout(() => domNode.classList.remove('heading-highlight'), 1500)
}

// Navega a un ancla interna del propio documento (`#mi-titulo`). Devuelve false
// si el fragmento está vacío o si ningún encabezado coincide.
export function goToAnchor(editor: Editor, href: string): boolean {
  let fragment = href.slice(1)
  try {
    fragment = decodeURIComponent(fragment)
  } catch {
    // Un '%' suelto no codifica nada: se compara el texto tal cual.
  }

  const pos = findHeadingPosition(editor, fragment)
  if (pos === null) return false

  goToHeading(editor, pos)
  return true
}
