import { useState, useEffect, useRef } from 'react'
import { loadTheme, saveTheme, getSystemTheme, resolveTheme, type ThemeId } from '../utils/themes'
import { getCustomWords } from '../utils/customDictionary'
import { registerTablePicker } from '../utils/tablePicker'

interface PendingConfirm {
  title: string
  message: string
  buttons: Array<{ label: string; onClick: () => void; className?: string }>
  onCancel: () => void
}

export function useEditorState() {
  const [theme, setTheme] = useState<ThemeId>(loadTheme)
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('marknote-font-size')) || 16)
  const [showSearch, setShowSearch] = useState(false)
  const [searchMode, setSearchMode] = useState<'search' | 'replace'>('search')
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
  const tablePickerEditorRef = useRef<any>(null)

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
    window.api.onUpdateStatus((status: string, payload?: any) => {
      setUpdateStatus({ status, ...payload })
    })
  }, [])

  useEffect(() => {
    registerTablePicker((editor: any, position: { x: number; y: number }) => {
      tablePickerEditorRef.current = editor
      setTablePickerPos(position)
    })
    return () => registerTablePicker(null)
  }, [])

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

  return {
    theme, setTheme,
    fontSize, setFontSize,
    showSearch, setShowSearch,
    searchMode, setSearchMode,
    showPalette, setShowPalette,
    showOutline, setShowOutline,
    showStats, setShowStats,
    showExplorer, setShowExplorer,
    focusMode, setFocusMode,
    showSource, setShowSource,
    sourceText, setSourceText,
    workspaceFolder, setWorkspaceFolder,
    updateStatus, setUpdateStatus,
    showSettings, setShowSettings,
    showMentor, setShowMentor,
    showWelcome, setShowWelcome,
    showOnboarding, setShowOnboarding,
    tableMenuPos, setTableMenuPos,
    tableBtnPos, setTableBtnPos,
    tablePickerPos, setTablePickerPos,
    pendingConfirm, setPendingConfirm,
    sourceRef,
    tablePickerEditorRef,
  }
}

export type { PendingConfirm }
