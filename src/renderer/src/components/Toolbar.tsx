import type { Editor } from '@tiptap/core'
import {
  FilePlus,
  Save,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListTodo,
  Code,
  Table,
  Image,
  Link,
  Moon,
  Focus,
  FileCode,
  Settings,
  PanelLeft,
  PanelLeftClose
} from 'lucide-react'

const iconProps = { size: 16, strokeWidth: 1.5 }

interface ToolbarProps {
  editor: Editor | null
  onNew: () => void
  onSave: () => void
  onToggleTheme: () => void
  onFocusMode: () => void
  onToggleSource: () => void
  onSettings: () => void
  onToggleExplorer: () => void
  onInsertTable: () => void
  onInsertImage: () => void
  onInsertCode: () => void
  onInsertLink: () => void
  onInsertMath: () => void
  onInsertVideo: () => void
  focusMode: boolean
  showSource: boolean
  showExplorer: boolean
}

export function Toolbar({ editor, onNew, onSave, onToggleTheme, onFocusMode, onToggleSource, onSettings, onToggleExplorer, onInsertTable, onInsertImage, onInsertCode, onInsertLink, onInsertMath, onInsertVideo, focusMode, showSource, showExplorer }: ToolbarProps) {
  if (!editor) return null

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={onNew} title="Nuevo (Ctrl+N)"><FilePlus {...iconProps} /></button>
        <button className="toolbar-btn" onClick={onSave} title="Guardar (Ctrl+S)"><Save {...iconProps} /></button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={() => editor.chain().focus().undo().run()} title="Deshacer (Ctrl+Z)"><Undo2 {...iconProps} /></button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().redo().run()} title="Rehacer (Ctrl+Y)"><Redo2 {...iconProps} /></button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleBold().run()} data-active={editor.isActive('bold')} title="Negrita (Ctrl+B)"><Bold {...iconProps} /></button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleItalic().run()} data-active={editor.isActive('italic')} title="Cursiva (Ctrl+I)"><Italic {...iconProps} /></button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleUnderline().run()} data-active={editor.isActive('underline')} title="Subrayado (Ctrl+U)"><Underline {...iconProps} /></button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleStrike().run()} data-active={editor.isActive('strike')} title="Tachado"><Strikethrough {...iconProps} /></button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} data-active={editor.isActive('heading', { level: 1 })} title="Encabezado 1"><Heading1 {...iconProps} /></button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} data-active={editor.isActive('heading', { level: 2 })} title="Encabezado 2"><Heading2 {...iconProps} /></button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} data-active={editor.isActive('heading', { level: 3 })} title="Encabezado 3"><Heading3 {...iconProps} /></button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleBulletList().run()} data-active={editor.isActive('bulletList')} title="Lista"><List {...iconProps} /></button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleTaskList().run()} data-active={editor.isActive('taskList')} title="Lista de tareas"><ListTodo {...iconProps} /></button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={onInsertCode} data-active={editor.isActive('codeBlock')} title="Código"><Code {...iconProps} /></button>
        <button className="toolbar-btn" onClick={onInsertTable} title="Tabla"><Table {...iconProps} /></button>
        <button className="toolbar-btn" onClick={onInsertImage} title="Imagen"><Image {...iconProps} /></button>
        <button className="toolbar-btn" onClick={onInsertLink} data-active={editor.isActive('link')} title="Enlace"><Link {...iconProps} /></button>
        <button className="toolbar-btn" onClick={onInsertMath} title="Fórmula"><span style={{fontSize:18, lineHeight:1}}>∫</span></button>
        <button className="toolbar-btn" onClick={onInsertVideo} title="Video"><span style={{fontSize:18, lineHeight:1}}>▶</span></button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={onToggleExplorer} data-active={showExplorer} title={showExplorer ? 'Ocultar explorador (Ctrl+B)' : 'Mostrar explorador (Ctrl+B)'}>
          {showExplorer ? <PanelLeftClose {...iconProps} /> : <PanelLeft {...iconProps} />}
        </button>
        <button className="toolbar-btn" onClick={onToggleTheme} title="Tema"><Moon {...iconProps} /></button>
        <button className="toolbar-btn" onClick={onFocusMode} data-active={focusMode} title={focusMode ? 'Salir del modo enfoque' : 'Modo enfoque'}><Focus {...iconProps} /></button>
        <button className="toolbar-btn" onClick={onToggleSource} data-active={showSource} title={showSource ? 'Vista WYSIWYG' : 'Vista fuente'}><FileCode {...iconProps} /></button>
        <button className="toolbar-btn" onClick={onSettings} title="Configuración"><Settings {...iconProps} /></button>
      </div>
    </div>
  )
}
