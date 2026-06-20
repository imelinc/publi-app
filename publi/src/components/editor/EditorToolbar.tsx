'use client'

import { useState, useRef } from 'react'
import {
  Type,
  Shapes,
  Sticker,
  ImagePlus,
  Trash2,
  ArrowUpToLine,
  ArrowDownToLine,
  Download,
  Undo2,
  Redo2,
  Copy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ShapeMenu } from './ShapeMenu'
import { StickerPicker } from './StickerPicker'
import type { ShapeType, ActiveObjectInfo } from './useFabricCanvas'

interface EditorToolbarProps {
  onAddText: () => void
  onAddShape: (type: ShapeType) => void
  onAddSticker: (url: string) => void
  onUploadImage: (file: File) => void
  onDelete: () => void
  onDuplicate: () => void
  onBringToFront: () => void
  onSendToBack: () => void
  onExport: () => void
  activeObjectInfo: ActiveObjectInfo | null
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}

export function EditorToolbar({
  onAddText,
  onAddShape,
  onAddSticker,
  onUploadImage,
  onDelete,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  onExport,
  activeObjectInfo,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: EditorToolbarProps) {
  const [showShapes, setShowShapes] = useState(false)
  const [showStickers, setShowStickers] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasSelection = activeObjectInfo !== null

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onUploadImage(file)
      e.target.value = ''
    }
  }

  const tools = [
    {
      id: 'text',
      label: 'Texto',
      Icon: Type,
      onClick: onAddText,
    },
    {
      id: 'shapes',
      label: 'Formas',
      Icon: Shapes,
      onClick: () => {
        setShowStickers(false)
        setShowShapes((v) => !v)
      },
      isActive: showShapes,
    },
    {
      id: 'stickers',
      label: 'Stickers',
      Icon: Sticker,
      onClick: () => {
        setShowShapes(false)
        setShowStickers((v) => !v)
      },
      isActive: showStickers,
    },
    {
      id: 'upload',
      label: 'Imagen',
      Icon: ImagePlus,
      onClick: () => fileInputRef.current?.click(),
    },
  ]

  return (
    <div className="relative z-20 bg-white/90 backdrop-blur-xl border border-gray-150/40 shadow-[0_8px_32px_rgba(0,0,0,0.06)] rounded-2xl p-2 flex flex-col gap-1.5 w-[66px] items-center shrink-0 select-none">
      {tools.map(({ id, label, Icon, onClick, isActive }) => (
        <div key={id} className="relative w-full flex justify-center">
          <button
            onClick={onClick}
            className={cn(
              'w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 hover:scale-[1.06] active:scale-[0.96] border border-transparent cursor-pointer',
              isActive
                ? 'bg-primary/10 text-primary border-primary/20 shadow-xs'
                : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-800'
            )}
            title={label}
          >
            <Icon className="w-5 h-5" strokeWidth={1.8} />
            <span className="text-[8px] font-bold tracking-wide leading-none">{label}</span>
          </button>

          {id === 'shapes' && showShapes && (
            <ShapeMenu
              onAddShape={onAddShape}
              onClose={() => setShowShapes(false)}
            />
          )}
          {id === 'stickers' && showStickers && (
            <StickerPicker
              onAddSticker={onAddSticker}
              onClose={() => setShowStickers(false)}
            />
          )}
        </div>
      ))}

      <div className="w-8 h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent my-1.5 self-center shrink-0" />

      {/* Undo / Redo controls */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={cn(
          'w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 border border-transparent shrink-0 cursor-pointer',
          canUndo
            ? 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-800 hover:scale-[1.06] active:scale-[0.96]'
            : 'text-slate-300 cursor-not-allowed opacity-35'
        )}
        title="Deshacer (Ctrl+Z)"
      >
        <Undo2 className="w-5 h-5" strokeWidth={1.8} />
        <span className="text-[8px] font-bold tracking-wide leading-none">Deshacer</span>
      </button>

      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={cn(
          'w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 border border-transparent shrink-0 cursor-pointer',
          canRedo
            ? 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-800 hover:scale-[1.06] active:scale-[0.96]'
            : 'text-slate-300 cursor-not-allowed opacity-35'
        )}
        title="Rehacer (Ctrl+Y)"
      >
        <Redo2 className="w-5 h-5" strokeWidth={1.8} />
        <span className="text-[8px] font-bold tracking-wide leading-none">Rehacer</span>
      </button>

      <div className="w-8 h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent my-1.5 self-center shrink-0" />

      {/* Z-index controls */}
      <button
        onClick={onBringToFront}
        disabled={!hasSelection}
        className={cn(
          'w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 border border-transparent shrink-0 cursor-pointer',
          hasSelection
            ? 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-800 hover:scale-[1.06] active:scale-[0.96]'
            : 'text-slate-300 cursor-not-allowed opacity-35'
        )}
        title="Traer al frente"
      >
        <ArrowUpToLine className="w-5 h-5" strokeWidth={1.8} />
        <span className="text-[8px] font-bold tracking-wide leading-none">Frente</span>
      </button>

      <button
        onClick={onSendToBack}
        disabled={!hasSelection}
        className={cn(
          'w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 border border-transparent shrink-0 cursor-pointer',
          hasSelection
            ? 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-800 hover:scale-[1.06] active:scale-[0.96]'
            : 'text-slate-300 cursor-not-allowed opacity-35'
        )}
        title="Enviar atrás"
      >
        <ArrowDownToLine className="w-5 h-5" strokeWidth={1.8} />
        <span className="text-[8px] font-bold tracking-wide leading-none">Atrás</span>
      </button>

      {/* Duplicate */}
      <button
        onClick={onDuplicate}
        disabled={!hasSelection}
        className={cn(
          'w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 border border-transparent shrink-0 cursor-pointer',
          hasSelection
            ? 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-800 hover:scale-[1.06] active:scale-[0.96]'
            : 'text-slate-300 cursor-not-allowed opacity-35'
        )}
        title="Duplicar seleccionado"
      >
        <Copy className="w-5 h-5" strokeWidth={1.8} />
        <span className="text-[8px] font-bold tracking-wide leading-none">Duplicar</span>
      </button>

      {/* Delete */}
      <button
        onClick={onDelete}
        disabled={!hasSelection}
        className={cn(
          'w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 border border-transparent shrink-0 cursor-pointer',
          hasSelection
            ? 'text-rose-500 hover:bg-rose-50 hover:text-rose-600 hover:scale-[1.06] active:scale-[0.96]'
            : 'text-slate-300 cursor-not-allowed opacity-35'
        )}
        title="Eliminar seleccionado"
      >
        <Trash2 className="w-5 h-5" strokeWidth={1.8} />
        <span className="text-[8px] font-bold tracking-wide leading-none">Borrar</span>
      </button>

      <div className="w-8 h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent my-1.5 self-center shrink-0" />

      {/* Export */}
      <button
        onClick={onExport}
        className="w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 text-white bg-gradient-to-br from-primary to-[#00a2c7] shadow-sm shadow-primary/20 transition-all duration-300 hover:scale-[1.06] hover:shadow-md hover:shadow-primary/30 hover:brightness-105 active:scale-[0.96] shrink-0 cursor-pointer"
        title="Descargar PNG"
      >
        <Download className="w-5 h-5" strokeWidth={1.8} />
        <span className="text-[8px] font-bold tracking-wide leading-none">PNG</span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="sr-only"
      />
    </div>
  )
}
