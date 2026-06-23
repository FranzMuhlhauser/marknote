import { useState, useRef, useEffect, useCallback } from 'react'
import type { Editor } from '@tiptap/core'
import { FORMATTING_HINTS, type ActiveHint } from '../utils/markdownHints'
import { MarkdownHintCard } from './MarkdownHintCard'
import type { ThemeId } from '../utils/themes'

interface ToolbarProps {
  editor: Editor | null
  onNew: () => void
  onOpen: () => void
  onOpenFolder: () => void
  onSave: () => void
  onMentor: () => void
  onToggleSource: () => void
  onToggleFocus: () => void
  onToggleTheme: () => void
  onToggleExplorer: () => void
  showSource: boolean
  focusMode: boolean
  theme: ThemeId
}

const HINT_DELAY = 2000
const HINT_HIDE_DELAY = 2000

interface HintState {
  id: string
  data: ActiveHint
  timer?: ReturnType<typeof setTimeout>
}

export function Toolbar({
  editor, onNew, onOpen, onOpenFolder, onSave, onMentor,
  onToggleSource, onToggleFocus, onToggleTheme, onToggleExplorer,
  showSource, focusMode, theme
}: ToolbarProps) {
  const [hintState, setHintState] = useState<HintState | null>(null)
  const enterTimer = useRef<ReturnType<typeof setTimeout>>()
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>()
  const activeId = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (enterTimer.current) clearTimeout(enterTimer.current)
      if (leaveTimer.current) clearTimeout(leaveTimer.current)
    }
  }, [])

  const hintRect = useRef<DOMRect | null>(null)

  const handleMouseEnter = useCallback((id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    console.log('[DEBUG] handleMouseEnter', id)
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    if (hintState?.id === id) { console.log('[DEBUG] already showing same hint', id); return }

    activeId.current = id
    const hint = FORMATTING_HINTS[id]
    if (!hint) { console.log('[DEBUG] no hint for', id); return }

    hintRect.current = e.currentTarget.getBoundingClientRect()
    console.log('[DEBUG] scheduling hint for', id, 'rect:', hintRect.current)

    enterTimer.current = setTimeout(() => {
      console.log('[DEBUG] timer fired for', id, 'activeId:', activeId.current)
      if (activeId.current !== id) { console.log('[DEBUG] stale timer, skipping'); return }
      console.log('[DEBUG] setting hintState for', id, 'rect:', hintRect.current)
      setHintState({
        id,
        data: { id, type: 'toolbar', data: hint, anchorRect: hintRect.current! }
      })
    }, HINT_DELAY)
  }, [hintState])

  const handleMouseLeave = useCallback(() => {
    console.log('[DEBUG] handleMouseLeave')
    activeId.current = null
    if (enterTimer.current) clearTimeout(enterTimer.current)

    if (hintState) {
      console.log('[DEBUG] scheduling hide')
      leaveTimer.current = setTimeout(() => {
        console.log('[DEBUG] hiding hint')
        setHintState(null)
      }, HINT_HIDE_DELAY)
    }
  }, [hintState])

  const handleFormatClick = useCallback((id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (!editor) return
    if (enterTimer.current) clearTimeout(enterTimer.current)

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
  }, [editor])

  if (!editor) return null

  const themeIcon = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? '🌙' : '☀️'

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={onNew} title="Nuevo (Ctrl+N)">📄</button>
        <button className="toolbar-btn" onClick={onOpen} title="Abrir (Ctrl+O)">📂</button>
        <button className="toolbar-btn" onClick={onOpenFolder} title="Abrir carpeta">📁</button>
        <button className="toolbar-btn" onClick={onSave} title="Guardar (Ctrl+S)">💾</button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={() => editor.chain().focus().undo().run()} title="Deshacer (Ctrl+Z)">↶</button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().redo().run()} title="Rehacer (Ctrl+Y)">↷</button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={(e) => handleFormatClick('h1', e)}
          onMouseEnter={(e) => handleMouseEnter('h1', e)}
          onMouseLeave={handleMouseLeave}
          data-active={editor.isActive('heading', { level: 1 })}
        >H1</button>
        <button
          className="toolbar-btn"
          onClick={(e) => handleFormatClick('h2', e)}
          onMouseEnter={(e) => handleMouseEnter('h2', e)}
          onMouseLeave={handleMouseLeave}
          data-active={editor.isActive('heading', { level: 2 })}
        >H2</button>
        <button
          className="toolbar-btn"
          onClick={(e) => handleFormatClick('h3', e)}
          onMouseEnter={(e) => handleMouseEnter('h3', e)}
          onMouseLeave={handleMouseLeave}
          data-active={editor.isActive('heading', { level: 3 })}
        >H3</button>
        <button
          className="toolbar-btn"
          onClick={(e) => handleFormatClick('bold', e)}
          onMouseEnter={(e) => handleMouseEnter('bold', e)}
          onMouseLeave={handleMouseLeave}
          data-active={editor.isActive('bold')}
        ><strong>B</strong></button>
        <button
          className="toolbar-btn"
          onClick={(e) => handleFormatClick('italic', e)}
          onMouseEnter={(e) => handleMouseEnter('italic', e)}
          onMouseLeave={handleMouseLeave}
          data-active={editor.isActive('italic')}
        ><em>I</em></button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={(e) => handleFormatClick('bulletList', e)}
          onMouseEnter={(e) => handleMouseEnter('bulletList', e)}
          onMouseLeave={handleMouseLeave}
          data-active={editor.isActive('bulletList')}
        >•</button>
        <button
          className="toolbar-btn"
          onClick={(e) => handleFormatClick('taskList', e)}
          onMouseEnter={(e) => handleMouseEnter('taskList', e)}
          onMouseLeave={handleMouseLeave}
          data-active={editor.isActive('taskList')}
        >☑</button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={(e) => handleFormatClick('blockquote', e)}
          onMouseEnter={(e) => handleMouseEnter('blockquote', e)}
          onMouseLeave={handleMouseLeave}
          data-active={editor.isActive('blockquote')}
        >❝</button>
        <button
          className="toolbar-btn"
          onClick={(e) => handleFormatClick('codeBlock', e)}
          onMouseEnter={(e) => handleMouseEnter('codeBlock', e)}
          onMouseLeave={handleMouseLeave}
          data-active={editor.isActive('codeBlock')}
        >{'{}'}</button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={onToggleExplorer}
          title="Explorador (Ctrl+B)"
        >🗂</button>
        <button
          className="toolbar-btn"
          onClick={onToggleSource}
          data-active={showSource}
          title="Ver Markdown (Ctrl+Shift+M)"
        >&lt;&gt;</button>
        <button
          className="toolbar-btn"
          onClick={onToggleFocus}
          data-active={focusMode}
          title="Modo Enfoque (F11)"
        >🎯</button>
        <button
          className="toolbar-btn"
          onClick={onToggleTheme}
          title="Cambiar tema"
        >{themeIcon}</button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={onMentor} title="Mentor Markdown (Ctrl+Shift+P)">🤖</button>
      </div>
      {console.log('[DEBUG] render hintState:', hintState)}
      {hintState && (
        <MarkdownHintCard
          hint={hintState.data.data}
          anchorRect={hintState.data.anchorRect}
          onClose={() => {
            console.log('[DEBUG] hint onClose')
            setHintState(null)
            if (leaveTimer.current) clearTimeout(leaveTimer.current)
          }}
        />
      )}
    </div>
  )
}
