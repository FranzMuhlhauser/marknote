import { useState, useEffect, useCallback } from 'react'

interface FileEntry {
  name: string
  path: string
}

interface FileExplorerProps {
  folder: string
  currentFile: string | null
  onOpenFile: (path: string) => void
  onClose: () => void
}

export function FileExplorer({ folder, currentFile, onOpenFile, onClose }: FileExplorerProps) {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    window.api.listFiles(folder).then(list => {
      setFiles(list)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [folder])

  const folderName = folder.split('\\').pop()?.split('/').pop()

  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <span className="file-explorer-title" title={folder}>{folderName}</span>
        <button className="toolbar-btn" onClick={onClose} title="Close explorer">✕</button>
      </div>
      <div className="file-explorer-list">
        {loading ? (
          <div className="file-explorer-empty">Loading...</div>
        ) : files.length === 0 ? (
          <div className="file-explorer-empty">No .md files found</div>
        ) : (
          files.map(f => (
            <div
              key={f.path}
              className={`file-explorer-item ${f.path === currentFile ? 'active' : ''}`}
              onClick={() => onOpenFile(f.path)}
              title={f.path}
            >
              <span className="file-icon">📄</span>
              <span className="file-name">{f.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
