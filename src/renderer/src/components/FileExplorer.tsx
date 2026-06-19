import { useState, useEffect, useCallback, type ReactNode, useRef } from 'react'

interface FileEntry {
  name: string
  path: string
}

interface FileExplorerProps {
  folder: string | null
  currentFile: string | null
  onOpenFile: (path: string) => void
  onOpenFolder: () => void
  onOpenFileFromDisk: () => void
  onNewDoc: () => void
  onClose: () => void
}

function getFavorites(): string[] {
  return JSON.parse(localStorage.getItem('marknote-favorites') || '[]')
}

function getRecent(): string[] {
  return JSON.parse(localStorage.getItem('marknote-recent') || '[]')
}

function getTrash(): string[] {
  return JSON.parse(localStorage.getItem('marknote-trash') || '[]')
}

function toggleFavorite(path: string): void {
  const favs = getFavorites()
  const next = favs.includes(path) ? favs.filter(f => f !== path) : [...favs, path]
  localStorage.setItem('marknote-favorites', JSON.stringify(next))
}

function Section({ title, icon, defaultOpen = true, children }: { title: string; icon: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="explorer-section">
      <button className="explorer-section-header" onClick={() => setOpen(o => !o)}>
        <span>{open ? '▾' : '▸'}</span>
        <span>{icon}</span>
        <span>{title}</span>
      </button>
      {open && <div className="explorer-section-body">{children}</div>}
    </div>
  )
}

function FileItem({ path, currentFile, onOpen, showStar, onRename, onDelete, onDuplicate, onDropFile }: {
  path: string
  currentFile: string | null
  onOpen: (p: string) => void
  showStar?: boolean
  onRename?: (oldPath: string) => void
  onDelete?: (path: string) => void
  onDuplicate?: (path: string) => void
  onDropFile?: (path: string) => void
}) {
  const name = path.split('\\').pop()?.split('/').pop() || path
  const [starred, setStarred] = useState(() => getFavorites().includes(path))
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleStar = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavorite(path)
    setStarred(getFavorites().includes(path))
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowMenu(true)
  }

  useEffect(() => {
    if (!showMenu) return
    const close = () => setShowMenu(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [showMenu])

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', path)
    ;(e.currentTarget as HTMLElement).classList.add('dragging')
  }

  const handleDragEnd = (e: React.DragEvent) => {
    ;(e.currentTarget as HTMLElement).classList.remove('dragging')
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).classList.add('drag-over')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    ;(e.currentTarget as HTMLElement).classList.remove('drag-over')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).classList.remove('drag-over')
    const sourcePath = e.dataTransfer.getData('text/plain')
    if (sourcePath && sourcePath !== path && onDropFile) {
      onDropFile(sourcePath)
    }
  }

  return (
    <div
      className={`file-explorer-item ${path === currentFile ? 'active' : ''}`}
      onClick={() => onOpen(path)}
      title={path}
      onContextMenu={handleContextMenu}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <span className="file-icon">📄</span>
      <span className="file-name">{name}</span>
      {showStar && (
        <button className="file-star" onClick={handleStar} title={starred ? 'Quitar de favoritos' : 'Añadir a favoritos'}>
          {starred ? '★' : '☆'}
        </button>
      )}
      {showMenu && (
        <div ref={menuRef} className="file-context-menu" onClick={e => e.stopPropagation()}>
          {onRename && <button className="file-context-item" onClick={() => { setShowMenu(false); onRename(path) }}>Renombrar</button>}
          {onDuplicate && <button className="file-context-item" onClick={() => { setShowMenu(false); onDuplicate(path) }}>Duplicar</button>}
          {onDelete && <button className="file-context-item danger" onClick={() => { setShowMenu(false); onDelete(path) }}>Eliminar</button>}
        </div>
      )}
    </div>
  )
}

