import { useState, useEffect, useRef, useCallback } from 'react'

interface TableSizePickerProps {
  position: { x: number; y: number }
  defaultSize?: { rows: number; cols: number }
  onSelect: (rows: number, cols: number) => void
  onClose: () => void
}

const MAX_GRID = 8
const MAX_MANUAL = 20
const CELL = 18
const GAP = 2
const PAD = 8
const W = MAX_GRID * (CELL + GAP) - GAP + PAD * 2
const H = MAX_GRID * (CELL + GAP) - GAP + PAD * 2 + 32

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

  const handleRowsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10)
    if (!isNaN(v) && v >= 1) setHoveredRows(Math.min(v, MAX_MANUAL))
  }, [])

  const handleColsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10)
    if (!isNaN(v) && v >= 1) setHoveredCols(Math.min(v, MAX_MANUAL))
  }, [])

  const x = Math.min(position.x, window.innerWidth - W - 8)
  const y = Math.min(position.y, window.innerHeight - H - 8)

  const exceedsGrid = hoveredRows > MAX_GRID || hoveredCols > MAX_GRID

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
        {Array.from({ length: MAX_GRID }, (_, r) => (
          <div key={r} className="table-size-row">
            {Array.from({ length: MAX_GRID }, (_, c) => (
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
        <input
          type="number"
          className="table-size-input"
          min={1}
          max={MAX_MANUAL}
          value={hoveredRows}
          onChange={handleRowsChange}
          onFocus={e => e.target.select()}
        />
        <span>×</span>
        <input
          type="number"
          className="table-size-input"
          min={1}
          max={MAX_MANUAL}
          value={hoveredCols}
          onChange={handleColsChange}
          onFocus={e => e.target.select()}
        />
        {exceedsGrid && <span className="table-size-exceed">+</span>}
      </div>
    </div>
  )
}
