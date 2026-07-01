import { useEffect } from 'react'
import { getTabTitle } from '../components/TabBar'

let forceClose = false

interface UseKeyboardShortcutsParams {
  saveDoc: () => Promise<void>
  saveAsDoc: () => Promise<void>
  openDoc: () => Promise<void>
  openFolder: () => Promise<void>
  newDoc: () => Promise<void>
  closeTab: (id: string) => Promise<void>
  selectTab: (id: string) => void
  toggleSource: () => void
  activeTabId: string | null
  tabs: Array<{ id: string }>
  tabsModified: Array<{ id: string; filePath: string | null; modified: boolean; content: string }>
  showSource: boolean
  getMarkdown: () => string
  setShowSearch: (v: boolean | ((prev: boolean) => boolean)) => void
  setSearchMode: (v: 'search' | 'replace') => void
  setShowPalette: (v: boolean | ((prev: boolean) => boolean)) => void
  setShowExplorer: (v: boolean | ((prev: boolean) => boolean)) => void
  setFocusMode: (v: boolean | ((prev: boolean) => boolean)) => void
  setShowSettings: (v: boolean) => void
  setTableMenuPos: (v: any) => void
  setTablePickerPos: (v: any) => void
  setShowWelcome: (v: boolean) => void
  setTabs: (v: any) => void
  setSourceText: (v: string) => void
  setPendingConfirm: (v: any) => void
  setActiveTabId: (v: any) => void
  activeTab: { id: string; filePath: string | null; content: string; modified: boolean } | null
}

export function useKeyboardShortcuts({
  saveDoc, saveAsDoc, openDoc, openFolder, newDoc,
  closeTab, selectTab, toggleSource,
  activeTabId, tabs, tabsModified,
  showSource, getMarkdown,
  setShowSearch, setSearchMode, setShowPalette,
  setShowExplorer, setFocusMode, setShowSettings,
  setTableMenuPos, setTablePickerPos,
  setShowWelcome, setTabs, setSourceText, setPendingConfirm, setActiveTabId,
  activeTab,
}: UseKeyboardShortcutsParams) {
  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
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
        e.preventDefault(); setSearchMode('search'); setShowSearch(s => !s); return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault(); setSearchMode('replace'); setShowSearch(s => !s); return
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
      if (e.key === 'F9') {
        e.preventDefault(); setShowExplorer(s => !s); return
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
  }, [
    saveDoc, saveAsDoc, openDoc, openFolder, newDoc,
    activeTabId, closeTab, selectTab, tabs, showSource, toggleSource,
    setShowSearch, setSearchMode, setShowPalette,
    setShowExplorer, setFocusMode, setShowSettings,
    setTableMenuPos, setTablePickerPos,
  ])

  // beforeunload handler
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (forceClose) return
      const unsaved = tabsModified.filter(t => t.modified)
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
                    setTabs((prev: any[]) => prev.map((t2: any) =>
                      t2.id === tab.id ? { ...t2, filePath: path, content: text, modified: false } : t2
                    ))
                    setSourceText(text)
                    ok = true
                  }
                } else {
                  const text = tab.content
                  const path = await window.api.saveFile(tab.filePath ?? undefined, text)
                  if (path) {
                    setTabs((prev: any[]) => prev.map((t2: any) =>
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
              onClick: () => { setPendingConfirm(null) }
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
                      setTabs((prev: any[]) => prev.map((t2: any) =>
                        t2.id === t.id ? { ...t2, filePath: path, content: text, modified: false } : t2
                      ))
                      setSourceText(text)
                    } else { allOk = false }
                  } else {
                    const path = await window.api.saveFile(t.filePath ?? undefined, t.content)
                    if (path) {
                      setTabs((prev: any[]) => prev.map((t2: any) =>
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
              onClick: () => { setPendingConfirm(null) }
            },
          ],
          onCancel: () => { setPendingConfirm(null) }
        })
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [tabsModified, activeTabId, getMarkdown, setPendingConfirm, setTabs, setSourceText, setActiveTabId, activeTab])
}
