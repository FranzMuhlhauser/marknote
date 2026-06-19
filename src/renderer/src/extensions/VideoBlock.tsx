import { Node, mergeAttributes } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { useCallback, useRef, useState, useEffect } from 'react'

const youtubeRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/

function parseVideoUrl(url: string): { type: 'youtube' | 'url'; src: string } {
  const match = url.match(youtubeRegex)
  if (match) {
    return { type: 'youtube', src: `https://www.youtube.com/embed/${match[1]}` }
  }
  return { type: 'url', src: url }
}

export const VideoBlock = Node.create({
  name: 'videoBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: '' },
      type: { default: 'url' },
      width: { default: null },
      height: { default: null },
      align: { default: 'center' }
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-video-block]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-video-block': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoComponent)
  }
})

function VideoComponent({ node, updateAttributes, editor }: any) {
  const [editingSource, setEditingSource] = useState(false)
  const [sourceInput, setSourceInput] = useState(node.attrs.src || '')
  const [editingSize, setEditingSize] = useState(false)
  const [sizeInput, setSizeInput] = useState({ width: node.attrs.width || '', height: node.attrs.height || '' })
  const videoRef = useRef<HTMLVideoElement | HTMLIFrameElement>(null)
  const [resizing, setResizing] = useState<'se' | 'e' | 's' | null>(null)

  const { src, type, width, height, align } = node.attrs

  const setAlignment = useCallback((a: string) => {
    updateAttributes({ align: a })
  }, [updateAttributes])

  const handleSourceSave = useCallback(() => {
    if (!sourceInput.trim()) return
    const parsed = parseVideoUrl(sourceInput.trim())
    updateAttributes({ src: parsed.src, type: parsed.type })
    setEditingSource(false)
  }, [sourceInput, updateAttributes])

  const handleFilePick = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'video/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const url = URL.createObjectURL(file)
      updateAttributes({ src: url, type: 'file' })
    }
    input.click()
  }, [updateAttributes])

  const handleSizeSave = useCallback(() => {
    updateAttributes({
      width: sizeInput.width ? Number(sizeInput.width) : null,
      height: sizeInput.height ? Number(sizeInput.height) : null
    })
    setEditingSize(false)
  }, [sizeInput, updateAttributes])

  // Resize logic
  useEffect(() => {
    if (!resizing) return
    const handleMouseMove = (e: MouseEvent) => {
      const el = videoRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (resizing === 'se') {
        const w = Math.max(100, e.clientX - rect.left)
        const h = Math.max(60, e.clientY - rect.top)
        updateAttributes({ width: w, height: h })
      } else if (resizing === 'e') {
        updateAttributes({ width: Math.max(100, e.clientX - rect.left) })
      } else if (resizing === 's') {
        updateAttributes({ height: Math.max(60, e.clientY - rect.top) })
      }
    }
    const handleMouseUp = () => setResizing(null)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizing, updateAttributes])

  if (!src) {
    return (
      <NodeViewWrapper>
        <div className="video-block-placeholder" contentEditable={false}>
          <span>🎬 Sin video</span>
          <button className="toolbar-btn" onClick={handleFilePick}>Seleccionar archivo</button>
          <button className="toolbar-btn" onClick={() => { setSourceInput(''); setEditingSource(true) }}>Ingresar URL</button>
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper>
    <div
      className={`resizable-image-wrapper align-${align}`}
      contentEditable={false}
    >
      <div className="resizable-image-container">
        {type === 'youtube' ? (
          <iframe
            ref={videoRef as any}
            src={src}
            width={width || undefined}
            height={height || undefined}
            className="video-block-player"
            style={{ aspectRatio: !height && !width ? '16/9' : undefined }}
            allowFullScreen
            title="Video de YouTube"
          />
        ) : (
          <video
            ref={videoRef as any}
            src={src}
            width={width || undefined}
            height={height || undefined}
            className="video-block-player"
            controls
            style={{ maxWidth: '100%' }}
          >
            Tu navegador no soporta video.
          </video>
        )}

        <div className="resize-handle se" onMouseDown={() => setResizing('se')} title="Redimensionar" />
        <div className="resize-handle e" onMouseDown={() => setResizing('e')} />
        <div className="resize-handle s" onMouseDown={() => setResizing('s')} />

        <div className="resizable-image-toolbar">
          <button
            className={`image-toolbar-btn ${align === 'left' ? 'active' : ''}`}
            onClick={() => setAlignment('left')}
            title="Alinear izquierda"
          >⫷</button>
          <button
            className={`image-toolbar-btn ${align === 'center' ? 'active' : ''}`}
            onClick={() => setAlignment('center')}
            title="Alinear centro"
          >⫿</button>
          <button
            className={`image-toolbar-btn ${align === 'right' ? 'active' : ''}`}
            onClick={() => setAlignment('right')}
            title="Alinear derecha"
          >⫸</button>
          <button
            className="image-toolbar-btn"
            onClick={() => {
              setSizeInput({ width: node.attrs.width || '', height: node.attrs.height || '' })
              setEditingSize(true)
            }}
            title="Redimensionar"
          >⤡</button>
          <button
            className="image-toolbar-btn"
            onClick={handleFilePick}
            title="Seleccionar archivo"
          >📁</button>
          <button
            className="image-toolbar-btn"
            onClick={() => { setSourceInput(src); setEditingSource(true) }}
            title="Cambiar URL"
          >🔗</button>
        </div>
      </div>

      {editingSource && (
        <div className="image-alt-input-overlay" onClick={() => handleSourceSave()}>
          <div className="image-alt-input-box" onClick={e => e.stopPropagation()}>
            <label className="image-alt-label">URL del video o de YouTube:</label>
            <input
              className="image-alt-input"
              value={sourceInput}
              onChange={e => setSourceInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSourceSave(); if (e.key === 'Escape') setEditingSource(false) }}
              autoFocus
            />
            <div className="image-alt-actions">
              <button className="toolbar-btn" onClick={handleSourceSave}>Guardar</button>
              <button className="toolbar-btn" onClick={() => setEditingSource(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {editingSize && (
        <div className="image-alt-input-overlay" onClick={() => handleSizeSave()}>
          <div className="image-alt-input-box" onClick={e => e.stopPropagation()}>
            <label className="image-alt-label">Dimensiones:</label>
            <div className="image-size-row">
              <input
                className="image-alt-input"
                type="number"
                placeholder="Ancho"
                value={sizeInput.width}
                onChange={e => setSizeInput(p => ({ ...p, width: e.target.value }))}
              />
              <span>×</span>
              <input
                className="image-alt-input"
                type="number"
                placeholder="Alto"
                value={sizeInput.height}
                onChange={e => setSizeInput(p => ({ ...p, height: e.target.value }))}
              />
            </div>
            <div className="image-alt-actions">
              <button className="toolbar-btn" onClick={handleSizeSave}>Guardar</button>
              <button className="toolbar-btn" onClick={() => setEditingSize(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </NodeViewWrapper>
  )
}
