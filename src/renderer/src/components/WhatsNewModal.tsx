import React from 'react'
import documentationMd from '../../../../documents/DOCUMENTACION.md?raw'
import { mdToHtml } from '../utils/markdown'

interface WhatsNewModalProps {
  version: string
  onClose: () => void
}

interface ChangelogEntry {
  date: string
  blocks: Array<{ type: 'heading' | 'item'; text: string }>
}

const sectionRe = /^\*\*(Nuevo|Mejoras|Correcciones)\*\*:?\s*(.*)$/

// Extrae del Historial de Versiones de documents/DOCUMENTACION.md la fila de
// la versión actual: celdas [Versión | Fecha | Cambios], con los cambios
// separados por '·' y encabezados de sección **Nuevo**/**Mejoras**/**Correcciones**.
function parseChangelog(raw: string, version: string): ChangelogEntry | null {
  let date = ''
  const items: string[] = []

  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('| v' + version) || !trimmed.endsWith('|')) continue
    const cells = trimmed.split('|').map(c => c.trim())
    if (cells.length < 4) continue
    if (cells[0] !== '' || !cells[1].startsWith('v' + version)) continue
    date = cells[2]
    items.push(...cells.slice(3).join('|').split('·').map(s => s.trim()).filter(Boolean))
  }

  if (items.length === 0) return null

  const blocks: Array<{ type: 'heading' | 'item'; text: string }> = []
  for (const item of items) {
    const m = item.match(sectionRe)
    if (m) {
      blocks.push({ type: 'heading', text: m[1] })
      if (m[2]) blocks.push({ type: 'item', text: m[2] })
    } else {
      blocks.push({ type: 'item', text: item })
    }
  }

  return { date, blocks }
}

export function WhatsNewModal({ version, onClose }: WhatsNewModalProps) {
  const changelog = React.useMemo(() => parseChangelog(documentationMd, version), [version])

  return (
    <div className="whatsnew-overlay">
      <div className="whatsnew-modal">
        <div className="whatsnew-header">
          <button className="whatsnew-close" onClick={onClose} title="Cerrar">✕</button>
        </div>

        <div className="whatsnew-content">
          <div className="whatsnew-icon">🎉</div>
          <h2 className="whatsnew-title">Novedades de la versión {version}</h2>
          {changelog && <p className="whatsnew-date">{changelog.date}</p>}

          {changelog ? (
            <div className="whatsnew-list">
              {changelog.blocks.map((block, i) =>
                block.type === 'heading' ? (
                  <div key={i} className="whatsnew-section">{block.text}</div>
                ) : (
                  <div
                    key={i}
                    className="whatsnew-item"
                    dangerouslySetInnerHTML={{ __html: mdToHtml(block.text) }}
                  />
                )
              )}
            </div>
          ) : (
            <p className="whatsnew-description">
              Consulta el Historial de Versiones en documents/DOCUMENTACION.md para ver los cambios de esta versión.
            </p>
          )}
        </div>

        <div className="whatsnew-actions">
          <button className="whatsnew-btn primary" onClick={onClose}>Entendido</button>
        </div>
      </div>
    </div>
  )
}
