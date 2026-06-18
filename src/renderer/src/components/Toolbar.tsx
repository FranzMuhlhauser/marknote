import type { Editor } from '@tiptap/core'
import { useCallback } from 'react'

interface ToolbarProps {
  editor: Editor | null
}

export function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null

  const addTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  const addMathInline = useCallback(() => {
    editor.chain().focus().insertContent({
      type: 'mathInline',
      attrs: { tex: 'E = mc^2' }
    }).run()
  }, [editor])

  const addMathBlock = useCallback(() => {
    editor.chain().focus().insertContent({
      type: 'mathBlock',
      attrs: { tex: '' }
    }).run()
  }, [editor])

  const addMermaid = useCallback(() => {
    editor.chain().focus().insertContent({
      type: 'mermaidBlock',
      attrs: { code: '' }
    }).run()
  }, [editor])

  const setLink = useCallback(() => {
    const url = window.prompt('URL:')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }, [editor])

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleBold().run()} data-active={editor.isActive('bold')} title="Bold (Ctrl+B)"><strong>B</strong></button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleItalic().run()} data-active={editor.isActive('italic')} title="Italic (Ctrl+I)"><em>I</em></button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleUnderline().run()} data-active={editor.isActive('underline')} title="Underline (Ctrl+U)"><u>U</u></button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleStrike().run()} data-active={editor.isActive('strike')} title="Strikethrough"><s>S</s></button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleHighlight().run()} data-active={editor.isActive('highlight')} title="Highlight">=</button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} data-active={editor.isActive('heading', { level: 1 })} title="Heading 1">H1</button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} data-active={editor.isActive('heading', { level: 2 })} title="Heading 2">H2</button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} data-active={editor.isActive('heading', { level: 3 })} title="Heading 3">H3</button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleBulletList().run()} data-active={editor.isActive('bulletList')} title="Bullet list">•</button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleOrderedList().run()} data-active={editor.isActive('orderedList')} title="Numbered list">1.</button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleTaskList().run()} data-active={editor.isActive('taskList')} title="Task list">☑</button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleBlockquote().run()} data-active={editor.isActive('blockquote')} title="Blockquote">"</button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleCode().run()} data-active={editor.isActive('code')} title="Inline code">&lt;/&gt;</button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleCodeBlock().run()} data-active={editor.isActive('codeBlock')} title="Code block">{'{}'}</button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={addTable} title="Insert table">⊞</button>
        <button className="toolbar-btn" onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal line">—</button>
        <button className="toolbar-btn" onClick={setLink} data-active={editor.isActive('link')} title="Link">🔗</button>
        <button className="toolbar-btn" onClick={addMathInline} title="Inline math">∑</button>
        <button className="toolbar-btn" onClick={addMathBlock} title="Math block">∫</button>
        <button className="toolbar-btn" onClick={addMermaid} title="Mermaid diagram">◈</button>
      </div>
    </div>
  )
}
