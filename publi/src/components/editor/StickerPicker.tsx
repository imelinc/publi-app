'use client'

import { useEffect, useRef } from 'react'
import { Upload, X } from 'lucide-react'

const STICKER_FILES = [
  // Engagement
  { name: 'Corazón', file: 'heart.svg' },
  { name: 'Like', file: 'like.svg' },
  { name: 'Fuego', file: 'fire.svg' },
  { name: 'Estrella', file: 'star.svg' },
  { name: '100', file: 'hundred.svg' },
  // Promoción
  { name: 'NUEVO', file: 'badge-nuevo.svg' },
  { name: 'OFERTA', file: 'badge-oferta.svg' },
  { name: 'PROMO', file: 'badge-promo.svg' },
  { name: 'SALE', file: 'badge-sale.svg' },
  { name: 'HOT', file: 'badge-hot.svg' },
  { name: 'FREE', file: 'badge-free.svg' },
  // Flechas / UI
  { name: 'Flecha arriba', file: 'arrow-up.svg' },
  { name: 'Flecha derecha', file: 'arrow-right.svg' },
  { name: 'Swipe Up', file: 'swipe-up.svg' },
  { name: 'Click', file: 'cursor-click.svg' },
  // Social
  { name: 'Hashtag', file: 'hashtag.svg' },
  { name: 'Arroba', file: 'arroba.svg' },
  { name: 'Chat', file: 'chat.svg' },
  { name: 'Cámara', file: 'camera.svg' },
  { name: 'Play', file: 'play.svg' },
  // Decorativo
  { name: 'Sparkle', file: 'sparkle.svg' },
  { name: 'Rayo', file: 'lightning.svg' },
  { name: 'Corona', file: 'crown.svg' },
  { name: 'Check', file: 'check-circle.svg' },
  { name: 'Diamante', file: 'diamond.svg' },
  { name: 'Destello', file: 'destello.svg' },
  { name: 'Reloj', file: 'clock.svg' },
  { name: 'Usuario', file: 'user.svg' },
  { name: 'Puntos', file: 'dots.svg' },
  { name: 'Gradiente', file: 'gradient-circle.svg' },
]

interface StickerPickerProps {
  onAddSticker: (url: string) => void
  onClose: () => void
}

export function StickerPicker({ onAddSticker, onClose }: StickerPickerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  function handleUploadSticker(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    onAddSticker(url)
    onClose()
  }

  return (
    <div
      ref={panelRef}
      className="absolute left-full ml-2 top-0 bg-white rounded-xl border border-gray-100 shadow-xl z-50 w-[340px] animate-in fade-in slide-in-from-left-2 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h4 className="text-sm font-semibold text-gray-900">Stickers</h4>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Grid */}
      <div className="p-3 grid grid-cols-6 gap-2 max-h-[320px] overflow-y-auto">
        {STICKER_FILES.map(({ name, file }) => (
          <button
            key={file}
            onClick={() => {
              onAddSticker(`/stickers/${file}`)
              onClose()
            }}
            className="w-full aspect-square rounded-lg border border-gray-100 hover:border-[#0095b6] hover:bg-[#cceef5]/30 flex items-center justify-center p-1.5 transition-all hover:scale-105"
            title={name}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/stickers/${file}`}
              alt={name}
              className="w-full h-full object-contain"
            />
          </button>
        ))}
      </div>

      {/* Upload own sticker */}
      <div className="px-3 pb-3 pt-1">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-[#0095b6] hover:text-[#0095b6] hover:bg-[#cceef5]/20 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Subir mi sticker
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUploadSticker}
          className="sr-only"
        />
      </div>
    </div>
  )
}
