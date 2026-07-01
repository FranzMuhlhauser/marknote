import { useCallback, useEffect, useRef } from 'react'
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
import { TabBar } from './components/TabBar'
import { WelcomeScreen } from './components/WelcomeScreen'
import { Settings } from './components/Settings'
import { OnboardingModal } from './components/OnboardingModal'
import { TableContextMenu } from './components/TableContextMenu'
import { TableSizePicker } from './components/TableSizePicker'
import { ConfirmDialog } from './components/ConfirmDialog'
import { mdToHtml, htmlToMd } from './utils/markdown'
import { parseDelimitedText, insertTableData, showToast } from './utils/tableParser'
import { addCustomWord } from './utils/customDictionary'
import { exportHtml, exportPdf } from './utils/export'
import { useEditorState } from './hooks/useEditorState'
import { useTabs } from './hooks/useTabs'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import 'katex/dist/katex.min.css'
import './App.css'

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

function App() {
  const ui = useEditorState()

  const tabs = useTabs({
    showSource: ui.showSource,
    sourceText: ui.sourceText,
    setShowWelcome: ui.setShowWelcome,
    setShowSource: ui.setShowSource,
    setPendingConfirm: ui.setPendingConfirm,
    setSourceText: ui.setSourceText,
    tablePickerEditorRef: ui.tablePickerEditorRef,
  })

  const editor = useEditor({
    extensions: getExtensions(),
    content: '',
    onUpdate: ({ editor: ed }) => {
      if (tabs.switchingTab.current || !tabs.activeTabId) return
      const md = htmlToMd(ed.getHTML())
      tabs.setTabs((prev: any[]) => prev.map((t: any) =>
        t.id === tabs.activeTabId ? { ...t, content: md, modified: t.modified || md !== t.content } : t
      ))
    },
    editorProps: {
      attributes: {
        spellcheck: 'true',
        lang: 'es'
      },
      handleDOMEvents: {
        contextMenu: (view, event) => {
          const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })
          if (!pos) return false
          let foundTable = false
          view.state.doc.nodesBetween(pos.pos - 1, pos.pos + 1, (n) => {
            if (n.type.name === 'table') foundTable = true
          })
          if (foundTable) {
            event.preventDefault()
            ui.setTableMenuPos({ x: event.clientX, y: event.clientY })
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
          const ext = file.name.split('.').pop()?.toLowerCase()
          if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
            event.preventDefault()
            const reader = new FileReader()
            reader.onload = () => {
              const text = reader.result as string
              const parsed = parseDelimitedText(text)
              if (!parsed) {
                showToast('No se detectó un formato CSV, TSV o delimitado por |.')
                return
              }
              insertTableData(editor, parsed)
              showToast(`Tabla importada desde ${file.name}`)
            }
            reader.readAsText(file)
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

  // Wire editor ref to useTabs once editor is created
  useEffect(() => {
    tabs.setEditorRef(editor)
  }, [editor])

  useEffect(() => {
    window.api.onSpellcheckReplaceWord((replacement: string) => {
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
    window.api.onSpellcheckAddWord((word: string) => {
      addCustomWord(word)
    })
  }, [])

  useEffect(() => {
    if (!editor) return
    const handleSelection = () => {
      if (editor.isActive('table')) {
        const tableEl = editor.view.dom.querySelector('table')
        if (tableEl) {
          const rect = tableEl.getBoundingClientRect()
          ui.setTableBtnPos({ x: rect.left + rect.width / 2, y: rect.top - 12 })
        }
      } else {
        ui.setTableBtnPos(null)
      }
    }
    editor.on('selectionUpdate', handleSelection)
    return () => { editor.off('selectionUpdate', handleSelection) }
  }, [editor])

  // Startup file handling (uses ref to always have latest callback)
  const openFileFromExplorerRef = useRef(tabs.openFileFromExplorer)
  openFileFromExplorerRef.current = tabs.openFileFromExplorer

  useEffect(() => {
    const handleStartup = async () => {
      const startupFile = await window.api.getStartupFile()
      if (startupFile) {
        openFileFromExplorerRef.current(startupFile)
      }
    }
    handleStartup()
    window.api.onOpenFile((filePath: string) => {
      openFileFromExplorerRef.current(filePath)
    })
  }, [])

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

  const handleExportHtml = useCallback(async () => {
    if (!editor) return
    const title = tabs.activeTab?.filePath?.split('\\').pop()?.split('/').pop() || 'untitled'
    await exportHtml(editor.getHTML(), title)
  }, [editor, tabs.activeTab])

  const handleExportPdf = useCallback(async () => {
    if (!editor) return
    const title = tabs.activeTab?.filePath?.split('\\').pop()?.split('/').pop() || 'untitled'
    const el = document.querySelector('.ProseMirror') as HTMLElement
    if (el) await exportPdf(el, title)
  }, [editor, tabs.activeTab])

  const handleDownloadUpdate = useCallback(() => {
    window.api.startDownloadUpdate()
    ui.setUpdateStatus((s: any) => s ? { ...s, status: 'downloading', percent: 0 } : s)
  }, [])

  const handleInstallUpdate = useCallback(() => {
    window.api.installUpdate()
  }, [])

  const openFolder = useCallback(async () => {
    const folder = await window.api.openFolder()
    if (!folder) return
    ui.setWorkspaceFolder(folder)
    ui.setShowExplorer(true)
  }, [])

  const toggleSource = useCallback(() => {
    if (!editor) return
    if (!ui.showSource) {
      ui.setSourceText(tabs.getMarkdown())
      ui.setShowSource(true)
      setTimeout(() => ui.sourceRef.current?.focus(), 50)
    } else {
      editor.commands.setContent(mdToHtml(ui.sourceText))
      ui.setShowSource(false)
    }
  }, [editor, ui.showSource, ui.sourceText, tabs.getMarkdown])

  const toggleTheme = useCallback(() => {
    ui.setTheme((prev: any) => {
      if (prev === 'dark') return 'light'
      return 'dark'
    })
  }, [])

  useKeyboardShortcuts({
    saveDoc: tabs.saveDoc,
    saveAsDoc: tabs.saveAsDoc,
    openDoc: tabs.openDoc,
    openFolder,
    newDoc: tabs.newDoc,
    closeTab: tabs.closeTab,
    selectTab: tabs.selectTab,
    toggleSource,
    activeTabId: tabs.activeTabId,
    tabs: tabs.tabs,
    tabsModified: tabs.tabs,
    showSource: ui.showSource,
    getMarkdown: tabs.getMarkdown,
    setShowSearch: ui.setShowSearch,
    setSearchMode: ui.setSearchMode,
    setShowPalette: ui.setShowPalette,
    setShowExplorer: ui.setShowExplorer,
    setFocusMode: ui.setFocusMode,
    setShowSettings: ui.setShowSettings,
    setTableMenuPos: ui.setTableMenuPos,
    setTablePickerPos: ui.setTablePickerPos,
    setShowWelcome: ui.setShowWelcome,
    setTabs: tabs.setTabs,
    setSourceText: ui.setSourceText,
    setPendingConfirm: ui.setPendingConfirm,
    setActiveTabId: tabs.setActiveTabId,
    activeTab: tabs.activeTab,
  })

  return (
    <div className={`app ${ui.focusMode ? 'focus-mode' : ''}`}>
      <MenuBar
        title={tabs.title}
        modified={tabs.activeTab?.modified ?? false}
        updateStatus={ui.updateStatus}
        onDownloadUpdate={handleDownloadUpdate}
        onInstallUpdate={handleInstallUpdate}
        onNew={tabs.newDoc}
        onOpen={tabs.openDoc}
        onImportCsv={importCsv}
        onSave={tabs.saveDoc}
        onSaveAs={tabs.saveAsDoc}
        onExportHtml={handleExportHtml}
        onExportPdf={handleExportPdf}
        onQuit={() => window.api.quit()}
        onUndo={() => editor?.chain().focus().undo().run()}
        onRedo={() => editor?.chain().focus().redo().run()}
        onCut={() => document.execCommand('cut')}
        onCopy={() => document.execCommand('copy')}
        onPaste={() => document.execCommand('paste')}
        onSearch={() => ui.setShowSearch(true)}
        onThemeLight={() => ui.setTheme('light')}
        onThemeDark={() => ui.setTheme('dark')}
        onFocusMode={() => ui.setFocusMode((f: any) => !f)}
        onFullscreen={() => window.api.toggleFullscreen()}
        onToggleOutline={() => ui.setShowOutline((o: any) => !o)}
        onSettings={() => ui.setShowSettings(true)}
        onStats={() => ui.setShowStats((s: any) => !s)}
        onCommandPalette={() => ui.setShowPalette(true)}
        onShowOnboarding={() => ui.setShowOnboarding(true)}
        focusMode={ui.focusMode}
        showOutline={ui.showOutline}
      />

      <Toolbar
        editor={editor}
        onNew={tabs.newDoc}
        onSave={tabs.saveDoc}
        onOpen={tabs.openDoc}
        onOpenFolder={openFolder}
        onMentor={() => ui.setShowMentor(true)}
        onToggleSource={toggleSource}
        onToggleFocus={() => ui.setFocusMode((f: any) => !f)}
        onToggleTheme={toggleTheme}
        onToggleExplorer={() => ui.setShowExplorer((s: any) => !s)}
        showSource={ui.showSource}
        focusMode={ui.focusMode}
        theme={ui.theme}
      />

      <TabBar
        tabs={tabs.tabInfos}
        activeId={tabs.activeTabId ?? ''}
        onSelect={tabs.selectTab}
        onClose={tabs.closeTab}
        onCloseOthers={tabs.closeOthers}
        onCloseAll={tabs.closeAll}
        onCloseRight={tabs.closeRight}
        onCloseSaved={tabs.closeSaved}
        onReorder={tabs.handleReorderTab}
      />

      {ui.showSearch && <SearchReplace editor={editor} onClose={() => ui.setShowSearch(false)} initialFocus={ui.searchMode} />}

      <div className="main-content">
        {!ui.focusMode && (
        <aside className={`sidebar sidebar-left ${!ui.showExplorer ? 'collapsed' : ''}`}>
          <FileExplorer
            folder={ui.workspaceFolder}
            currentFile={tabs.activeTab?.filePath ?? null}
            onOpenFile={tabs.openFileFromExplorer}
            onOpenFolder={openFolder}
            onOpenFileFromDisk={tabs.openDoc}
            onNewDoc={tabs.newDoc}
            onClose={() => ui.setShowExplorer((s: any) => !s)}
          />
        </aside>
        )}

        <main className="editor-container">
          {ui.showWelcome && tabs.tabs.length === 0 ? (
            <WelcomeScreen
              onNew={tabs.newDoc}
              onOpen={tabs.openDoc}
            />
          ) : ui.showSource ? (
            <textarea
              ref={ui.sourceRef}
              className="source-editor"
              value={ui.sourceText}
              onChange={e => {
                ui.setSourceText(e.target.value)
                if (tabs.activeTabId) {
                  tabs.setTabs((prev: any[]) => prev.map((t: any) =>
                    t.id === tabs.activeTabId ? { ...t, content: e.target.value, modified: true } : t
                  ))
                }
              }}
              spellCheck={false}
            />
          ) : (
            <EditorContent editor={editor} />
          )}
          {ui.tableMenuPos && editor && (
            <TableContextMenu
              editor={editor}
              position={ui.tableMenuPos}
              onClose={() => ui.setTableMenuPos(null)}
            />
          )}
          {ui.tableBtnPos && !ui.tableMenuPos && (
            <div
              className="table-menu-btn"
              style={{ left: ui.tableBtnPos.x, top: ui.tableBtnPos.y }}
              onClick={() => ui.setTableMenuPos({ x: ui.tableBtnPos.x - 12, y: ui.tableBtnPos.y + 28 })}
              title="Operaciones de tabla"
            >
              ⊞
            </div>
          )}
          {ui.tablePickerPos && (
            <TableSizePicker
              position={ui.tablePickerPos}
              onSelect={(rows, cols) => {
                ui.tablePickerEditorRef.current?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
                ui.setTablePickerPos(null)
              }}
              onClose={() => ui.setTablePickerPos(null)}
            />
          )}
        </main>

        {!ui.focusMode && ui.showOutline && (
          <aside className="sidebar sidebar-right">
            <Outline editor={editor} />
          </aside>
        )}

        {!ui.focusMode && ui.showStats && (
          <aside className="sidebar sidebar-right sidebar-stats">
            <Stats editor={editor} />
          </aside>
        )}
      </div>

      <StatusBar editor={editor} modified={tabs.activeTab?.modified ?? false} />

      {ui.showPalette && <CommandPalette editor={editor} onClose={() => ui.setShowPalette(false)} />}

      {ui.pendingConfirm && (
        <ConfirmDialog
          title={ui.pendingConfirm.title}
          message={ui.pendingConfirm.message}
          onSave={ui.pendingConfirm.buttons[0].onClick}
          onDiscard={ui.pendingConfirm.buttons[1].onClick}
          onCancel={ui.pendingConfirm.onCancel}
          saveLabel={ui.pendingConfirm.buttons[0].label}
          discardLabel={ui.pendingConfirm.buttons[1].label}
        />
      )}
      {ui.showMentor && <MentorModal onClose={() => ui.setShowMentor(false)} />}
      {ui.showOnboarding && <OnboardingModal onClose={() => ui.setShowOnboarding(false)} />}
      {ui.showSettings && (
        <Settings
          theme={ui.theme}
          fontSize={ui.fontSize}
          onThemeChange={ui.setTheme}
          onFontSizeChange={ui.setFontSize}
          onClose={() => ui.setShowSettings(false)}
        />
      )}
    </div>
  )
}

export default App
