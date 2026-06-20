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
    <div className="premium-card p-4 space-y-4 border border-slate-100/50">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100/50">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Texto
        </h4>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold tracking-wide uppercase">
          Edición
        </span>
      </div>

      {/* Font size */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Tamaño
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdate('fontSize', Math.max(8, fontSize - 2))}
            className="w-8 h-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <input
            type="number"
            min={8}
            max={200}
            value={fontSize}
            onChange={(e) => onUpdate('fontSize', Number(e.target.value))}
            className="w-14 h-8 text-center text-xs font-bold bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <button
            onClick={() => onUpdate('fontSize', Math.min(200, fontSize + 2))}
            className="w-8 h-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bold / Italic */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Estilo
        </span>
        <div className="flex gap-1.5">
          <button
            onClick={() => onUpdate('fontWeight', isBold ? 'normal' : 'bold')}
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs',
              isBold
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            )}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => onUpdate('fontStyle', isItalic ? 'normal' : 'italic')}
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs',
              isItalic
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            )}
          >
            <Italic className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alignment */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Alineación
        </span>
        <div className="flex gap-1.5">
          {[
            { value: 'left', Icon: AlignLeft },
            { value: 'center', Icon: AlignCenter },
            { value: 'right', Icon: AlignRight },
          ].map(({ value, Icon }) => (
            <button
              key={value}
              onClick={() => onUpdate('textAlign', value)}
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs',
                textAlign === value
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
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
