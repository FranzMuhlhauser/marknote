import type { Editor } from '@tiptap/core'
import { useCallback } from 'react'

interface ToolbarProps {
  editor: Editor | null
  onNew: () => void
  onSave: () => void
  onToggleTheme: () => void
  onFocusMode: () => void
  onToggleSource: () => void
  onSettings: () => void
  focusMode: boolean
  showSource: boolean
}

export function Toolbar({ editor, onNew, onSave, onToggleTheme, onFocusMode, onToggleSource, onSettings, focusMode, showSource }: ToolbarProps) {
  if (!editor) return null

  const addTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  const addMathInline = useCallback(() => {
    editor.chain().focus().insertContent({ type: 'mathInline', attrs: { tex: 'E = mc^2' } }).run()
  }, [editor])

  const addMathBlock = useCallback(() => {
    editor.chain().focus().insertContent({ type: 'mathBlock', attrs: { tex: '' } }).run()
  }, [editor])

  const addMermaid = useCallback(() => {
    editor.chain().focus().insertContent({ type: 'mermaidBlock', attrs: { code: '' } }).run()
  }, [editor])

  const setLink = useCallback(() => {
    const url = window.prompt('URL:')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }, [editor])

  const insertImage = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        editor.chain().focus().setImage({ src: reader.result as string }).run()
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }, [editor])

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={onNew} title="Nuevo (Ctrl+N)">Nuevo</button>
        <button className="toolbar-btn" onClick={onSave} title="Guardar (Ctrl+S)">Guardar</button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={() => editor.chain().focus().undo().run()} title="Deshacer (Ctrl+Z)">↶</button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().redo().run()} title="Rehacer (Ctrl+Y)">↷</button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleBold().run()} data-active={editor.isActive('bold')} title="Negrita (Ctrl+B)"><strong>B</strong></button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleItalic().run()} data-active={editor.isActive('italic')} title="Cursiva (Ctrl+I)"><em>I</em></button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleUnderline().run()} data-active={editor.isActive('underline')} title="Subrayado (Ctrl+U)"><u>U</u></button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleStrike().run()} data-active={editor.isActive('strike')} title="Tachado"><s>S</s></button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} data-active={editor.isActive('heading', { level: 1 })} title="Encabezado 1">H1</button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} data-active={editor.isActive('heading', { level: 2 })} title="Encabezado 2">H2</button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} data-active={editor.isActive('heading', { level: 3 })} title="Encabezado 3">H3</button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleBulletList().run()} data-active={editor.isActive('bulletList')} title="Lista">•</button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleTaskList().run()} data-active={editor.isActive('taskList')} title="Lista de tareas">☑</button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleCodeBlock().run()} data-active={editor.isActive('codeBlock')} title="Código">{'{}'}</button>
        <button className="toolbar-btn" onClick={addTable} title="Tabla">⊞</button>
        <button className="toolbar-btn" onClick={insertImage} title="Imagen">🖼</button>
        <button className="toolbar-btn" onClick={setLink} data-active={editor.isActive('link')} title="Enlace">🔗</button>
        <button className="toolbar-btn" onClick={addMermaid} title="Mermaid">◈</button>
        <button className="toolbar-btn" onClick={addMathBlock} title="LaTeX">∫</button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={onToggleTheme} title="Tema">◐</button>
        <button className="toolbar-btn" onClick={onFocusMode} data-active={focusMode} title="Modo Enfoque">◎</button>
        <button className="toolbar-btn" onClick={onToggleSource} title={showSource ? 'Vista WYSIWYG' : 'Vista fuente'}>{showSource ? '📝' : '📄'}</button>
        <button className="toolbar-btn" onClick={onSettings} title="Configuración">⚙</button>
      </div>
    </div>
  )
}
