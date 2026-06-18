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
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
          {label}
        </span>
      )}

      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 shrink-0"
            style={{
              backgroundColor: color,
              borderColor: value === color ? '#0095b6' : color === '#ffffff' ? '#e5e7eb' : 'transparent',
              boxShadow: value === color ? '0 0 0 2px #0095b6' : 'none',
            }}
            title={color}
          />
        ))}

        {/* Custom color picker */}
        <button
          onClick={() => inputRef.current?.click()}
          className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors shrink-0"
          title="Color personalizado"
        >
          <span className="text-xs font-bold">+</span>
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
