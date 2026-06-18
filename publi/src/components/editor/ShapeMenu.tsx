'use client'

import { useEffect, useRef } from 'react'
import { Square, Circle, Minus, MoveRight } from 'lucide-react'
import type { ShapeType } from './useFabricCanvas'

interface ShapeMenuProps {
  onAddShape: (type: ShapeType) => void
  onClose: () => void
}

const shapes: { type: ShapeType; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'rect', label: 'Rectángulo', Icon: Square },
  { type: 'circle', label: 'Círculo', Icon: Circle },
  { type: 'line', label: 'Línea', Icon: Minus },
  { type: 'arrow', label: 'Flecha', Icon: MoveRight },
]

export function ShapeMenu({ onAddShape, onClose }: ShapeMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute left-full ml-2 top-0 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-50 min-w-[160px] animate-in fade-in slide-in-from-left-2 duration-150"
    >
      {shapes.map(({ type, label, Icon }) => (
        <button
          key={type}
          onClick={() => {
            onAddShape(type)
            onClose()
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Icon className="w-4 h-4 text-gray-400" />
          {label}
        </button>
      ))}
    </div>
  )
}