export function FileExplorer({ folder, currentFile, onOpenFile, onOpenFolder, onOpenFileFromDisk, onNewDoc, onClose }: FileExplorerProps) {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [favorites, setFavorites] = useState<string[]>(getFavorites)
  const [recent, setRecent] = useState<string[]>(getRecent)
  const [trash, setTrash] = useState<string[]>(getTrash)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [fileError, setFileError] = useState<string | null>(null)

  const refreshLists = useCallback(() => {
    setFavorites(getFavorites())
    setRecent(getRecent())
    setTrash(getTrash())
  }, [])

  const refreshFiles = useCallback(() => {
    if (!folder) { setFiles([]); return }
    setLoading(true)
    setFileError(null)
    window.api.listFiles(folder).then(list => {
      setFiles(list)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
      setFileError('Error al cargar archivos')
    })
  }, [folder])

  useEffect(() => {
    refreshFiles()
  }, [folder, refreshKey, refreshFiles])

  useEffect(() => {
    const interval = setInterval(refreshLists, 2000)
    return () => clearInterval(interval)
  }, [refreshLists])

  const folderName = folder?.split('\\').pop()?.split('/').pop()

  const handleRename = useCallback(async (oldPath: string) => {
    const name = oldPath.split('\\').pop()?.split('/').pop() || ''
    setRenaming(oldPath)
    setRenameValue(name)
  }, [])

  const handleRenameConfirm = useCallback(async (oldPath: string) => {
    if (!renameValue.trim()) { setRenaming(null); return }
    const base = oldPath.slice(0, oldPath.lastIndexOf('\\'))
    const newPath = `${base}\\${renameValue.trim()}`
    try {
      await window.api.rename(oldPath, newPath)
      onOpenFile(newPath)
    } catch (e) { console.error('Rename error:', e) }
    setRenaming(null)
    setRefreshKey(k => k + 1)
    refreshLists()
  }, [renameValue, onOpenFile, refreshLists])

  const handleDuplicate = useCallback(async (filePath: string) => {
    try {
      const newPath = await window.api.duplicate(filePath)
      setRefreshKey(k => k + 1)
      refreshLists()
    } catch (e) { console.error('Duplicate error:', e) }
  }, [refreshLists])

  const handleDelete = useCallback(async (filePath: string) => {
    if (!confirm(`¿Eliminar ${filePath.split('\\').pop()}?`)) return
    try {
      await window.api.deleteFile(filePath)
      setRefreshKey(k => k + 1)
      refreshLists()
    } catch (e) { console.error('Delete error:', e) }
  }, [refreshLists])

  const handleDropFile = useCallback(async (sourcePath: string) => {
    if (!folder) return
    const name = sourcePath.split('\\').pop() || ''
    const destPath = `${folder}\\${name}`
    if (sourcePath === destPath) return
    try {
      await window.api.moveFile(sourcePath, destPath)
      setRefreshKey(k => k + 1)
      refreshLists()
    } catch (e) { console.error('Move error:', e) }
  }, [folder, refreshLists])

  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <span className="file-explorer-title">{folder ? folderName : 'Explorador'}</span>
        <div className="file-explorer-header-actions">
          <button className="toolbar-btn" onClick={onOpenFolder} title="Abrir carpeta" aria-label="Abrir carpeta">📂</button>
          <button className="toolbar-btn" onClick={onOpenFileFromDisk} title="Abrir archivo" aria-label="Abrir archivo">📄</button>
          <button className="toolbar-btn" onClick={onNewDoc} title="Nuevo documento" aria-label="Nuevo documento">➕</button>
          <button className="toolbar-btn" onClick={onClose} title="Ocultar explorador" aria-label="Ocultar explorador">✕</button>
        </div>
      </div>
      <div className="file-explorer-list">
        <Section title="Favoritos" icon="★">
          {favorites.length === 0 ? (
            <div className="file-explorer-empty">Sin favoritos</div>
          ) : (
            favorites.map(p => (
              <FileItem key={p} path={p} currentFile={currentFile} onOpen={p => { onOpenFile(p); refreshLists() }} showStar
                onRename={handleRename}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onDropFile={handleDropFile}
              />
            ))
          )}
        </Section>

        <Section title="Recientes" icon="🕐">
          {recent.length === 0 ? (
            <div className="file-explorer-empty">Sin recientes</div>
          ) : (
            recent.map(p => (
              <FileItem key={p} path={p} currentFile={currentFile} onOpen={p => { onOpenFile(p); refreshLists() }} showStar
                onRename={handleRename}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onDropFile={handleDropFile}
              />
            ))
          )}
        </Section>

        {folder && (
          <Section title="Proyecto" icon="📂">
            {loading ? (
              <div className="file-explorer-empty">Cargando...</div>
            ) : fileError ? (
              <div className="file-explorer-error">{fileError}</div>
            ) : files.length === 0 ? (
              <div className="file-explorer-empty">No hay archivos .md</div>
            ) : (
              files.map(f => (
                renaming === f.path ? (
                  <div key={f.path} className="file-explorer-item" style={{ cursor: 'default' }}>
                    <span className="file-icon">📄</span>
                    <input
                      className="explorer-inline-input"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleRenameConfirm(f.path); if (e.key === 'Escape') setRenaming(null) }}
                      onBlur={() => handleRenameConfirm(f.path)}
                      autoFocus
                    />
                  </div>
                ) : (
                  <FileItem key={f.path} path={f.path} currentFile={currentFile} onOpen={onOpenFile} showStar
                    onRename={handleRename}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onDropFile={handleDropFile}
                  />
                )
              ))
            )}
          </Section>
        )}

        <Section title="Papelera" icon="🗑" defaultOpen={false}>
          {trash.length === 0 ? (
            <div className="file-explorer-empty">Vacía</div>
          ) : (
            trash.map(p => (
              <FileItem key={p} path={p} currentFile={currentFile} onOpen={onOpenFile} />
            ))
          )}
        </Section>
      </div>
    </div>
  )
}
