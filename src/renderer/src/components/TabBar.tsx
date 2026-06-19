import { useRef, useState, useEffect, type DragEvent, type MouseEvent } from 'react'

export interface TabInfo {
  id: string
  filePath: string | null
  title: string
  modified: boolean
}

interface TabBarProps {
  tabs: TabInfo[]
  activeId: string
  onSelect: (id: string) => void
  onClose: (id: string) => void
  onCloseOthers?: (id: string) => void
  onCloseAll?: () => void
  onCloseRight?: (id: string) => void
  onCloseSaved?: () => void
  onReorder?: (dragId: string, targetId: string, position: 'before' | 'after') => void
}

export function TabBar({ tabs, activeId, onSelect, onClose, onCloseOthers, onCloseAll, onCloseRight, onCloseSaved, onReorder }: TabBarProps) {
  if (tabs.length <= 1 && !tabs[0]?.filePath && !tabs[0]?.modified) return null

  return (
    <div className="tabbar">
      {tabs.map(tab => (
        <DraggableTab
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeId}
          tabsLength={tabs.length}
          onSelect={onSelect}
          onClose={onClose}
          onCloseOthers={onCloseOthers}
          onCloseAll={onCloseAll}
          onCloseRight={onCloseRight}
          onCloseSaved={onCloseSaved}
          onReorder={onReorder}
        />
      ))}
    </div>
  )
}

interface DraggableTabProps {
  tab: TabInfo
  isActive: boolean
  tabsLength: number
  onSelect: (id: string) => void
  onClose: (id: string) => void
  onCloseOthers?: (id: string) => void
  onCloseAll?: () => void
  onCloseRight?: (id: string) => void
  onCloseSaved?: () => void
  onReorder?: (dragId: string, targetId: string, position: 'before' | 'after') => void
}

function DraggableTab({ tab, isActive, tabsLength, onSelect, onClose, onCloseOthers, onCloseAll, onCloseRight, onCloseSaved, onReorder }: DraggableTabProps) {
  const [dropSide, setDropSide] = useState<'before' | 'after' | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })
  const tabRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close context menu on outside click / Escape
  useEffect(() => {
    if (!showMenu) return
    const close = (e: Event) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMenu(false)
    }
    // Use setTimeout to avoid the same right-click closing the menu immediately
    setTimeout(() => {
      window.addEventListener('mousedown', close)
      window.addEventListener('keydown', onKey)
    }, 0)
    return () => {
      window.removeEventListener('mousedown', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [showMenu])

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    setMenuPos({ x: e.clientX, y: e.clientY })
    setShowMenu(true)
  }

  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer.setData('text/plain', tab.id)
    e.dataTransfer.effectAllowed = 'move'
    setTimeout(() => tabRef.current?.classList.add('tab-dragging'), 0)
  }

  const handleDragEnd = () => {
    tabRef.current?.classList.remove('tab-dragging')
    setDropSide(null)
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (!tabRef.current || !onReorder) return
    const rect = tabRef.current.getBoundingClientRect()
    const midX = rect.left + rect.width / 2
    setDropSide(e.clientX < midX ? 'before' : 'after')
  }

  const handleDragLeave = (e: DragEvent) => {
    if (tabRef.current && !tabRef.current.contains(e.relatedTarget as Node)) {
      setDropSide(null)
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    const dragId = e.dataTransfer.getData('text/plain')
    if (dragId === tab.id || !onReorder) {
      setDropSide(null)
      return
    }
    onReorder(dragId, tab.id, dropSide || 'after')
    setDropSide(null)
  }

  return (
    <div
      ref={tabRef}
      className={`tab ${isActive ? 'active' : ''} ${dropSide ? `drop-${dropSide}` : ''}`}
      onClick={() => onSelect(tab.id)}
      onContextMenu={handleContextMenu}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <span className="tab-title">{tab.title}{tab.modified ? ' ●' : ''}</span>
      {tabsLength > 1 && (
        <button
          className="tab-close"
          onClick={e => { e.stopPropagation(); onClose(tab.id) }}
          title="Cerrar"
        >
          ×
        </button>
      )}

      {showMenu && (
        <div
          ref={menuRef}
          className="tab-context-menu"
          style={{ left: menuPos.x, top: menuPos.y, position: 'fixed' }}
          onClick={e => e.stopPropagation()}
        >
          <button className="tab-context-item" onClick={() => { onClose(tab.id); setShowMenu(false) }}>
            <span>Cerrar</span>
            <span className="tab-context-shortcut">Ctrl+W</span>
          </button>
          <div className="menu-sep" />
          <button className="tab-context-item" onClick={() => { onCloseOthers?.(tab.id); setShowMenu(false) }}>
            Cerrar otros
          </button>
          <button className="tab-context-item" onClick={() => { onCloseRight?.(tab.id); setShowMenu(false) }}>
            Cerrar a la derecha
          </button>
          <button className="tab-context-item" onClick={() => { onCloseAll?.(); setShowMenu(false) }}>
            Cerrar todos
          </button>
          <div className="menu-sep" />
          <button className="tab-context-item" onClick={() => { onCloseSaved?.(); setShowMenu(false) }}>
            Cerrar guardados
          </button>
        </div>
      )}
    </div>
  )
}

export function getTabTitle(filePath: string | null): string {
  if (!filePath) return 'Sin título'
  return filePath.split('\\').pop()?.split('/').pop() || 'Sin título'
}
