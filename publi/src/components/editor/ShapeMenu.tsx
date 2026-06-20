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
      className="absolute left-full ml-3 top-0 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.08)] py-1.5 z-50 min-w-[160px] animate-in fade-in slide-in-from-left-2 duration-200"
    >
      {shapes.map(({ type, label, Icon }) => (
        <button
          key={type}
          onClick={() => {
            onAddShape(type)
            onClose()
          }}
          className="w-[calc(100%-12px)] mx-1.5 flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all cursor-pointer"
        >
          <Icon className="w-4 h-4 text-slate-400" />
          {label}
        </button>
      ))}
    </div>
  )
}

