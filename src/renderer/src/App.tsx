import { useCallback, useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { getExtensions } from './extensions'
import { Toolbar } from './components/Toolbar'
import { SearchReplace } from './components/SearchReplace'
import { CommandPalette } from './components/CommandPalette'
import { Outline } from './components/Outline'
import { Stats } from './components/Stats'
import { mdToHtml, htmlToMd, DEFAULT_MD } from './utils/markdown'
import { exportHtml, exportPdf } from './utils/export'
import 'katex/dist/katex.min.css'
import './App.css'

interface DocState {
  filePath: string | null
  raw: string
  modified: boolean
}

function App() {
  const [doc, setDoc] = useState<DocState>({ filePath: null, raw: DEFAULT_MD, modified: false })
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [showSearch, setShowSearch] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const [showOutline, setShowOutline] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const editor = useEditor({
    extensions: getExtensions(),
    content: mdToHtml(doc.raw),
    onUpdate: ({ editor: ed }) => {
      setDoc(prev => prev.modified ? prev : { ...prev, modified: true })
    },
    editorProps: {
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files || [])
        if (files.length === 0) return false
        for (const file of files) {
          if (file.type.startsWith('image/')) {
            event.preventDefault()
            const reader = new FileReader()
            reader.onload = () => {
              const url = reader.result as string
              view.dispatch(view.state.tr.replaceSelectionWith(
                view.state.schema.nodes.image.create({ src: url })
              ))
            }
            reader.readAsDataURL(file)
            return true
          }
        }
        return false
      }
    }
  })

  useEffect(() => {
    const saved = localStorage.getItem('marknote-theme')
    if (saved === 'dark' || saved === 'light') setTheme(saved)
    import('katex').then(k => { (window as any).katex = k.default })
    import('mermaid').then(m => { (window as any).mermaid = m.default })
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('marknote-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.classList.toggle('focus-mode', focusMode)
  }, [focusMode])

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'))

  const getMarkdown = useCallback(() => {
    if (!editor) return ''
    return htmlToMd(editor.getHTML())
  }, [editor])

  const newDoc = useCallback(() => {
    if (!editor) return
    editor.commands.setContent(mdToHtml(DEFAULT_MD))
    setDoc({ filePath: null, raw: DEFAULT_MD, modified: false })
  }, [editor])

  const openDoc = useCallback(async () => {
    if (!editor) return
    const result = await window.api.openFile()
    if (!result) return
    editor.commands.setContent(mdToHtml(result.content))
    setDoc({ filePath: result.filePath, raw: result.content, modified: false })
    const recent = JSON.parse(localStorage.getItem('marknote-recent') || '[]') as string[]
    const next = [result.filePath, ...recent.filter(f => f !== result.filePath)].slice(0, 10)
    localStorage.setItem('marknote-recent', JSON.stringify(next))
  }, [editor])

  const saveDoc = useCallback(async () => {
    if (!editor) return
    const text = getMarkdown()
    const path = await window.api.saveFile(doc.filePath ?? undefined, text)
    if (path) {
      setDoc(prev => ({ ...prev, filePath: path, raw: text, modified: false }))
      const recent = JSON.parse(localStorage.getItem('marknote-recent') || '[]') as string[]
      const next = [path, ...recent.filter(f => f !== path)].slice(0, 10)
      localStorage.setItem('marknote-recent', JSON.stringify(next))
    }
  }, [editor, doc.filePath, getMarkdown])

  useEffect(() => {
    if (!doc.modified) return
    const timer = setTimeout(() => saveDoc(), 30000)
    return () => clearTimeout(timer)
  }, [doc.modified, saveDoc])

  const handleExportHtml = useCallback(async () => {
    if (!editor) return
    const title = doc.filePath?.split('\\').pop()?.split('/').pop() || 'untitled'
    await exportHtml(editor.getHTML(), title)
  }, [editor, doc.filePath])

  const handleExportPdf = useCallback(async () => {
    if (!editor) return
    const title = doc.filePath?.split('\\').pop()?.split('/').pop() || 'untitled'
    const el = document.querySelector('.ProseMirror') as HTMLElement
    if (el) await exportPdf(el, title)
  }, [editor, doc.filePath])

  const insertMermaid = useCallback(() => {
    editor?.chain().focus().insertContent({ type: 'mermaidBlock', attrs: { code: '' } }).run()
  }, [editor])

  const insertMathBlock = useCallback(() => {
    editor?.chain().focus().insertContent({ type: 'mathBlock', attrs: { tex: '' } }).run()
  }, [editor])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault(); setShowPalette(p => !p); return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault(); saveDoc(); return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault(); openDoc(); return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault(); newDoc(); return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault(); setShowSearch(s => !s); return
      }
      if (e.key === 'Escape') {
        setShowSearch(false); setShowPalette(false); setShowMenu(false); return
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [saveDoc, openDoc, newDoc])

  const title = doc.filePath
    ? doc.filePath.split('\\').pop()?.split('/').pop()
    : 'untitled.md'

  const recentFiles = JSON.parse(localStorage.getItem('marknote-recent') || '[]') as string[]

  return (
    <div className={`app ${focusMode ? 'focus-mode' : ''}`}>
      <header className="titlebar">
        <div className="titlebar-drag">
          <span className="titlebar-title">{title}{doc.modified ? ' ●' : ''}</span>
        </div>
        <div className="titlebar-actions">
          <div className="titlebar-menu-container">
            <button className="titlebar-btn" onClick={() => setShowMenu(m => !m)}>Menu</button>
            {showMenu && (
              <div className="titlebar-menu" onMouseLeave={() => setShowMenu(false)}>
                <button onClick={() => { newDoc(); setShowMenu(false) }}>New</button>
                <button onClick={() => { openDoc(); setShowMenu(false) }}>Open</button>
                <button onClick={() => { saveDoc(); setShowMenu(false) }}>Save</button>
                <div className="menu-sep" />
                <button onClick={() => { handleExportHtml(); setShowMenu(false) }}>Export HTML</button>
                <button onClick={() => { handleExportPdf(); setShowMenu(false) }}>Export PDF</button>
                <div className="menu-sep" />
                <button onClick={() => { setShowOutline(o => !o); setShowMenu(false) }}>Outline</button>
                <button onClick={() => { setShowStats(s => !s); setShowMenu(false) }}>Statistics</button>
                <button onClick={() => { setFocusMode(f => !f); setShowMenu(false) }}>{focusMode ? 'Exit Focus' : 'Focus Mode'}</button>
                <div className="menu-sep" />
                <button onClick={() => { insertMermaid(); setShowMenu(false) }}>Mermaid Diagram</button>
                <button onClick={() => { insertMathBlock(); setShowMenu(false) }}>Math Block</button>
                <div className="menu-sep" />
                <button onClick={() => { toggleTheme(); setShowMenu(false) }}>{theme === 'light' ? 'Dark' : 'Light'} Theme</button>
              </div>
            )}
          </div>
          <button className="titlebar-btn" onClick={toggleTheme} title="Toggle theme">{theme === 'light' ? '🌙' : '☀️'}</button>
        </div>
      </header>

      <Toolbar editor={editor} />

      {showSearch && <SearchReplace editor={editor} onClose={() => setShowSearch(false)} />}

      <div className="main-content">
        {showOutline && (
          <aside className="sidebar sidebar-left">
            <Outline editor={editor} />
          </aside>
        )}

        <main className="editor-container">
          <EditorContent editor={editor} />
        </main>

        {showStats && (
          <aside className="sidebar sidebar-right">
            <Stats editor={editor} />
          </aside>
        )}
      </div>

      {showPalette && <CommandPalette editor={editor} onClose={() => setShowPalette(false)} />}
    </div>
  )
}

export default App
