'use client'

import { ColorPicker } from './ColorPicker'
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Minus,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ActiveObjectInfo } from './useFabricCanvas'

interface TextControlsProps {
  objectInfo: ActiveObjectInfo
  onUpdate: (prop: string, value: unknown) => void
}

export function TextControls({ objectInfo, onUpdate }: TextControlsProps) {
  const fontSize = objectInfo.fontSize ?? 32
  const isBold = objectInfo.fontWeight === 'bold'
  const isItalic = objectInfo.fontStyle === 'italic'
  const textAlign = objectInfo.textAlign ?? 'center'
  const color = objectInfo.color ?? '#000000'

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4 shadow-sm">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Texto
      </h4>

      {/* Font size */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
          Tamaño
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdate('fontSize', Math.max(8, fontSize - 2))}
            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <input
            type="number"
            min={8}
            max={200}
            value={fontSize}
            onChange={(e) => onUpdate('fontSize', Number(e.target.value))}
            className="w-14 h-7 text-center text-sm border border-gray-200 rounded-lg outline-none focus:border-[#0095b6] transition-colors"
          />
          <button
            onClick={() => onUpdate('fontSize', Math.min(200, fontSize + 2))}
            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bold / Italic */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
          Estilo
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onUpdate('fontWeight', isBold ? 'normal' : 'bold')}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              isBold
                ? 'bg-[#cceef5] text-[#0095b6]'
                : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
            )}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => onUpdate('fontStyle', isItalic ? 'normal' : 'italic')}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              isItalic
                ? 'bg-[#cceef5] text-[#0095b6]'
                : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
            )}
          >
            <Italic className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alignment */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
          Alineación
        </span>
        <div className="flex gap-1">
          {[
            { value: 'left', Icon: AlignLeft },
            { value: 'center', Icon: AlignCenter },
            { value: 'right', Icon: AlignRight },
          ].map(({ value, Icon }) => (
            <button
              key={value}
              onClick={() => onUpdate('textAlign', value)}
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                textAlign === value
                  ? 'bg-[#cceef5] text-[#0095b6]'
                  : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
              )}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <ColorPicker
        label="Color"
        value={color}
        onChange={(c) => onUpdate('fill', c)}
      />
    </div>
  )
}
