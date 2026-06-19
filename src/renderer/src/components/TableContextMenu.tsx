import { useEffect, useRef, useCallback } from 'react'
import type { Editor } from '@tiptap/core'

interface TableContextMenuProps {
  editor: Editor
  position: { x: number; y: number }
  onClose: () => void
}

export function TableContextMenu({ editor, position, onClose }: TableContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    setTimeout(() => {
      window.addEventListener('click', handleClick)
      window.addEventListener('keydown', handleKeyDown)
    }, 0)
    return () => {
      window.removeEventListener('click', handleClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const run = useCallback((fn: () => void) => {
    fn()
    onClose()
  }, [onClose])

  const menuItems = [
    {
      label: 'Insertar fila arriba',
      action: () => editor.chain().focus().addRowBefore().run()
    },
    {
      label: 'Insertar fila abajo',
      action: () => editor.chain().focus().addRowAfter().run()
    },
    { separator: true },
    {
      label: 'Insertar columna izquierda',
      action: () => editor.chain().focus().addColumnBefore().run()
    },
    {
      label: 'Insertar columna derecha',
      action: () => editor.chain().focus().addColumnAfter().run()
    },
    { separator: true },
    {
      label: 'Eliminar fila',
      action: () => editor.chain().focus().deleteRow().run()
    },
    {
      label: 'Eliminar columna',
      action: () => editor.chain().focus().deleteColumn().run()
    },
    { separator: true },
    {
      label: 'Eliminar tabla',
      action: () => editor.chain().focus().deleteTable().run()
    },
    {
      label: 'Combinar celdas',
      action: () => editor.chain().focus().mergeCells().run()
    },
    {
      label: 'Dividir celda',
      action: () => editor.chain().focus().splitCell().run()
    }
  ]

  // Adjust position to avoid overflowing the screen
  const x = Math.min(position.x, window.innerWidth - 220)
  const y = Math.min(position.y, window.innerHeight - 280)

  return (
    <div
      ref={menuRef}
      className="table-context-menu"
      style={{ left: x, top: y, position: 'fixed' }}
    >
      {menuItems.map((item, i) => 
        'separator' in item && item.separator ? (
          <div key={i} className="menu-sep" />
        ) : (
          <button
            key={i}
            className="table-context-menu-item"
            onClick={() => run((item as any).action)}
          >
            {(item as any).label}
          </button>
        )
      )}
    </div>
  )
}
