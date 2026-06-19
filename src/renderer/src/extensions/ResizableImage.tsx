import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { useCallback, useRef, useState, useEffect } from 'react'

export const ResizableImage = Node.create({
  name: 'image',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: '' },
      alt: { default: '' },
      width: { default: null },
      height: { default: null },
      align: { default: 'center' } // left, center, right
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-resizable-image]' }, { tag: 'img' }]
  },

  renderHTML({ HTMLAttributes }) {
    if (HTMLAttributes.src) {
      return ['div', mergeAttributes(HTMLAttributes, { 'data-resizable-image': '' })]
    }
    return ['div', mergeAttributes(HTMLAttributes, { 'data-resizable-image': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageComponent)
  }
})

function ImageComponent({ node, updateAttributes, editor }: any) {
  const [showAltInput, setShowAltInput] = useState(false)
  const [altText, setAltText] = useState(node.attrs.alt || '')
  const [editingSize, setEditingSize] = useState(false)
  const [sizeInput, setSizeInput] = useState({ width: node.attrs.width || '', height: node.attrs.height || '' })
  const imgRef = useRef<HTMLImageElement>(null)
  const [resizing, setResizing] = useState<'se' | 'e' | 's' | null>(null)

  const { src, alt, width, height, align } = node.attrs

  const handleAltSave = useCallback(() => {
    updateAttributes({ alt: altText })
    setShowAltInput(false)
  }, [altText, updateAttributes])

  const handleSizeSave = useCallback(() => {
    updateAttributes({
      width: sizeInput.width ? Number(sizeInput.width) : null,
      height: sizeInput.height ? Number(sizeInput.height) : null
    })
    setEditingSize(false)
  }, [sizeInput, updateAttributes])

  const setAlignment = useCallback((a: string) => {
    updateAttributes({ align: a })
  }, [updateAttributes])

  // Resize logic
  useEffect(() => {
    if (!resizing) return
    const handleMouseMove = (e: MouseEvent) => {
      if (!imgRef.current) return
      const rect = imgRef.current.getBoundingClientRect()
      if (resizing === 'se') {
        const w = Math.max(50, e.clientX - rect.left)
        const h = Math.max(50, e.clientY - rect.top)
        updateAttributes({ width: w, height: h })
      } else if (resizing === 'e') {
        updateAttributes({ width: Math.max(50, e.clientX - rect.left) })
      } else if (resizing === 's') {
        updateAttributes({ height: Math.max(50, e.clientY - rect.top) })
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

  const handleDoubleClick = useCallback(() => {
    setAltText(node.attrs.alt || '')
    setShowAltInput(true)
  }, [node.attrs.alt])

  return (
    <div
      className={`resizable-image-wrapper align-${align}`}
      contentEditable={false}
    >
      <div className="resizable-image-container">
        <img
          ref={imgRef}
          src={src}
          alt={alt || ''}
          width={width || undefined}
          height={height || undefined}
          onDoubleClick={handleDoubleClick}
          className="resizable-image"
          draggable={false}
        />
        {/* Resize handles */}
        <div className="resize-handle se" onMouseDown={() => setResizing('se')} title="Resize" />
        <div className="resize-handle e" onMouseDown={() => setResizing('e')} />
        <div className="resize-handle s" onMouseDown={() => setResizing('s')} />

        {/* Image toolbar */}
        <div className="resizable-image-toolbar">
          <button
            className={`image-toolbar-btn ${align === 'left' ? 'active' : ''}`}
            onClick={() => setAlignment('left')}
            title="Align left"
          >⫷</button>
          <button
            className={`image-toolbar-btn ${align === 'center' ? 'active' : ''}`}
            onClick={() => setAlignment('center')}
            title="Align center"
          >⫿</button>
          <button
            className={`image-toolbar-btn ${align === 'right' ? 'active' : ''}`}
            onClick={() => setAlignment('right')}
            title="Align right"
          >⫸</button>
          <button
            className="image-toolbar-btn"
            onClick={() => {
              setSizeInput({ width: node.attrs.width || '', height: node.attrs.height || '' })
              setEditingSize(true)
            }}
            title="Resize"
          >⤡</button>
          <button
            className="image-toolbar-btn"
            onClick={handleDoubleClick}
            title="Alt text"
          >🖉</button>
        </div>
      </div>

      {/* Alt text input */}
      {showAltInput && (
        <div className="image-alt-input-overlay" onClick={() => handleAltSave()}>
          <div className="image-alt-input-box" onClick={e => e.stopPropagation()}>
            <label className="image-alt-label">Texto alternativo:</label>
            <input
              className="image-alt-input"
              value={altText}
              onChange={e => setAltText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAltSave(); if (e.key === 'Escape') setShowAltInput(false) }}
              autoFocus
            />
            <div className="image-alt-actions">
              <button className="toolbar-btn" onClick={handleAltSave}>Save</button>
              <button className="toolbar-btn" onClick={() => setShowAltInput(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Size editor */}
      {editingSize && (
        <div className="image-alt-input-overlay" onClick={() => handleSizeSave()}>
          <div className="image-alt-input-box" onClick={e => e.stopPropagation()}>
            <label className="image-alt-label">Dimensions:</label>
            <div className="image-size-row">
              <input
                className="image-alt-input"
                type="number"
                placeholder="Width"
                value={sizeInput.width}
                onChange={e => setSizeInput(p => ({ ...p, width: e.target.value }))}
              />
              <span>×</span>
              <input
                className="image-alt-input"
                type="number"
                placeholder="Height"
                value={sizeInput.height}
                onChange={e => setSizeInput(p => ({ ...p, height: e.target.value }))}
              />
            </div>
            <div className="image-alt-actions">
              <button className="toolbar-btn" onClick={handleSizeSave}>Save</button>
              <button className="toolbar-btn" onClick={() => setEditingSize(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
