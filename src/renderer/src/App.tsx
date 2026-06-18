import { useCallback, useEffect, useState, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { getExtensions } from './extensions'
import { Toolbar } from './components/Toolbar'
import { SearchReplace } from './components/SearchReplace'
import { CommandPalette } from './components/CommandPalette'
import { Outline } from './components/Outline'
import { Stats } from './components/Stats'
import { FileExplorer } from './components/FileExplorer'
import { mdToHtml, htmlToMd } from './utils/markdown'
import { exportHtml, exportPdf } from './utils/export'
import 'katex/dist/katex.min.css'
import './App.css'

interface DocState {
  filePath: string | null
  raw: string
  modified: boolean
}

function App() {
  const [doc, setDoc] = useState<DocState>({ filePath: null, raw: '', modified: false })
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [showSearch, setShowSearch] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const [showOutline, setShowOutline] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showExplorer, setShowExplorer] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showSource, setShowSource] = useState(false)
  const [sourceText, setSourceText] = useState('')
  const [workspaceFolder, setWorkspaceFolder] = useState<string | null>(null)
  const [updateInfo, setUpdateInfo] = useState<{ tag: string; url: string } | null>(null)
  const sourceRef = useRef<HTMLTextAreaElement>(null)

  const editor = useEditor({
    extensions: getExtensions(),
    content: mdToHtml(doc.raw),
    onUpdate: () => {
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
    window.api.checkUpdate().then(info => {
      if (info && info.tag !== 'v0.1.1') setUpdateInfo(info)
    })
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('focus-mode', focusMode)
  }, [focusMode])

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'))

  const getMarkdown = useCallback(() => {
    if (!editor) return ''
    return htmlToMd(editor.getHTML())
  }, [editor])

  const loadContent = useCallback((md: string, filePath: string | null) => {
    if (!editor) return
    editor.commands.setContent(mdToHtml(md))
    setDoc({ filePath, raw: md, modified: false })
    setSourceText(md)
  }, [editor])

  const newDoc = useCallback(() => {
    loadContent('', null)
  }, [loadContent])

  const openDoc = useCallback(async () => {
    if (!editor) return
    const result = await window.api.openFile()
    if (!result) return
    loadContent(result.content, result.filePath)
    const recent = JSON.parse(localStorage.getItem('marknote-recent') || '[]') as string[]
    const next = [result.filePath, ...recent.filter(f => f !== result.filePath)].slice(0, 10)
    localStorage.setItem('marknote-recent', JSON.stringify(next))
  }, [editor, loadContent])

  const openFolder = useCallback(async () => {
    const folder = await window.api.openFolder()
    if (!folder) return
    setWorkspaceFolder(folder)
    setShowExplorer(true)
  }, [])

  const openFileFromExplorer = useCallback(async (path: string) => {
    const content = await window.api.readFile(path)
    loadContent(content, path)
    const recent = JSON.parse(localStorage.getItem('marknote-recent') || '[]') as string[]
    const next = [path, ...recent.filter(f => f !== path)].slice(0, 10)
    localStorage.setItem('marknote-recent', JSON.stringify(next))
  }, [loadContent])

  const saveDoc = useCallback(async () => {
    if (!editor) return
    const text = getMarkdown()
    const path = await window.api.saveFile(doc.filePath ?? undefined, text)
    if (path) {
      setDoc(prev => ({ ...prev, filePath: path, raw: text, modified: false }))
      setSourceText(text)
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

  const toggleSource = useCallback(() => {
    if (!editor) return
    if (!showSource) {
      const md = getMarkdown()
      setSourceText(md)
      setShowSource(true)
      setTimeout(() => sourceRef.current?.focus(), 50)
    } else {
      editor.commands.setContent(mdToHtml(sourceText))
      setDoc(prev => ({ ...prev, raw: sourceText, modified: prev.modified || sourceText !== prev.raw }))
      setShowSource(false)
    }
  }, [editor, showSource, getMarkdown, sourceText])

  const handleUpdate = useCallback(() => {
    if (updateInfo) window.api.openUpdateUrl(updateInfo.url)
  }, [updateInfo])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      if (showSource) {
        editor?.commands.setContent(mdToHtml(sourceText))
        setDoc(prev => ({ ...prev, raw: sourceText, modified: true }))
      }
      saveDoc()
    }
  }, [showSource, sourceText, editor, saveDoc])

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
                <button onClick={() => { openDoc(); setShowMenu(false) }}>Open File</button>
                <button onClick={() => { openFolder(); setShowMenu(false) }}>Open Folder</button>
                <button onClick={() => { saveDoc(); setShowMenu(false) }}>Save</button>
                <div className="menu-sep" />
                <button onClick={() => { toggleSource(); setShowMenu(false) }}>{showSource ? 'WYSIWYG View' : 'Source View'}</button>
                <div className="menu-sep" />
                <button onClick={() => { handleExportHtml(); setShowMenu(false) }}>Export HTML</button>
                <button onClick={() => { handleExportPdf(); setShowMenu(false) }}>Export PDF</button>
                <div className="menu-sep" />
                <button onClick={() => { setShowExplorer(e => !e); setShowMenu(false) }}>File Explorer</button>
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
          {updateInfo && (
            <button className="titlebar-btn update-btn" onClick={handleUpdate} title={`Update ${updateInfo.tag} available`}>
              ⬇ {updateInfo.tag}
            </button>
          )}
          <button className="titlebar-btn" onClick={toggleSource} title="Toggle source view">{showSource ? '📝' : '📄'}</button>
          <button className="titlebar-btn" onClick={toggleTheme} title="Toggle theme">{theme === 'light' ? '🌙' : '☀️'}</button>
        </div>
      </header>

      <Toolbar editor={editor} />

      {showSearch && <SearchReplace editor={editor} onClose={() => setShowSearch(false)} />}

      <div className="main-content">
        {showExplorer && workspaceFolder && (
          <aside className="sidebar sidebar-left">
            <FileExplorer
              folder={workspaceFolder}
              currentFile={doc.filePath}
              onOpenFile={openFileFromExplorer}
              onClose={() => setShowExplorer(false)}
            />
          </aside>
        )}

        {showOutline && (
          <aside className="sidebar sidebar-left">
            <Outline editor={editor} />
          </aside>
        )}

        <main className="editor-container">
          {showSource ? (
            <textarea
              ref={sourceRef}
              className="source-editor"
              value={sourceText}
              onChange={e => setSourceText(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
            />
          ) : (
            <EditorContent editor={editor} />
          )}
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
