'use client'

import { useRef } from 'react'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
}

const PRESET_COLORS = [
  '#000000', '#ffffff', '#0095b6', '#ffb703', '#FF4D6A',
  '#8B5CF6', '#22C55E', '#3B82F6', '#EF4444', '#F97316',
  '#EC4899', '#6366F1', '#14B8A6', '#84CC16',
]

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {label}
        </span>
      )}

      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((color) => {
          const isSelected = value.toLowerCase() === color.toLowerCase()
          return (
            <button
              key={color}
              onClick={() => onChange(color)}
              className="w-7 h-7 rounded-full border border-black/5 transition-all duration-300 hover:scale-110 hover:shadow-sm shrink-0 cursor-pointer relative"
              style={{
                backgroundColor: color,
                boxShadow: isSelected 
                  ? `0 0 0 2px white, 0 0 0 4px #0095b6, 0 4px 6px -1px rgba(0, 0, 0, 0.1)` 
                  : color === '#ffffff' ? 'inset 0 0 0 1px rgba(0,0,0,0.08)' : 'none',
                zIndex: isSelected ? 10 : 1,
              }}
              title={color}
            />
          )
        })}

        {/* Custom color picker */}
        <button
          onClick={() => inputRef.current?.click()}
          className="w-7 h-7 rounded-full border border-dashed border-slate-350 bg-slate-50/50 flex items-center justify-center text-slate-500 hover:border-primary hover:text-primary hover:bg-primary/5 hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer shadow-xs"
          title="Color personalizado"
        >
          <span className="text-xs font-bold leading-none">+</span>
        </button>
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
      </div>
    </div>
  )
}
