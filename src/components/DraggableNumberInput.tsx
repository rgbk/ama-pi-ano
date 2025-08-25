import { useState, useRef, useEffect } from 'react'

interface DraggableNumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  unit?: string
  precision?: number
}

export function DraggableNumberInput({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  label,
  unit = '',
  precision = 2
}: DraggableNumberInputProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value.toFixed(precision))
  const startY = useRef(0)
  const startValue = useRef(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isDragging) {
      setEditValue(value.toFixed(precision))
    }
  }, [value, precision, isDragging])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return
    setIsDragging(true)
    startY.current = e.clientY
    startValue.current = value
    e.preventDefault()
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startY.current - e.clientY
      const range = max - min
      
      // Smaller increment if alt/option key is held
      const multiplier = e.altKey ? 0.1 : 1
      const sensitivity = (range / 100) * multiplier
      
      const newValue = startValue.current + (deltaY * sensitivity)
      const clampedValue = Math.max(min, Math.min(max, newValue))
      
      // Round to step
      const rounded = Math.round(clampedValue / step) * step
      onChange(rounded)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, onChange, min, max, step])

  const handleDoubleClick = () => {
    setIsEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const numValue = parseFloat(editValue)
      if (!isNaN(numValue)) {
        const clampedValue = Math.max(min, Math.min(max, numValue))
        onChange(clampedValue)
      }
      setIsEditing(false)
    } else if (e.key === 'Escape') {
      setEditValue(value.toFixed(precision))
      setIsEditing(false)
    }
  }

  const handleBlur = () => {
    const numValue = parseFloat(editValue)
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(max, numValue))
      onChange(clampedValue)
    }
    setIsEditing(false)
  }

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm font-medium">{label}:</span>}
      <div 
        className={`
          inline-block px-2 py-1 bg-gray-100 rounded cursor-ns-resize select-none
          hover:bg-gray-200 transition-colors text-sm font-mono
          ${isDragging ? 'bg-blue-100' : ''}
        `}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        title="Drag up/down to change. Hold Alt for fine control. Double-click to edit."
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="w-16 bg-transparent outline-none"
            autoFocus
          />
        ) : (
          <span>{value.toFixed(precision)}{unit}</span>
        )}
      </div>
    </div>
  )
}