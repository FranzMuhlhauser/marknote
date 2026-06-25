import { useCallback, useEffect, useState, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { getExtensions } from './extensions'
import { Toolbar } from './components/Toolbar'
import { MenuBar } from './components/MenuBar'
import { SearchReplace } from './components/SearchReplace'
import { CommandPalette } from './components/CommandPalette'
import { MentorModal } from './components/MentorModal'
import { Outline } from './components/Outline'
import { Stats } from './components/Stats'
import { FileExplorer } from './components/FileExplorer'
import { StatusBar } from './components/StatusBar'
import { TabBar, getTabTitle, type TabInfo } from './components/TabBar'
import { WelcomeScreen } from './components/WelcomeScreen'
import { Settings } from './components/Settings'
import { OnboardingModal } from './components/OnboardingModal'
import { TableContextMenu } from './components/TableContextMenu'
import { TableSizePicker } from './components/TableSizePicker'
import { ConfirmDialog } from './components/ConfirmDialog'
import { mdToHtml, htmlToMd } from './utils/markdown'
import { registerTablePicker } from './utils/tablePicker'
import { parseDelimitedText, insertTableData, showToast } from './utils/tableParser'
import { getCustomWords, addCustomWord } from './utils/customDictionary'
import { exportHtml, exportPdf } from './utils/export'
import { loadTheme, saveTheme, getSystemTheme, resolveTheme, type ThemeId } from './utils/themes'
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

function expandToWord(doc: any, pos: number): { from: number; to: number } | null {
  const from = Math.max(0, pos - 200)
  const to = Math.min(doc.content.size, pos + 200)
  const text = doc.textBetween(from, to)
  const relPos = pos - from

  const before = text.slice(0, relPos)
  const after = text.slice(relPos)

  const wordStartRel = before.match(/[\p{L}\p{M}0-9']*$/u)?.[0].length ?? 0
  const wordEndRel = after.match(/^[\p{L}\p{M}0-9']*/u)?.[0].length ?? 0

  if (wordStartRel === 0 && wordEndRel === 0) return null

  return { from: pos - wordStartRel, to: pos + wordEndRel }
}

let forceClose = false

interface PendingConfirm {
  title: string
  message: string
  buttons: Array<{ label: string; onClick: () => void; className?: string }>
  onCancel: () => void
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
  const [showMentor, setShowMentor] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem('marknote-onboarding-shown') !== 'true')
  const [tableMenuPos, setTableMenuPos] = useState<{ x: number; y: number } | null>(null)
  const [tableBtnPos, setTableBtnPos] = useState<{ x: number; y: number } | null>(null)
  const [tablePickerPos, setTablePickerPos] = useState<{ x: number; y: number } | null>(null)
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null)
  const sourceRef = useRef<HTMLTextAreaElement>(null)
  const switchingTab = useRef(false)
  const tablePickerEditorRef = useRef<any>(null)

  const activeTab = tabs.find(t => t.id === activeTabId) ?? null

  const editor = useEditor({
    extensions: getExtensions(),
    content: '',
    onUpdate: ({ editor: ed }) => {
      if (switchingTab.current || !activeTabId) return
      const md = htmlToMd(ed.getHTML())
      setTabs(prev => prev.map(t =>
        t.id === activeTabId ? { ...t, content: md, modified: t.modified || md !== t.content } : t
      ))
    },
    editorProps: {
      attributes: {
        spellcheck: 'true',
        lang: 'es'
      },
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
      },
      transformPastedHTML: (html) => {
        const looksLikeMarkdown = (text: string): boolean => {
          return /(?:^|\n)\s*(?:#{1,6}\s|[-*]\s|>\s|\[\s?\]|\d+\.\s+\S|\|.+\||\$\$)/m.test(text)
        }
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        const pre = doc.body.querySelector('pre')
        if (!pre) return html
        const code = pre.querySelector('code')
        const el = code?.children.length === 0 ? code :
                   !code && pre.children.length === 0 ? pre : null
        if (!el) return html
        const text = el.textContent || ''
        return looksLikeMarkdown(text) ? mdToHtml(text) : html
      }
    }
  })

  useEffect(() => {
    import('katex').then(k => { (window as any).katex = k.default })
    import('mermaid').then(m => { (window as any).mermaid = m.default })
  }, [])

  useEffect(() => {
    const effective = resolveTheme(theme)
    document.documentElement.setAttribute('data-theme', effective)
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
    const words = getCustomWords()
    if (words.length > 0) {
      window.api.addCustomWords(words)
    }
  }, [])

  useEffect(() => {
    window.api.onSpellcheckReplaceWord((replacement) => {
      if (!editor) return
      const { from, to } = editor.state.selection
      if (from !== to) {
        editor.chain().focus().deleteSelection().insertContent(replacement).run()
        return
      }
      const range = expandToWord(editor.state.doc, from)
      if (!range) return
      editor
        .chain()
        .focus()
        .setTextSelection(range)
        .deleteSelection()
        .insertContent(replacement)
        .run()
    })
    window.api.onSpellcheckAddWord((word) => {
      addCustomWord(word)
    })
  }, [])

  useEffect(() => {
    window.api.onUpdateStatus((status, payload) => {
      setUpdateStatus({ status, ...payload })
    })
  }, [])

  useEffect(() => {
    registerTablePicker((editor, position) => {
      tablePickerEditorRef.current = editor
      setTablePickerPos(position)
    })
    return () => registerTablePicker(null)
  }, [])

  useEffect(() => {
    if (!editor) return
    const handleSelection = () => {
      if (editor.isActive('table')) {
        const tableEl = editor.view.dom.querySelector('table')
        if (tableEl) {
          const rect = tableEl.getBoundingClientRect()
          setTableBtnPos({ x: rect.left + rect.width / 2, y: rect.top - 12 })
        }
      } else {
        setTableBtnPos(null)
      }
    }
    editor.on('selectionUpdate', handleSelection)
    return () => { editor.off('selectionUpdate', handleSelection) }
  }, [editor])

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

  function confirmCloseDocument(tab: TabDoc): Promise<'save' | 'discard' | 'cancel'> {
    return new Promise(resolve => {
      setPendingConfirm({
        title: 'Guardar cambios',
        message: `¿Desea guardar los cambios en "${getTabTitle(tab.filePath)}"?`,
        buttons: [
          { label: 'Guardar', onClick: () => { setPendingConfirm(null); resolve('save') }, className: 'confirm-btn-save' },
          { label: 'No guardar', onClick: () => { setPendingConfirm(null); resolve('discard') }, className: 'confirm-btn-discard' },
          { label: 'Cancelar', onClick: () => { setPendingConfirm(null); resolve('cancel') }, className: 'confirm-btn-cancel' },
        ],
        onCancel: () => { setPendingConfirm(null); resolve('cancel') }
      })
    })
  }

  function confirmCloseMultiple(unsavedTabs: TabDoc[]): Promise<'save' | 'discard' | 'cancel'> {
    return new Promise(resolve => {
      const docList = unsavedTabs.map(t => `• ${getTabTitle(t.filePath)}`).join('\n')
      setPendingConfirm({
        title: 'Guardar cambios',
        message: `Los siguientes documentos tienen cambios sin guardar:\n${docList}`,
        buttons: [
          { label: 'Guardar todo', onClick: () => { setPendingConfirm(null); resolve('save') }, className: 'confirm-btn-save' },
          { label: 'No guardar ninguno', onClick: () => { setPendingConfirm(null); resolve('discard') }, className: 'confirm-btn-discard' },
          { label: 'Cancelar', onClick: () => { setPendingConfirm(null); resolve('cancel') }, className: 'confirm-btn-cancel' },
        ],
        onCancel: () => { setPendingConfirm(null); resolve('cancel') }
      })
    })
  }

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
  const saveUnsavedTab = useCallback(async (tab: TabDoc) => {
    if (tab.id === activeTabId) {
      const text = getMarkdown()
      const path = await window.api.saveFile(tab.filePath ?? undefined, text)
      if (path) {
        setTabs(prev => prev.map(t =>
          t.id === tab.id ? { ...t, filePath: path, content: text, modified: false } : t
        ))
        setSourceText(text)
        addRecent(path)
      }
    } else {
      const text = tab.content
      const path = await window.api.saveFile(tab.filePath ?? undefined, text)
      if (path) {
        setTabs(prev => prev.map(t =>
          t.id === tab.id ? { ...t, filePath: path, content: text, modified: false } : t
        ))
      }
    }
  }, [activeTabId, getMarkdown])

  const openTab = useCallback((tab: TabDoc) => {
    syncEditorToTab()
    setTabs(prev => {
      const exists = prev.find(t => t.id === tab.id)
      return exists ? prev : [...prev, tab]
    })
    setActiveTabId(tab.id)
    loadTabIntoEditor(tab)
  }, [syncEditorToTab, loadTabIntoEditor])

  const newDoc = useCallback(async () => {
    if (activeTab?.modified) {
      syncEditorToTab()
      const result = await confirmCloseDocument(activeTab)
      if (result === 'cancel') return
      if (result === 'save') {
        const text = getMarkdown()
        const path = await window.api.saveFile(activeTab.filePath ?? undefined, text)
        if (!path) return
        setTabs(prev => prev.map(t =>
          t.id === activeTabId ? { ...t, filePath: path, content: text, modified: false } : t
        ))
        setSourceText(text)
        addRecent(path)
      }
    }
    syncEditorToTab()
    const tab = createTab()
    setTabs(prev => [...prev, tab])
    setActiveTabId(tab.id)
    loadTabIntoEditor(tab)
  }, [activeTab, activeTabId, syncEditorToTab, loadTabIntoEditor, getMarkdown])

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
    if (activeTab?.modified) {
      syncEditorToTab()
      const result = await confirmCloseDocument(activeTab)
      if (result === 'cancel') return
      if (result === 'save') {
        const text = getMarkdown()
        const path = await window.api.saveFile(activeTab.filePath ?? undefined, text)
        if (!path) return
        setTabs(prev => prev.map(t =>
          t.id === activeTabId ? { ...t, filePath: path, content: text, modified: false } : t
        ))
        setSourceText(text)
        addRecent(path)
      }
    }
    const result = await window.api.openFile()
    if (!result) return
    loadContent(result.content, result.filePath)
    addRecent(result.filePath)
  }, [activeTab, activeTabId, loadContent, syncEditorToTab, getMarkdown])

  const importCsv = useCallback(async () => {
    if (!editor) return
    const result = await window.api.openCsvFile()
    if (!result) return
    const parsed = parseDelimitedText(result.content)
    if (!parsed) {
      showToast('No se detectó un formato CSV, TSV o delimitado por |.')
      return
    }
    insertTableData(editor, parsed)
    showToast(`Tabla importada desde ${result.filePath.split(/[/\\]/).pop()}`)
  }, [editor])

  const openFileFromExplorer = useCallback(async (path: string) => {
    if (activeTab?.modified) {
      syncEditorToTab()
      const result = await confirmCloseDocument(activeTab)
      if (result === 'cancel') return
      if (result === 'save') {
        const text = getMarkdown()
        const savePath = await window.api.saveFile(activeTab.filePath ?? undefined, text)
        if (!savePath) return
        setTabs(prev => prev.map(t =>
          t.id === activeTabId ? { ...t, filePath: savePath, content: text, modified: false } : t
        ))
        setSourceText(text)
        addRecent(savePath)
      }
    }
    try {
      const content = await window.api.readFile(path)
      loadContent(content, path)
      addRecent(path)
    } catch { /* file not found */ }
  }, [activeTab, activeTabId, loadContent, syncEditorToTab, getMarkdown])

  const openFileFromExplorerRef = useRef(openFileFromExplorer)
  openFileFromExplorerRef.current = openFileFromExplorer

  useEffect(() => {
    const handleStartup = async () => {
      const startupFile = await window.api.getStartupFile()
      if (startupFile) {
        openFileFromExplorerRef.current(startupFile)
      }
    }

    handleStartup()
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


  const toggleSource = useCallback(() => {
    if (!editor) return
    if (!showSource) {
      setSourceText(getMarkdown())
      setShowSource(true)
      setTimeout(() => sourceRef.current?.focus(), 50)
    } else {
      editor.commands.setContent(mdToHtml(sourceText))
      setShowSource(false)
    }
  }, [editor, showSource, getMarkdown, sourceText])

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      if (prev === 'dark') return 'light'
      return 'dark'
    })
  }, [])

  // Listen for system theme changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (theme === 'system') {
        const resolved = getSystemTheme()
        document.documentElement.setAttribute('data-theme', resolved)
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

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

  const closeOthers = useCallback(async (keepId: string) => {
    const keep = tabs.find(t => t.id === keepId)
    if (!keep) return
    syncEditorToTab()
    const toClose = tabs.filter(t => t.id !== keepId && t.modified)
    if (toClose.length > 0) {
      const result = toClose.length === 1
        ? await confirmCloseDocument(toClose[0])
        : await confirmCloseMultiple(toClose)
      if (result === 'cancel') return
      if (result === 'save') {
        for (const t of toClose) {
          await saveUnsavedTab(t)
        }
      }
    }
    setTabs([keep])
    if (activeTabId !== keepId) {
      setActiveTabId(keepId)
      loadTabIntoEditor(keep)
    }
  }, [tabs, activeTabId, syncEditorToTab, loadTabIntoEditor, saveUnsavedTab])

  const closeAll = useCallback(async () => {
    syncEditorToTab()
    const modified = tabs.filter(t => t.modified)
    if (modified.length > 0) {
      const result = modified.length === 1
        ? await confirmCloseDocument(modified[0])
        : await confirmCloseMultiple(modified)
      if (result === 'cancel') return
      if (result === 'save') {
        for (const t of modified) {
          await saveUnsavedTab(t)
        }
      }
    }
    setTabs([])
    setActiveTabId(null)
    setShowWelcome(true)
  }, [tabs, syncEditorToTab, saveUnsavedTab])

  const closeRight = useCallback(async (id: string) => {
    const idx = tabs.findIndex(t => t.id === id)
    if (idx === -1) return
    syncEditorToTab()
    const toClose = tabs.slice(idx + 1).filter(t => t.modified)
    if (toClose.length > 0) {
      const result = toClose.length === 1
        ? await confirmCloseDocument(toClose[0])
        : await confirmCloseMultiple(toClose)
      if (result === 'cancel') return
      if (result === 'save') {
        for (const t of toClose) {
          await saveUnsavedTab(t)
        }
      }
    }
    const keep = tabs.slice(0, idx + 1)
    setTabs(keep)
    const activeIdx = tabs.findIndex(t => t.id === activeTabId)
    if (activeIdx > idx) {
      setActiveTabId(id)
      const tab = tabs.find(t => t.id === id)
      if (tab) loadTabIntoEditor(tab)
    }
  }, [tabs, activeTabId, syncEditorToTab, loadTabIntoEditor, saveUnsavedTab])

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

  const closeTab = useCallback(async (id: string) => {
    const tab = tabs.find(t => t.id === id)
    if (!tab) return
    if (tab.modified) {
      syncEditorToTab()
      const result = await confirmCloseDocument(tab)
      if (result === 'cancel') return
      if (result === 'save') {
        await saveUnsavedTab(tab)
      }
    }
    const next = tabs.filter(t => t.id !== id)
    setTabs(next)
    if (next.length === 0) {
      setActiveTabId(null)
      setShowWelcome(true)
    } else if (id === activeTabId) {
      const idx = tabs.findIndex(t => t.id === id)
      const newActive = next[Math.min(idx, next.length - 1)]
      setActiveTabId(newActive.id)
      loadTabIntoEditor(newActive)
    }
  }, [tabs, activeTabId, editor, syncEditorToTab, loadTabIntoEditor, saveUnsavedTab])

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



  const handleDownloadUpdate = useCallback(() => {
    window.api.startDownloadUpdate()
    setUpdateStatus(s => s ? { ...s, status: 'downloading', percent: 0 } : s)
  }, [])

  const handleInstallUpdate = useCallback(() => {
    window.api.installUpdate()
  }, [])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (forceClose) return
      const unsaved = tabs.filter(t => t.modified)
      if (unsaved.length === 0) return
      e.preventDefault()
      if (unsaved.length === 1) {
        const tab = unsaved[0]
        setPendingConfirm({
          title: 'Salir sin guardar',
          message: `¿Desea guardar los cambios en "${getTabTitle(tab.filePath)}"?`,
          buttons: [
            {
              label: 'Guardar', className: 'confirm-btn-save',
              onClick: async () => {
                setPendingConfirm(null)
                let ok = false
                if (tab.id === activeTabId) {
                  const text = getMarkdown()
                  const path = await window.api.saveFile(tab.filePath ?? undefined, text)
                  if (path) {
                    setTabs(prev => prev.map(t2 =>
                      t2.id === tab.id ? { ...t2, filePath: path, content: text, modified: false } : t2
                    ))
                    setSourceText(text)
                    addRecent(path)
                    ok = true
                  }
                } else {
                  const text = tab.content
                  const path = await window.api.saveFile(tab.filePath ?? undefined, text)
                  if (path) {
                    setTabs(prev => prev.map(t2 =>
                      t2.id === tab.id ? { ...t2, filePath: path, content: text, modified: false } : t2
                    ))
                    ok = true
                  }
                }
                if (ok) { forceClose = true; window.api.quit() }
              }
            },
            {
              label: 'No guardar', className: 'confirm-btn-discard',
              onClick: () => {
                setPendingConfirm(null)
                forceClose = true
                window.api.quit()
              }
            },
            {
              label: 'Cancelar', className: 'confirm-btn-cancel',
              onClick: () => {
                setPendingConfirm(null)
              }
            },
          ],
          onCancel: () => { setPendingConfirm(null) }
        })
      } else {
        setPendingConfirm({
          title: 'Salir sin guardar',
          message: `Los siguientes documentos tienen cambios sin guardar:\n${unsaved.map(t => `• ${getTabTitle(t.filePath)}`).join('\n')}`,
          buttons: [
            {
              label: 'Guardar todo', className: 'confirm-btn-save',
              onClick: async () => {
                setPendingConfirm(null)
                let allOk = true
                for (const t of unsaved) {
                  if (t.id === activeTabId) {
                    const text = getMarkdown()
                    const path = await window.api.saveFile(t.filePath ?? undefined, text)
                    if (path) {
                      setTabs(prev => prev.map(t2 =>
                        t2.id === t.id ? { ...t2, filePath: path, content: text, modified: false } : t2
                      ))
                      setSourceText(text)
                      addRecent(path)
                    } else { allOk = false }
                  } else {
                    const path = await window.api.saveFile(t.filePath ?? undefined, t.content)
                    if (path) {
                      setTabs(prev => prev.map(t2 =>
                        t2.id === t.id ? { ...t2, filePath: path, content: t.content, modified: false } : t2
                      ))
                    } else { allOk = false }
                  }
                }
                if (allOk) { forceClose = true; window.api.quit() }
              }
            },
            {
              label: 'No guardar ninguno', className: 'confirm-btn-discard',
              onClick: () => {
                setPendingConfirm(null)
                forceClose = true
                window.api.quit()
              }
            },
            {
              label: 'Cancelar', className: 'confirm-btn-cancel',
              onClick: () => {
                setPendingConfirm(null)
              }
            },
          ],
          onCancel: () => { setPendingConfirm(null) }
        })
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [tabs, activeTabId, getMarkdown])

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
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
        e.preventDefault(); toggleSource(); return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        // Only toggle sidebar if not focused in the editor (let editor handle bold)
        const pm = document.querySelector('.ProseMirror')
        if (!pm || !pm.contains(document.activeElement)) {
          e.preventDefault(); setShowExplorer(s => !s); return
        }
      }
      if (e.key === 'F11') {
        e.preventDefault(); setFocusMode(f => !f); return
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
        onImportCsv={importCsv}
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
        onSettings={() => setShowSettings(true)}
        onStats={() => setShowStats(s => !s)}
        onCommandPalette={() => setShowPalette(true)}
        onShowOnboarding={() => setShowOnboarding(true)}
        focusMode={focusMode}
        showOutline={showOutline}
      />

      <Toolbar
        editor={editor}
        onNew={newDoc}
        onSave={saveDoc}
        onOpen={openDoc}
        onOpenFolder={openFolder}
        onMentor={() => setShowMentor(true)}
        onToggleSource={toggleSource}
        onToggleFocus={() => setFocusMode(f => !f)}
        onToggleTheme={toggleTheme}
        onToggleExplorer={() => setShowExplorer(s => !s)}
        showSource={showSource}
        focusMode={focusMode}
        theme={theme}
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
        {!focusMode && (
        <aside className={`sidebar sidebar-left ${!showExplorer ? 'collapsed' : ''}`}>
          <FileExplorer
            folder={workspaceFolder}
            currentFile={activeTab?.filePath ?? null}
            onOpenFile={openFileFromExplorer}
            onOpenFolder={openFolder}
            onOpenFileFromDisk={openDoc}
            onNewDoc={newDoc}
            onClose={() => setShowExplorer(s => !s)}
          />
        </aside>
        )}

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
          {tableBtnPos && !tableMenuPos && (
            <div
              className="table-menu-btn"
              style={{ left: tableBtnPos.x, top: tableBtnPos.y }}
              onClick={() => setTableMenuPos({ x: tableBtnPos.x - 12, y: tableBtnPos.y + 28 })}
              title="Operaciones de tabla"
            >
              ⊞
            </div>
          )}
          {tablePickerPos && (
            <TableSizePicker
              position={tablePickerPos}
              onSelect={(rows, cols) => {
                tablePickerEditorRef.current?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
                setTablePickerPos(null)
              }}
              onClose={() => setTablePickerPos(null)}
            />
          )}
        </main>

        {!focusMode && showOutline && (
          <aside className="sidebar sidebar-right">
            <Outline editor={editor} />
          </aside>
        )}

        {!focusMode && showStats && (
          <aside className="sidebar sidebar-right sidebar-stats">
            <Stats editor={editor} />
          </aside>
        )}
      </div>

      <StatusBar editor={editor} modified={activeTab?.modified ?? false} />

      {showPalette && <CommandPalette editor={editor} onClose={() => setShowPalette(false)} />}

      {pendingConfirm && (
        <ConfirmDialog
          title={pendingConfirm.title}
          message={pendingConfirm.message}
          onSave={pendingConfirm.buttons[0].onClick}
          onDiscard={pendingConfirm.buttons[1].onClick}
          onCancel={pendingConfirm.onCancel}
          saveLabel={pendingConfirm.buttons[0].label}
          discardLabel={pendingConfirm.buttons[1].label}
        />
      )}
      {showMentor && <MentorModal onClose={() => setShowMentor(false)} />}
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
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
