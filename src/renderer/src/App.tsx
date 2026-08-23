import { useCallback, useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/core'
import type { NodeSelection } from '@tiptap/pm/state'
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
import { WhatsNewModal } from './components/WhatsNewModal'
import { TableContextMenu } from './components/TableContextMenu'
import { TableSizePicker } from './components/TableSizePicker'
import { ConfirmDialog } from './components/ConfirmDialog'
import { mdToHtml, htmlToMd } from './utils/markdown'
import { parseDelimitedText, insertTableData, showToast } from './utils/tableParser'
import { readFileAsDataURL, readFileAsText } from './utils/fileUtils'
import { addCustomWord } from './utils/customDictionary'
import { exportHtml, exportPdf } from './utils/export'
import { useEditorState } from './hooks/useEditorState'
import { ensureMediaNeighbors } from './extensions/blockNeighbors'
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

function looksLikeMarkdown(text: string): boolean {
  return /(?:^|\n)\s*(?:#{1,6}\s|[-*]\s|>\s|\[\s?\]|!\[[^\]]*\]\(|\d+\.\s+\S|\|.+\||\$\$)/m.test(text)
}

// Localiza el elemento DOM de la tabla que contiene la selección actual.
// Cubre TextSelection dentro de una celda y NodeSelection sobre la tabla.
function findActiveTableDom(editor: Editor): HTMLElement | null {
  if (!editor.isActive('table')) return null
  const { selection } = editor.state
  const { $anchor } = selection
  for (let d = $anchor.depth; d >= 0; d--) {
    if ($anchor.node(d).type.name === 'table') {
      return editor.view.nodeDOM($anchor.before(d)) as HTMLElement | null
    }
  }
  const node = (selection as NodeSelection).node
  if (node && node.type.name === 'table') {
    return editor.view.nodeDOM(selection.from) as HTMLElement | null
  }
  return null
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

  // Refs to avoid stale closures in useEditor callbacks
  const activeTabIdRef = useRef<string | null>(null)
  const htmlToMdDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editorContainerRef = useRef<HTMLElement>(null)
  const tableDomRef = useRef<HTMLElement | null>(null)

  const editor = useEditor({
    extensions: getExtensions(),
    content: '',
    onUpdate: ({ editor: ed }) => {
      if (tabs.switchingTab.current || !activeTabIdRef.current) {
        return
      }
      const tabId = activeTabIdRef.current
      // modified se marca de inmediato: el diálogo de "cambios sin guardar"
      // al cerrar pestañas o salir de la app depende de este flag y no puede
      // esperar al debounce (habría una ventana de pérdida de ediciones).
      tabs.setTabs((prev: any[]) => prev.map((t: any) =>
        t.id === tabId ? { ...t, modified: true } : t
      ))
      // htmlToMd (turndown) recorre el documento completo; el snapshot de
      // contenido se difiere hasta que el usuario deje de escribir.
      if (htmlToMdDebounceRef.current) {
        clearTimeout(htmlToMdDebounceRef.current)
      }
      htmlToMdDebounceRef.current = setTimeout(() => {
        htmlToMdDebounceRef.current = null
        // Si cambió de pestaña mientras se esperaba, syncEditorToTab ya
        // capturó el contenido y este snapshot sería de otra pestaña.
        if (activeTabIdRef.current !== tabId) return
        const md = htmlToMd(ed.getHTML())
        tabs.setTabs((prev: any[]) => prev.map((t: any) =>
          t.id === tabId ? { ...t, content: md } : t
        ))
      }, 250)
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
            readFileAsDataURL(file).then(src => {
              // setImage incluye la garantía de párrafos alrededor (ver
              // ensureNeighborParagraphs) para poder escribir arriba/abajo.
              editor?.chain().focus().setImage({ src }).run()
            }, () => {})
            return true
          }
          const ext = file.name.split('.').pop()?.toLowerCase()
          if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
            event.preventDefault()
            readFileAsText(file).then(text => {
              const parsed = parseDelimitedText(text)
              if (!parsed) {
                showToast('No se detectó un formato CSV, TSV o delimitado por |.')
                return
              }
              insertTableData(editor, parsed)
              showToast(`Tabla importada desde ${file.name}`)
            }, () => {})
            return true
          }
        }
        return false
      },
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData('text/plain') ?? ''

        // If pasting inside a code block or inline code, let default behavior handle it literally
        if (editor?.isActive('codeBlock') || editor?.isActive('code')) {
          return false
        }

        // Imágenes pegadas como archivo (capturas de pantalla, copiar desde el
        // explorador): mismo tratamiento que el drag & drop — data URL que se
        // materializa en <doc>.assets al guardar. Si el portapapeles trae HTML
        // no se intercepta: copiar una imagen de la web sigue insertando su URL
        // remota tal como hasta ahora.
        const clipboardFiles = Array.from(event.clipboardData?.files ?? [])
        if (clipboardFiles.length > 0 && !event.clipboardData?.getData('text/html')) {
          const imageFile = clipboardFiles.find(f => f.type.startsWith('image/'))
          if (imageFile) {
            event.preventDefault()
            readFileAsDataURL(imageFile).then(src => {
              editor?.chain().focus().setImage({ src }).run()
            }, () => {})
            return true
          }
        }

        // Imágenes Markdown: se insertan como nodos image directamente, saltando
        // markdown-it/DOMPurify, que eliminan rutas locales C:/ y file:// (las
        // tratan como esquema no permitido). ImageComponent las resuelve a data URL.
        const imgRe = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g
        let imgMatch: RegExpExecArray | null
        let handledImage = false
        while ((imgMatch = imgRe.exec(text))) {
          handledImage = true
          const attrs: { src: string; alt?: string; title?: string } = { src: imgMatch[2], alt: imgMatch[1] }
          if (imgMatch[3]) attrs.title = imgMatch[3]
          // setImage incluye la garantía de párrafos alrededor de la imagen
          editor?.chain().focus().setImage(attrs).run()
        }
        if (handledImage) return true

        if (looksLikeMarkdown(text)) {
          const converted = mdToHtml(text)
          editor?.commands.insertContent(converted)
          return true
        }
        return false
      }
    }
  })

  // Sync activeTabId to ref so onUpdate never captures a stale value
  useEffect(() => {
    activeTabIdRef.current = tabs.activeTabId
  }, [tabs.activeTabId])

  // Cleanup del debounce de onUpdate al desmontar
  useEffect(() => {
    return () => {
      if (htmlToMdDebounceRef.current) {
        clearTimeout(htmlToMdDebounceRef.current)
      }
    }
  }, [])

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
      const tableEl = findActiveTableDom(editor)
      if (!tableEl) {
        tableDomRef.current = null
        ui.setTableBtnPos(null)
        return
      }
      tableDomRef.current = tableEl
      const rect = tableEl.getBoundingClientRect()
      ui.setTableBtnPos({ x: rect.left + rect.width / 2, y: rect.top - 12 })
    }
    handleSelection()
    editor.on('selectionUpdate', handleSelection)
    return () => { editor.off('selectionUpdate', handleSelection) }
  }, [editor])

  // El botón flotante usa coordenadas de viewport; se reposiciona al hacer
  // scroll en el contenedor del editor o redimensionar la ventana.
  useEffect(() => {
    const container = editorContainerRef.current
    if (!container) return
    const reposition = () => {
      const tableEl = tableDomRef.current
      if (!tableEl || !tableEl.isConnected) return
      const rect = tableEl.getBoundingClientRect()
      ui.setTableBtnPos({ x: rect.left + rect.width / 2, y: rect.top - 12 })
    }
    container.addEventListener('scroll', reposition, { passive: true })
    window.addEventListener('resize', reposition)
    return () => {
      container.removeEventListener('scroll', reposition)
      window.removeEventListener('resize', reposition)
    }
  }, [])

  // Startup file handling (uses ref to always have latest callback)
  const openFileFromExplorerRef = useRef(tabs.openFileFromExplorer)
  openFileFromExplorerRef.current = tabs.openFileFromExplorer

  // Novedades de la versión: al actualizar la app se abre el modal con los
  // cambios; en la primera instalación no (el onboarding da la bienvenida).
  useEffect(() => {
    if (!ui.appVersion) return
    const lastSeen = localStorage.getItem('marknote-last-seen-version')
    if (!lastSeen) {
      localStorage.setItem('marknote-last-seen-version', ui.appVersion)
      return
    }
    if (lastSeen !== ui.appVersion) {
      ui.setShowWhatsNew(true)
    }
  }, [ui.appVersion])

  const closeWhatsNew = useCallback(() => {
    if (ui.appVersion) {
      localStorage.setItem('marknote-last-seen-version', ui.appVersion)
    }
    ui.setShowWhatsNew(false)
  }, [ui.appVersion])

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
      const html = mdToHtml(ui.sourceText)

      // Suppress onUpdate during setContent to avoid round-trip feedback loop
      const prevActiveId = activeTabIdRef.current
      activeTabIdRef.current = null
      editor.commands.setContent(html)
      const tr = editor.state.tr
      ensureMediaNeighbors(tr)
      if (tr.docChanged) editor.view.dispatch(tr)
      activeTabIdRef.current = prevActiveId

      // Save the original markdown (not the round-tripped version from onUpdate)
      if (prevActiveId) {
        tabs.setTabs((prev: any[]) => prev.map((t: any) =>
          t.id === prevActiveId ? { ...t, content: ui.sourceText, modified: true } : t
        ))
      }

      ui.setShowSource(false)
    }
  }, [editor, ui.showSource, ui.sourceText, tabs.getMarkdown, tabs.setTabs, tabs.activeTabId, mdToHtml])

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
    saveUnsavedTab: tabs.saveUnsavedTab,
    setShowSearch: ui.setShowSearch,
    setSearchMode: ui.setSearchMode,
    setShowPalette: ui.setShowPalette,
    setShowExplorer: ui.setShowExplorer,
    setFocusMode: ui.setFocusMode,
    setShowSettings: ui.setShowSettings,
    setTableMenuPos: ui.setTableMenuPos,
    setTablePickerPos: ui.setTablePickerPos,
    setPendingConfirm: ui.setPendingConfirm,
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
        onShowWhatsNew={() => ui.setShowWhatsNew(true)}
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
        hasActiveDocument={tabs.tabs.length > 0}
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

        <main className="editor-container" ref={editorContainerRef}>
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
              className="table-float-bar"
              style={{ left: ui.tableBtnPos.x, top: ui.tableBtnPos.y }}
            >
              <div
                className="table-menu-btn"
                onClick={() => ui.setTableMenuPos({ x: (ui.tableBtnPos?.x ?? 0) - 12, y: (ui.tableBtnPos?.y ?? 0) + 28 })}
                title="Operaciones de tabla"
              >
                ⊞
              </div>
              <div className="table-exit-hint">
                <kbd>Shift+Tab</kbd> sale de la tabla
              </div>
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
      {ui.showWhatsNew && ui.appVersion && <WhatsNewModal version={ui.appVersion} onClose={closeWhatsNew} />}
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
