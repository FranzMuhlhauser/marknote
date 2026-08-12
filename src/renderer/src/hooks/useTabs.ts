import { useState, useCallback, useEffect, useRef } from 'react'
import { htmlToMd, mdToHtml } from '../utils/markdown'
import { getTabTitle, type TabInfo } from '../components/TabBar'
import { showToast } from '../utils/tableParser'

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

interface UseTabsParams {
  showSource: boolean
  sourceText: string
  setShowWelcome: (v: boolean) => void
  setShowSource: (v: boolean) => void
  setPendingConfirm: (v: any) => void
  setSourceText: (v: string) => void
  tablePickerEditorRef: React.MutableRefObject<any>
}

export function useTabs({
  showSource,
  sourceText,
  setShowWelcome,
  setShowSource,
  setPendingConfirm,
  setSourceText,
  tablePickerEditorRef,
}: UseTabsParams) {
  const [tabs, setTabs] = useState<TabDoc[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const switchingTab = useRef(false)
  const editorRef = useRef<any>(null)

  const activeTab = tabs.find(t => t.id === activeTabId) ?? null

  const setEditorRef = useCallback((editor: any) => {
    editorRef.current = editor
  }, [])

  const syncEditorToTab = useCallback(() => {
    const ed = editorRef.current
    if (!ed || !activeTabId) return
    const md = showSource ? sourceText : htmlToMd(ed.getHTML())
    setTabs(prev => prev.map(t =>
      t.id === activeTabId ? { ...t, content: md, modified: t.modified || md !== t.content } : t
    ))
  }, [activeTabId, showSource, sourceText])

  const loadTabIntoEditor = useCallback((tab: TabDoc) => {
    const ed = editorRef.current
    if (!ed) return
    switchingTab.current = true
    const html = mdToHtml(tab.content)
    ed.commands.setContent(html)
    setSourceText(tab.content)
    setShowSource(false)
    setShowWelcome(false)
    setTimeout(() => { switchingTab.current = false }, 50)
  }, [setSourceText, setShowSource, setShowWelcome])

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
    if (showSource) {
      return sourceText
    }
    const ed = editorRef.current
    if (!ed) {
      return ''
    }
    return htmlToMd(ed.getHTML())
  }, [showSource, sourceText])

  // Guarda un tab y solo lo marca como guardado si la escritura tuvo éxito.
  // Devuelve false si el usuario cancela el diálogo o si falla la escritura
  // (el tab permanece modified:true y se informa el error para no perder datos).
  const performSave = useCallback(async (tab: TabDoc, text: string, isActive: boolean): Promise<boolean> => {
    try {
      const result = await window.api.saveFile(tab.filePath ?? undefined, text)
      if (!result) return false
      if (!result.ok) {
        showToast(result.error || 'Error al guardar el archivo')
        return false
      }
      const savedPath = result.path ?? tab.filePath
      setTabs(prev => prev.map(t =>
        t.id === tab.id ? { ...t, filePath: savedPath, content: text, modified: false } : t
      ))
      if (isActive) setSourceText(text)
      if (savedPath) addRecent(savedPath)
      return true
    } catch {
      showToast('Error al guardar el archivo')
      return false
    }
  }, [setSourceText])

  const saveDoc = useCallback(async () => {
    if (!activeTab) return
    const text = getMarkdown()
    await performSave(activeTab, text, true)
  }, [activeTab, getMarkdown, performSave])

  const saveAsDoc = useCallback(async () => {
    if (!activeTab) return
    const text = getMarkdown()
    await performSave(activeTab, text, true)
  }, [activeTab, getMarkdown, performSave])

  const saveUnsavedTab = useCallback(async (tab: TabDoc): Promise<boolean> => {
    if (tab.id === activeTabId) {
      return performSave(tab, getMarkdown(), true)
    }
    return performSave(tab, tab.content, false)
  }, [activeTabId, getMarkdown, performSave])

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
        if (!await performSave(activeTab, getMarkdown(), true)) return
      }
    }
    syncEditorToTab()
    const tab = createTab()
    setTabs(prev => [...prev, tab])
    setActiveTabId(tab.id)
    loadTabIntoEditor(tab)
  }, [activeTab, syncEditorToTab, loadTabIntoEditor, performSave, getMarkdown])

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
        if (!await performSave(activeTab, getMarkdown(), true)) return
      }
    }
    const result = await window.api.openFile()
    if (!result) return
    loadContent(result.content, result.filePath)
    addRecent(result.filePath)
  }, [activeTab, loadContent, syncEditorToTab, performSave, getMarkdown])

  const openFileFromExplorer = useCallback(async (path: string) => {
    if (activeTab?.modified) {
      syncEditorToTab()
      const result = await confirmCloseDocument(activeTab)
      if (result === 'cancel') return
      if (result === 'save') {
        if (!await performSave(activeTab, getMarkdown(), true)) return
      }
    }
    try {
      const content = await window.api.readFile(path)
      loadContent(content, path)
      addRecent(path)
    } catch { /* file not found */ }
  }, [activeTab, loadContent, syncEditorToTab, performSave, getMarkdown])

  const selectTab = useCallback((id: string) => {
    if (id === activeTabId) return
    syncEditorToTab()
    const tab = tabs.find(t => t.id === id)
    if (!tab) return
    setActiveTabId(id)
    loadTabIntoEditor(tab)
  }, [activeTabId, syncEditorToTab, tabs, loadTabIntoEditor])

  const closeTab = useCallback(async (id: string) => {
    const tab = tabs.find(t => t.id === id)
    if (!tab) return
    if (tab.modified) {
      syncEditorToTab()
      const result = await confirmCloseDocument(tab)
      if (result === 'cancel') return
      // Si el guardado falla, la pestaña no se cierra: su contenido solo
      // existe en memoria y cerrarla significaría perderlo.
      if (result === 'save' && !await saveUnsavedTab(tab)) return
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
  }, [tabs, activeTabId, syncEditorToTab, loadTabIntoEditor, saveUnsavedTab, setShowWelcome])

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
          // Si un guardado falla se aborta toda la operación (sin pérdida).
          if (!await saveUnsavedTab(t)) return
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
          // Si un guardado falla se aborta toda la operación (sin pérdida).
          if (!await saveUnsavedTab(t)) return
        }
      }
    }
    setTabs([])
    setActiveTabId(null)
    setShowWelcome(true)
  }, [tabs, syncEditorToTab, saveUnsavedTab, setShowWelcome])

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
          // Si un guardado falla se aborta toda la operación (sin pérdida).
          if (!await saveUnsavedTab(t)) return
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
    const ed = editorRef.current
    const unsaved = tabs.filter(t => t.modified || !t.filePath)
    if (unsaved.length === 0) {
      setTabs([])
      setActiveTabId(null)
      setShowWelcome(true)
      ed?.commands.clearContent()
    } else {
      setTabs(unsaved)
      if (!unsaved.find(t => t.id === activeTabId)) {
        setActiveTabId(unsaved[0].id)
        loadTabIntoEditor(unsaved[0])
      }
    }
  }, [tabs, activeTabId, loadTabIntoEditor, setShowWelcome])

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

  const tabInfos: TabInfo[] = tabs.map(t => ({
    id: t.id,
    filePath: t.filePath,
    title: getTabTitle(t.filePath),
    modified: t.modified
  }))

  const title = activeTab ? getTabTitle(activeTab.filePath) : 'Marknote'

  return {
    tabs,
    activeTabId,
    switchingTab,
    activeTab,
    tabInfos,
    title,
    setTabs,
    setActiveTabId,
    setEditorRef,
    syncEditorToTab,
    loadTabIntoEditor,
    confirmCloseDocument,
    confirmCloseMultiple,
    getMarkdown,
    saveDoc,
    saveAsDoc,
    saveUnsavedTab,
    openTab,
    newDoc,
    loadContent,
    openDoc,
    openFileFromExplorer,
    selectTab,
    closeTab,
    closeOthers,
    closeAll,
    closeRight,
    closeSaved,
    handleReorderTab,
  }
}

export type { TabDoc }
