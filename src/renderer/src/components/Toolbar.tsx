import { useState, useRef, useEffect, useCallback } from 'react'
import type { Editor } from '@tiptap/core'
import { FORMATTING_HINTS, markdownHintSeen, type ActiveHint } from '../utils/markdownHints'
import { MarkdownHintCard } from './MarkdownHintCard'

interface ToolbarProps {
  editor: Editor | null
  onNew: () => void
  onOpen: () => void
  onOpenFolder: () => void
  onSave: () => void
  onMentor: () => void
}

export function Toolbar({ editor, onNew, onOpen, onOpenFolder, onSave, onMentor }: ToolbarProps) {
  const [activeHint, setActiveHint] = useState<ActiveHint | null>(null)
  const hintTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    return () => { if (hintTimer.current) clearTimeout(hintTimer.current) }
  }, [])

  const handleFormatClick = useCallback((id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (!editor) return
    if (hintTimer.current) clearTimeout(hintTimer.current)

    switch (id) {
      case 'h1': editor.chain().focus().toggleHeading({ level: 1 }).run(); break
      case 'h2': editor.chain().focus().toggleHeading({ level: 2 }).run(); break
      case 'h3': editor.chain().focus().toggleHeading({ level: 3 }).run(); break
      case 'bold': editor.chain().focus().toggleBold().run(); break
      case 'italic': editor.chain().focus().toggleItalic().run(); break
      case 'bulletList': editor.chain().focus().toggleBulletList().run(); break
      case 'taskList': editor.chain().focus().toggleTaskList().run(); break
      case 'blockquote': editor.chain().focus().toggleBlockquote().run(); break
      case 'codeBlock': editor.chain().focus().toggleCodeBlock().run(); break
    }

    if (markdownHintSeen(id)) return
    const hint = FORMATTING_HINTS[id]
    if (!hint) return

    const rect = e.currentTarget.getBoundingClientRect()
    hintTimer.current = setTimeout(() => {
      setActiveHint({ id, type: 'toolbar', data: hint, anchorRect: rect })
    }, 150)
  }, [editor])

  if (!editor) return null

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={onNew} title="Nuevo (Ctrl+N)">+ Nuevo</button>
        <button className="toolbar-btn" onClick={onOpen} title="Abrir (Ctrl+O)">Abrir</button>
        <button className="toolbar-btn" onClick={onOpenFolder} title="Abrir carpeta">Carpeta</button>
        <button className="toolbar-btn" onClick={onSave} title="Guardar (Ctrl+S)">Guardar</button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={() => editor.chain().focus().undo().run()} title="Deshacer (Ctrl+Z)">Deshacer</button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().redo().run()} title="Rehacer (Ctrl+Y)">Rehacer</button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={(e) => handleFormatClick('h1', e)} data-active={editor.isActive('heading', { level: 1 })} title="Encabezado 1">H1</button>
        <button className="toolbar-btn" onClick={(e) => handleFormatClick('h2', e)} data-active={editor.isActive('heading', { level: 2 })} title="Encabezado 2">H2</button>
        <button className="toolbar-btn" onClick={(e) => handleFormatClick('h3', e)} data-active={editor.isActive('heading', { level: 3 })} title="Encabezado 3">H3</button>
        <button className="toolbar-btn" onClick={(e) => handleFormatClick('bold', e)} data-active={editor.isActive('bold')} title="Negrita (Ctrl+B)">B</button>
        <button className="toolbar-btn" onClick={(e) => handleFormatClick('italic', e)} data-active={editor.isActive('italic')} title="Cursiva (Ctrl+I)">I</button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={(e) => handleFormatClick('bulletList', e)} data-active={editor.isActive('bulletList')} title="Lista">Lista</button>
        <button className="toolbar-btn" onClick={(e) => handleFormatClick('taskList', e)} data-active={editor.isActive('taskList')} title="Lista de tareas">Tareas</button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={(e) => handleFormatClick('blockquote', e)} data-active={editor.isActive('blockquote')} title="Cita">Cita</button>
        <button className="toolbar-btn" onClick={(e) => handleFormatClick('codeBlock', e)} data-active={editor.isActive('codeBlock')} title="Código">Código</button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={onMentor} title="Mentor Markdown (Ctrl+Shift+P)">Mentor</button>
      </div>
      {activeHint && (
        <MarkdownHintCard
          hint={activeHint.data}
          anchorRect={activeHint.anchorRect}
          onClose={() => setActiveHint(null)}
        />
      )}
    </div>
  )
}
