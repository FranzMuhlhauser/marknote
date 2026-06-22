export interface MarkdownHint {
  id: string
  title: string
  markdown: string
  example: string
  explanation: string
}

export type HintType = 'toolbar' | 'mentor' | 'contextual' | 'onboarding'

export interface ActiveHint {
  id: string
  type: HintType
  data: MarkdownHint
  anchorRect: DOMRect
}

export const FORMATTING_HINTS: Record<string, MarkdownHint> = {
  h1: {
    id: 'h1',
    title: 'Encabezado 1',
    markdown: '# Mi título',
    example: '# Documentación',
    explanation: 'Un solo # crea el encabezado más grande.'
  },
  h2: {
    id: 'h2',
    title: 'Encabezado 2',
    markdown: '## Mi título',
    example: '## Sección',
    explanation: 'Dos ## crean un encabezado de nivel 2.'
  },
  h3: {
    id: 'h3',
    title: 'Encabezado 3',
    markdown: '### Mi título',
    example: '### Subsección',
    explanation: 'Tres ### crean un encabezado de nivel 3.'
  },
  bold: {
    id: 'bold',
    title: 'Negrita',
    markdown: '**texto**',
    example: 'Esto es **importante**',
    explanation: 'Envuelve el texto entre **doble asterisco**.'
  },
  italic: {
    id: 'italic',
    title: 'Cursiva',
    markdown: '*texto*',
    example: 'Ella dijo *hola*',
    explanation: 'Envuelve el texto entre *asterisco simple*.'
  },
  bulletList: {
    id: 'bulletList',
    title: 'Lista',
    markdown: '- elemento',
    example: '- Manzanas\n- Peras\n- Uvas',
    explanation: 'Cada línea que empiece con - será un elemento de lista.'
  },
  taskList: {
    id: 'taskList',
    title: 'Tareas',
    markdown: '- [ ] tarea',
    example: '- [x] Hecho\n- [ ] Pendiente',
    explanation: '- [x] completada, - [ ] pendiente.'
  },
  blockquote: {
    id: 'blockquote',
    title: 'Cita',
    markdown: '> texto',
    example: '> Así se cita',
    explanation: 'Antepón > para crear una cita.'
  },
  codeBlock: {
    id: 'codeBlock',
    title: 'Código',
    markdown: '```lenguaje\ncódigo\n```',
    example: '```js\nconsole.log("Hola");\n```',
    explanation: 'Envuelve el código entre ```. Especifica el lenguaje.'
  }
}

export function markdownHintSeen(id: string): boolean {
  return localStorage.getItem(`marknote-hint-${id}`) === 'true'
}

export function markdownHintMarkSeen(id: string): void {
  localStorage.setItem(`marknote-hint-${id}`, 'true')
}
