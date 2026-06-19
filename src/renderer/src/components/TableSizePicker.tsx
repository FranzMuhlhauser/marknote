import { useState, useEffect, useRef } from 'react'

interface TableSizePickerProps {
  position: { x: number; y: number }
  defaultSize?: { rows: number; cols: number }
  onSelect: (rows: number, cols: number) => void
  onClose: () => void
}

const MAX_ROWS = 8
const MAX_COLS = 8
const CELL = 18
const GAP = 2
const PAD = 8
const W = MAX_COLS * (CELL + GAP) - GAP + PAD * 2
const H = MAX_ROWS * (CELL + GAP) - GAP + PAD * 2 + 28

export function TableSizePicker({ position, defaultSize, onSelect, onClose }: TableSizePickerProps) {
  const [hoveredRows, setHoveredRows] = useState(defaultSize?.rows ?? 1)
  const [hoveredCols, setHoveredCols] = useState(defaultSize?.cols ?? 1)
  const ref = useRef<HTMLDivElement>(null)
  const selectedRef = useRef({ rows: 1, cols: 1 })
  selectedRef.current = { rows: hoveredRows, cols: hoveredCols }

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter') {
        onSelect(selectedRef.current.rows, selectedRef.current.cols)
      }
    }
    window.addEventListener('mousedown', handleClick)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('mousedown', handleClick)
      window.removeEventListener('keydown', handleKey)
    }
  }, [onClose, onSelect])

  const x = Math.min(position.x, window.innerWidth - W - 8)
  const y = Math.min(position.y, window.innerHeight - H - 8)

  return (
    <div
      ref={ref}
      className="table-size-picker"
      style={{ left: x, top: y, position: 'fixed' }}
    >
      <div
        className="table-size-grid"
        onMouseLeave={() => { setHoveredRows(1); setHoveredCols(1) }}
      >
        {Array.from({ length: MAX_ROWS }, (_, r) => (
          <div key={r} className="table-size-row">
            {Array.from({ length: MAX_COLS }, (_, c) => (
              <div
                key={c}
                className={`table-size-cell${r < hoveredRows && c < hoveredCols ? ' active' : ''}`}
                onMouseEnter={() => { setHoveredRows(r + 1); setHoveredCols(c + 1) }}
                onClick={() => onSelect(hoveredRows, hoveredCols)}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="table-size-label">
        {hoveredRows} × {hoveredCols}
      </div>
    </div>
  )
}
