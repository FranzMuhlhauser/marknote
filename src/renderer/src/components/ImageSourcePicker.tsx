import { useEffect, useRef } from 'react'
import { pickImageAsDataURL } from '../utils/fileUtils'
import { showPrompt } from '../utils/prompt'

interface ImageSourcePickerProps {
  onInsertImage: (src: string) => void
  onClose: () => void
}

// Diálogo para insertar una imagen con dos fuentes: archivo local (→ data URL)
// o URL de internet. Reutiliza pickImageAsDataURL y showPrompt existentes.
export function ImageSourcePicker({ onInsertImage, onClose }: ImageSourcePickerProps) {
  const fileBtnRef = useRef<HTMLButtonElement>(null)

  // Cierra con Escape (consistente con el resto de la app) y fija el foco inicial
  useEffect(() => {
    fileBtnRef.current?.focus()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])
  const handlePickFile = async () => {
    const src = await pickImageAsDataURL()
    if (src) onInsertImage(src)
  }

  const handlePickUrl = async () => {
    const url = await showPrompt('URL de la imagen (https://...):')
    if (url && url.trim()) onInsertImage(url.trim())
  }

  return (
    <div className="image-alt-input-overlay" onClick={onClose}>
      <div className="image-alt-input-box image-source-box" onClick={e => e.stopPropagation()}>
        <label className="image-alt-label">🖼️ Insertar imagen</label>
        <div className="image-source-actions">
          <button ref={fileBtnRef} className="image-source-btn" onClick={handlePickFile}>
            <span className="image-source-icon">📁</span>
            <span>Buscar en mi PC</span>
          </button>
          <button className="image-source-btn" onClick={handlePickUrl}>
            <span className="image-source-icon">🔗</span>
            <span>Pegar URL de internet</span>
          </button>
        </div>
        <div className="image-alt-actions">
          <button className="toolbar-btn" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}
