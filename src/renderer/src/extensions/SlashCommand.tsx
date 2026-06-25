import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { PluginKey } from '@tiptap/pm/state'
import { createRoot, Root } from 'react-dom/client'
import { showPrompt } from '../utils/prompt'
import { openTablePicker } from '../utils/tablePicker'

interface CommandItem {
  label: string
  icon: string
  description: string
  command: (editor: any) => void
}

const items: CommandItem[] = [
  { label: 'Tabla', icon: '⊞', description: 'Insertar tabla', command: (e: any) => {
    const coords = e.view.coordsAtPos(e.state.selection.from)
    openTablePicker(e, { x: coords.left, y: coords.bottom + 4 })
  } },
  { label: 'Imagen', icon: '🖼', description: 'Insertar imagen', command: (e: any) => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = () => { const f = i.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => e.chain().focus().setImage({ src: r.result as string }).run(); r.readAsDataURL(f) }; i.click() } },
  { label: 'Video', icon: '🎬', description: 'Insertar video o YouTube', command: async (e: any) => { const u = await showPrompt('URL del video (YouTube o directa):'); if (!u) return; const m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/); e.chain().focus().insertContent({ type: 'videoBlock', attrs: m ? { src: `https://www.youtube.com/embed/${m[1]}`, type: 'youtube' } : { src: u, type: 'url' } }).run() } },
  { label: 'Enlace', icon: '🔗', description: 'Insertar enlace', command: async (e: any) => { const u = await showPrompt('URL:'); if (u) e.chain().focus().setLink({ href: u }).run() } },
  { label: 'Código', icon: '{}', description: 'Insertar bloque de código', command: (e: any) => e.chain().focus().toggleCodeBlock().run() },
  { label: 'Mermaid', icon: '📊', description: 'Insertar diagrama Mermaid', command: (e: any) => e.chain().focus().insertContent({ type: 'mermaidBlock', attrs: { code: '' } }).run() },
  { label: 'Fórmula', icon: '∑', description: 'Insertar fórmula matemática', command: (e: any) => e.chain().focus().insertContent({ type: 'mathBlock', attrs: { tex: '' } }).run() },
  { label: 'Cita', icon: '❝', description: 'Insertar cita en bloque', command: (e: any) => e.chain().focus().toggleBlockquote().run() }
]

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    let selectedIndex = 0

    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        pluginKey: new PluginKey('slash-command'),
        allow: ({ editor }) => {
          return editor.can().toggleBlockquote()
        },
        command: ({ editor, range, props }) => {
          editor.chain().focus().deleteRange(range).run()
          props.command(editor)
        },
        items: ({ query }) => {
          selectedIndex = 0
          return items.filter(i =>
            i.label.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 8)
        },
        render: () => {
          let root: Root | null = null
          let el: HTMLDivElement | null = null

          return {
            onStart: (props) => {
              selectedIndex = 0
              el = document.createElement('div')
              el.className = 'slash-command-wrapper'
              document.body.appendChild(el)
              root = createRoot(el)
              root.render(<Popup {...props} selected={selectedIndex} />)
            },
            onUpdate: (props) => {
              root?.render(<Popup {...props} selected={selectedIndex} />)
            },
            onExit: () => {
              root?.unmount()
              el?.remove()
              root = null
              el = null
            },
            onKeyDown: (props) => {
              const { event } = props
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                const items = props.items || []
                if (items.length) selectedIndex = (selectedIndex + 1) % items.length
                return true
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault()
                const items = props.items || []
                if (items.length) selectedIndex = (selectedIndex - 1 + items.length) % items.length
                return true
              }
              if (event.key === 'Enter') {
                event.preventDefault()
                const items = props.items || []
                if (items[selectedIndex]) {
                  props.command(items[selectedIndex])
                }
                return true
              }
              if (event.key === 'Escape') {
                return false
              }
              selectedIndex = 0
              return false
            }
          }
        }
      })
    ]
  }
})

function Popup({ items: popupItems, command, clientRect, selected }: any) {
  if (!popupItems?.length) return null

  const style: React.CSSProperties = {}
  if (clientRect) {
    const rect = clientRect()
    if (rect) {
      style.position = 'absolute'
      style.top = `${rect.bottom + 4}px`
      style.left = `${Math.min(rect.left, window.innerWidth - 240)}px`
    }
  }

  return (
    <div className="slash-command-popup" style={style}>
      {popupItems.map((item: any, i: number) => (
        <div
          key={i}
          className={`slash-command-item ${i === selected ? 'selected' : ''}`}
          onClick={() => command(item)}
        >
          <span className="slash-command-icon">{item.icon}</span>
          <div className="slash-command-text">
            <span className="slash-command-label">{item.label}</span>
            <span className="slash-command-desc">{item.description}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
