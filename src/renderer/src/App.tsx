import { useCallback, useEffect, useState, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { getExtensions } from './extensions'
import { Toolbar } from './components/Toolbar'
import { MenuBar } from './components/MenuBar'
import { SearchReplace } from './components/SearchReplace'
import { CommandPalette } from './components/CommandPalette'
import { Outline } from './components/Outline'
import { Stats } from './components/Stats'
import { FileExplorer } from './components/FileExplorer'
import { StatusBar } from './components/StatusBar'
import { TabBar, getTabTitle, type TabInfo } from './components/TabBar'
import { WelcomeScreen } from './components/WelcomeScreen'
import { Settings } from './components/Settings'
import { TableContextMenu } from './components/TableContextMenu'
import { TableSizePicker } from './components/TableSizePicker'
import { mdToHtml, htmlToMd } from './utils/markdown'
import { exportHtml, exportPdf } from './utils/export'
import { showPrompt } from './utils/prompt'
import { loadTheme, saveTheme, type ThemeId } from './utils/themes'
import 'katex/dist/katex.min.css'
import './App.css'

interface TabDoc {
  id: string
  filePath: string | null
  content: string
  modified: boolean
}

let tabCounter = 1
function createTab(content = '', filePath: string | null = null): TabDoc {
  return { id: String(tabCounter++), filePath, content, modified: false }
}

function addRecent(path: string) {
  const recent = JSON.parse(localStorage.getItem('marknote-recent') || '[]') as string[]
  localStorage.setItem('marknote-recent', JSON.stringify([path, ...recent.filter(f => f !== path)].slice(0, 10)))
}

function App() {
  const [tabs, setTabs] = useState<TabDoc[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [theme, setTheme] = useState<ThemeId>(loadTheme)
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('marknote-font-size')) || 16)
  const [showSearch, setShowSearch] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const [showOutline, setShowOutline] = useState(true)
  const [showStats, setShowStats] = useState(false)
  const [showExplorer, setShowExplorer] = useState(() => localStorage.getItem('marknote-show-explorer') !== 'false')
  const [focusMode, setFocusMode] = useState(false)
  const [showSource, setShowSource] = useState(false)
  const [sourceText, setSourceText] = useState('')
  const [workspaceFolder, setWorkspaceFolder] = useState<string | null>(null)
  const [updateStatus, setUpdateStatus] = useState<{ status: string; version?: string; percent?: number } | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [tableMenuPos, setTableMenuPos] = useState<{ x: number; y: number } | null>(null)
  const [tablePickerPos, setTablePickerPos] = useState<{ x: number; y: number } | null>(null)
  const sourceRef = useRef<HTMLTextAreaElement>(null)
  const switchingTab = useRef(false)

  const activeTab = tabs.find(t => t.id === activeTabId) ?? null

  const editor = useEditor({
    extensions: getExtensions(),
    content: '',
    onUpdate: ({ editor: ed }) => {
      if (switchingTab.current || !activeTabId) return
      const md = htmlToMd(ed.getHTML())
      setTabs(prev => prev.map(t =>
        t.id === activeTabId ? { ...t, content: md, modified: true } : t
      ))
    },
    editorProps: {
      handleDOMEvents: {
        contextMenu: (view, event) => {
          // Check if right-clicked inside a table
          const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })
          if (!pos) return false
          const node = view.state.doc.nodeAt(pos.pos)
          // Walk up to see if we're in a table
          let foundTable = false
          view.state.doc.nodesBetween(pos.pos - 1, pos.pos + 1, (n) => {
            if (n.type.name === 'table') foundTable = true
          })
          if (foundTable) {
            event.preventDefault()
            setTableMenuPos({ x: event.clientX, y: event.clientY })
            return true
          }
          return false
        }
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files || [])
        if (files.length === 0) return false
        for (const file of files) {
          if (file.type.startsWith('image/')) {
            event.preventDefault()
            const reader = new FileReader()
            reader.onload = () => {
              view.dispatch(view.state.tr.replaceSelectionWith(
                view.state.schema.nodes.image.create({ src: reader.result as string })
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
    import('katex').then(k => { (window as any).katex = k.default })
    import('mermaid').then(m => { (window as any).mermaid = m.default })
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    saveTheme(theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.style.setProperty('--editor-font-size', `${fontSize}px`)
    localStorage.setItem('marknote-font-size', String(fontSize))
  }, [fontSize])

  useEffect(() => {
    localStorage.setItem('marknote-show-explorer', String(showExplorer))
  }, [showExplorer])

  useEffect(() => {
    window.api.onUpdateStatus((status, payload) => {
      setUpdateStatus({ status, ...payload })
    })
  }, [])

  const syncEditorToTab = useCallback(() => {
    if (!editor || !activeTabId) return
    const md = showSource ? sourceText : htmlToMd(editor.getHTML())
    setTabs(prev => prev.map(t =>
      t.id === activeTabId ? { ...t, content: md, modified: t.modified || md !== t.content } : t
    ))
  }, [editor, activeTabId, showSource, sourceText])

  const loadTabIntoEditor = useCallback((tab: TabDoc) => {
    if (!editor) return
    switchingTab.current = true
    editor.commands.setContent(mdToHtml(tab.content))
    setSourceText(tab.content)
    setShowSource(false)
    setShowWelcome(false)
    setTimeout(() => { switchingTab.current = false }, 50)
  }, [editor])

  const openTab = useCallback((tab: TabDoc) => {
    syncEditorToTab()
    setTabs(prev => {
      const exists = prev.find(t => t.id === tab.id)
      return exists ? prev : [...prev, tab]
    })
    setActiveTabId(tab.id)
    loadTabIntoEditor(tab)
  }, [syncEditorToTab, loadTabIntoEditor])

  const newDoc = useCallback(() => {
    syncEditorToTab()
    const tab = createTab()
    setTabs(prev => [...prev, tab])
    setActiveTabId(tab.id)
    loadTabIntoEditor(tab)
  }, [syncEditorToTab, loadTabIntoEditor])

  const loadContent = useCallback((md: string, filePath: string | null) => {
    syncEditorToTab()
    const existing = tabs.find(t => t.filePath === filePath && filePath !== null)
    if (existing) {
      setActiveTabId(existing.id)
      loadTabIntoEditor(existing)
      return
    }
    const tab = createTab(md, filePath)
    setTabs(prev => [...prev, tab])
    setActiveTabId(tab.id)
    loadTabIntoEditor(tab)
  }, [syncEditorToTab, tabs, loadTabIntoEditor])

  const openDoc = useCallback(async () => {
    const result = await window.api.openFile()
    if (!result) return
    loadContent(result.content, result.filePath)
    addRecent(result.filePath)
  }, [loadContent])

  const openFileFromExplorer = useCallback(async (path: string) => {
    try {
      const content = await window.api.readFile(path)
      loadContent(content, path)
      addRecent(path)
    } catch { /* file not found */ }
  }, [loadContent])

  const openFileFromExplorerRef = useRef(openFileFromExplorer)
  openFileFromExplorerRef.current = openFileFromExplorer

  useEffect(() => {
    window.api.onOpenFile((filePath) => {
      openFileFromExplorerRef.current(filePath)
    })
  }, [])

  const openFolder = useCallback(async () => {
    const folder = await window.api.openFolder()
    if (!folder) return
    setWorkspaceFolder(folder)
    setShowExplorer(true)
  }, [])

  const getMarkdown = useCallback(() => {
    if (showSource) return sourceText
    if (!editor) return ''
    return htmlToMd(editor.getHTML())
  }, [editor, showSource, sourceText])

  const saveDoc = useCallback(async () => {
    if (!activeTab) return
    const text = getMarkdown()
    const path = await window.api.saveFile(activeTab.filePath ?? undefined, text)
    if (path) {
      setTabs(prev => prev.map(t =>
        t.id === activeTabId ? { ...t, filePath: path, content: text, modified: false } : t
      ))
      setSourceText(text)
      addRecent(path)
    }
  }, [activeTab, activeTabId, getMarkdown])

  useEffect(() => {
    if (!activeTab?.modified) return
    const timer = setTimeout(() => saveDoc(), 30000)
    return () => clearTimeout(timer)
  }, [activeTab?.modified, saveDoc])

  const saveAsDoc = useCallback(async () => {
    if (!activeTab) return
    const text = getMarkdown()
    const path = await window.api.saveFile(undefined, text)
    if (path) {
      setTabs(prev => prev.map(t =>
        t.id === activeTabId ? { ...t, filePath: path, content: text, modified: false } : t
      ))
      setSourceText(text)
      addRecent(path)
    }
  }, [activeTab, activeTabId, getMarkdown])

  const toggleSource = useCallback(() => {
    if (!editor) return
    if (!showSource) {
      setSourceText(getMarkdown())
      setShowSource(true)
      setTimeout(() => sourceRef.current?.focus(), 50)
    } else {
      editor.commands.setContent(mdToHtml(sourceText))
      setTabs(prev => prev.map(t =>
        t.id === activeTabId ? { ...t, content: sourceText, modified: true } : t
      ))
      setShowSource(false)
    }
  }, [editor, showSource, getMarkdown, sourceText, activeTabId])

  const handleReorderTab = useCallback((dragId: string, targetId: string, position: 'before' | 'after') => {
    setTabs(prev => {
      const dragIdx = prev.findIndex(t => t.id === dragId)
      const targetIdx = prev.findIndex(t => t.id === targetId)
      if (dragIdx === -1 || targetIdx === -1 || dragIdx === targetIdx) return prev

      const tab = prev[dragIdx]
      const next = prev.filter(t => t.id !== dragId)
      const insertAt = targetIdx > dragIdx ? targetIdx - 1 : targetIdx
      const finalPos = position === 'before' ? insertAt : insertAt + 1
      next.splice(finalPos, 0, tab)
      return next
    })
  }, [])

  const selectTab = useCallback((id: string) => {
    if (id === activeTabId) return
    syncEditorToTab()
    const tab = tabs.find(t => t.id === id)
    if (!tab) return
    setActiveTabId(id)
    loadTabIntoEditor(tab)
  }, [activeTabId, syncEditorToTab, tabs, loadTabIntoEditor])

  const closeOthers = useCallback((keepId: string) => {
    const keep = tabs.find(t => t.id === keepId)
    if (!keep) return
    setTabs([keep])
    if (activeTabId !== keepId) {
      setActiveTabId(keepId)
      loadTabIntoEditor(keep)
    }
  }, [tabs, activeTabId, loadTabIntoEditor])

  const closeAll = useCallback(() => {
    syncEditorToTab()
    setTabs([])
    setActiveTabId(null)
    setShowWelcome(true)
    editor?.commands.clearContent()
  }, [syncEditorToTab, editor])

  const closeRight = useCallback((id: string) => {
    const idx = tabs.findIndex(t => t.id === id)
    if (idx === -1) return
    const keep = tabs.slice(0, idx + 1)
    setTabs(keep)
    const activeIdx = tabs.findIndex(t => t.id === activeTabId)
    if (activeIdx > idx) {
      setActiveTabId(id)
      const tab = tabs.find(t => t.id === id)
      if (tab) loadTabIntoEditor(tab)
    }
  }, [tabs, activeTabId, loadTabIntoEditor])

  const closeSaved = useCallback(() => {
    const unsaved = tabs.filter(t => t.modified || !t.filePath)
    if (unsaved.length === 0) {
      setTabs([])
      setActiveTabId(null)
      setShowWelcome(true)
      editor?.commands.clearContent()
    } else {
      setTabs(unsaved)
      if (!unsaved.find(t => t.id === activeTabId)) {
        setActiveTabId(unsaved[0].id)
        loadTabIntoEditor(unsaved[0])
      }
    }
  }, [tabs, activeTabId, editor, loadTabIntoEditor])

  const closeTab = useCallback((id: string) => {
    const next = tabs.filter(t => t.id !== id)
    setTabs(next)
    if (next.length === 0) {
      setActiveTabId(null)
      setShowWelcome(true)
      editor?.commands.clearContent()
    } else if (id === activeTabId) {
      const idx = tabs.findIndex(t => t.id === id)
      const newActive = next[Math.min(idx, next.length - 1)]
      setActiveTabId(newActive.id)
      loadTabIntoEditor(newActive)
    }
  }, [tabs, activeTabId, editor, loadTabIntoEditor])

  const handleExportHtml = useCallback(async () => {
    if (!editor) return
    const title = activeTab?.filePath?.split('\\').pop()?.split('/').pop() || 'untitled'
    await exportHtml(editor.getHTML(), title)
  }, [editor, activeTab])

  const handleExportPdf = useCallback(async () => {
    if (!editor) return
    const title = activeTab?.filePath?.split('\\').pop()?.split('/').pop() || 'untitled'
    const el = document.querySelector('.ProseMirror') as HTMLElement
    if (el) await exportPdf(el, title)
  }, [editor, activeTab])

  const insertMermaid = useCallback(() => {
    editor?.chain().focus().insertContent({ type: 'mermaidBlock', attrs: { code: '' } }).run()
  }, [editor])

  const insertMathBlock = useCallback(() => {
    editor?.chain().focus().insertContent({ type: 'mathBlock', attrs: { tex: '' } }).run()
  }, [editor])

  const insertLink = useCallback(async () => {
    const url = await showPrompt('URL:')
    if (url) editor?.chain().focus().setLink({ href: url }).run()
  }, [editor])

  const insertImage = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => editor?.chain().focus().setImage({ src: reader.result as string }).run()
      reader.readAsDataURL(file)
    }
    input.click()
  }, [editor])

  const insertQuote = useCallback(() => {
    editor?.chain().focus().toggleBlockquote().run()
  }, [editor])

  const [lastTableSize, setLastTableSize] = useState(() => {
    const saved = localStorage.getItem('marknote-table-size')
    if (saved) {
      try { return JSON.parse(saved) as { rows: number; cols: number } } catch { /* ignore */ }
    }
    return { rows: 3, cols: 3 }
  })

  const handleInsertTable = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setTablePickerPos({ x: rect.left, y: rect.bottom + 2 })
  }, [])

  const handleTableSizeSelect = useCallback((rows: number, cols: number) => {
    editor?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
    setLastTableSize({ rows, cols })
    localStorage.setItem('marknote-table-size', JSON.stringify({ rows, cols }))
    setTablePickerPos(null)
  }, [editor])

  const insertVideo = useCallback(async () => {
    const url = await showPrompt('URL del video (YouTube o directa):')
    if (!url) return
    const youtubeRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    const match = url.match(youtubeRegex)
    if (match) {
      editor?.chain().focus().insertContent({ type: 'videoBlock', attrs: { src: `https://www.youtube.com/embed/${match[1]}`, type: 'youtube' } }).run()
    } else {
      editor?.chain().focus().insertContent({ type: 'videoBlock', attrs: { src: url, type: 'url' } }).run()
    }
  }, [editor])

  const handleDownloadUpdate = useCallback(() => {
    window.api.startDownloadUpdate()
    setUpdateStatus(s => s ? { ...s, status: 'downloading', percent: 0 } : s)
  }, [])

  const handleInstallUpdate = useCallback(() => {
    window.api.installUpdate()
  }, [])

  const cycleTheme = useCallback(() => {
    const ids: ThemeId[] = ['light', 'dark', 'nord', 'dracula', 'solarized', 'github']
    setTheme(t => ids[(ids.indexOf(t) + 1) % ids.length])
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault(); setShowPalette(p => !p); return
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault(); saveAsDoc(); return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault(); saveDoc(); return
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'O') {
        e.preventDefault(); openFolder(); return
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
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault(); setShowSearch(s => !s); return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault(); if (activeTabId) closeTab(activeTabId); return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Tab') {
        e.preventDefault()
        const idx = tabs.findIndex(t => t.id === activeTabId)
        if (idx !== -1) {
          const next = e.shiftKey
            ? (idx - 1 + tabs.length) % tabs.length
            : (idx + 1) % tabs.length
          selectTab(tabs[next].id)
        }
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        // Only toggle sidebar if not focused in the editor (let editor handle bold)
        const pm = document.querySelector('.ProseMirror')
        if (!pm || !pm.contains(document.activeElement)) {
          e.preventDefault(); setShowExplorer(s => !s); return
        }
      }
      if (e.key === 'F11') {
        e.preventDefault(); window.api.toggleFullscreen(); return
      }
      if (e.key === 'Escape') {
        if (showSource) { toggleSource(); return }
        setShowSearch(false); setShowPalette(false); setShowSettings(false); setTableMenuPos(null); setTablePickerPos(null); return
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [saveDoc, saveAsDoc, openDoc, openFolder, newDoc, activeTabId, closeTab, selectTab, tabs, showSource, toggleSource])

  const tabInfos: TabInfo[] = tabs.map(t => ({
    id: t.id,
    filePath: t.filePath,
    title: getTabTitle(t.filePath),
    modified: t.modified
  }))

  const title = activeTab ? getTabTitle(activeTab.filePath) : 'Marknote'

  return (
    <div className={`app ${focusMode ? 'focus-mode' : ''}`}>
      <MenuBar
        title={title}
        modified={activeTab?.modified ?? false}
        updateStatus={updateStatus}
        onDownloadUpdate={handleDownloadUpdate}
        onInstallUpdate={handleInstallUpdate}
        onNew={newDoc}
        onOpen={openDoc}
        onSave={saveDoc}
        onSaveAs={saveAsDoc}
        onExportHtml={handleExportHtml}
        onExportPdf={handleExportPdf}
        onQuit={() => window.api.quit()}
        onUndo={() => editor?.chain().focus().undo().run()}
        onRedo={() => editor?.chain().focus().redo().run()}
        onCut={() => document.execCommand('cut')}
        onCopy={() => document.execCommand('copy')}
        onPaste={() => document.execCommand('paste')}
        onSearch={() => setShowSearch(true)}
        onThemeLight={() => setTheme('light')}
        onThemeDark={() => setTheme('dark')}
        onFocusMode={() => setFocusMode(f => !f)}
        onFullscreen={() => window.api.toggleFullscreen()}
        onToggleOutline={() => setShowOutline(o => !o)}
        onInsertTable={handleInsertTable}
        onInsertImage={insertImage}
        onInsertCode={() => editor?.chain().focus().toggleCodeBlock().run()}
        onInsertMermaid={insertMermaid}
        onInsertMath={insertMathBlock}
        onInsertLink={insertLink}
        onInsertQuote={insertQuote}
        onInsertVideo={insertVideo}
        onSettings={() => setShowSettings(true)}
        onStats={() => setShowStats(s => !s)}
        onCommandPalette={() => setShowPalette(true)}
          focusMode={focusMode}
        showOutline={showOutline}
      />

      <Toolbar
        editor={editor}
        onNew={newDoc}
        onSave={saveDoc}
        onToggleTheme={cycleTheme}
        onFocusMode={() => setFocusMode(f => !f)}
        onToggleSource={toggleSource}
        onSettings={() => setShowSettings(true)}
        onToggleExplorer={() => setShowExplorer(s => !s)}
        onInsertTable={handleInsertTable}
        onInsertImage={insertImage}
        onInsertCode={() => editor?.chain().focus().toggleCodeBlock().run()}
        onInsertLink={insertLink}
        onInsertMath={insertMathBlock}
        onInsertVideo={insertVideo}
        focusMode={focusMode}
        showSource={showSource}
        showExplorer={showExplorer}
      />

      <TabBar
        tabs={tabInfos}
        activeId={activeTabId ?? ''}
        onSelect={selectTab}
        onClose={closeTab}
        onCloseOthers={closeOthers}
        onCloseAll={closeAll}
        onCloseRight={closeRight}
        onCloseSaved={closeSaved}
        onReorder={handleReorderTab}
      />

      {showSearch && <SearchReplace editor={editor} onClose={() => setShowSearch(false)} />}

      <div className="main-content">
        <aside className={`sidebar sidebar-left ${focusMode ? 'dimmed' : ''} ${!showExplorer ? 'collapsed' : ''}`}>
          <FileExplorer
            folder={workspaceFolder}
            currentFile={activeTab?.filePath ?? null}
            onOpenFile={openFileFromExplorer}
            onOpenFolder={openFolder}
            onOpenFileFromDisk={openDoc}
            onNewDoc={newDoc}
            onClose={() => setShowExplorer(false)}
          />
        </aside>

        <main className="editor-container">
          {showWelcome && tabs.length === 0 ? (
            <WelcomeScreen
              onNew={newDoc}
              onOpen={openDoc}
            />
          ) : showSource ? (
            <textarea
              ref={sourceRef}
              className="source-editor"
              value={sourceText}
              onChange={e => {
                setSourceText(e.target.value)
                if (activeTabId) {
                  setTabs(prev => prev.map(t =>
                    t.id === activeTabId ? { ...t, content: e.target.value, modified: true } : t
                  ))
                }
              }}
              spellCheck={false}
            />
          ) : (
            <EditorContent editor={editor} />
          )}
          {tableMenuPos && editor && (
            <TableContextMenu
              editor={editor}
              position={tableMenuPos}
              onClose={() => setTableMenuPos(null)}
            />
          )}
          {tablePickerPos && (
            <TableSizePicker
              position={tablePickerPos}
              defaultSize={lastTableSize}
              onSelect={handleTableSizeSelect}
              onClose={() => setTablePickerPos(null)}
            />
          )}
        </main>

        {showOutline && (
          <aside className={`sidebar sidebar-right ${focusMode ? 'dimmed' : ''}`}>
            <Outline editor={editor} />
          </aside>
        )}

        {showStats && (
          <aside className={`sidebar sidebar-right sidebar-stats ${focusMode ? 'dimmed' : ''}`}>
            <Stats editor={editor} />
          </aside>
        )}
      </div>

      <StatusBar editor={editor} modified={activeTab?.modified ?? false} />

      {showPalette && <CommandPalette editor={editor} onClose={() => setShowPalette(false)} />}
      {showSettings && (
        <Settings
          theme={theme}
          fontSize={fontSize}
          onThemeChange={setTheme}
          onFontSizeChange={setFontSize}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

export default App
