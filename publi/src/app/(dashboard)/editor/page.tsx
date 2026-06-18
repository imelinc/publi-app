'use client'

import { useState } from 'react'
import { ImageEditor } from '@/components/editor/ImageEditor'
import { Palette, Square, Smartphone, Monitor, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

type CanvasPreset = {
  label: string
  width: number
  height: number
  Icon: React.ComponentType<{ className?: string }>
  description: string
}

const PRESETS: CanvasPreset[] = [
  {
    label: 'Cuadrado',
    width: 1080,
    height: 1080,
    Icon: Square,
    description: 'Feed de Instagram / Facebook',
  },
  {
    label: 'Story',
    width: 1080,
    height: 1920,
    Icon: Smartphone,
    description: 'Stories / Reels / TikTok',
  },
  {
    label: 'Horizontal',
    width: 1200,
    height: 630,
    Icon: Monitor,
    description: 'Facebook / LinkedIn / X',
  },
]

export default function EditorPage() {
  const [editorState, setEditorState] = useState<
    | { mode: 'landing' }
    | { mode: 'editor'; width: number; height: number; bgColor: string }
  >({ mode: 'landing' })

  const [bgColor, setBgColor] = useState('#ffffff')
  const [selectedPreset, setSelectedPreset] = useState(0)

  function startBlank() {
    const preset = PRESETS[selectedPreset]
    setEditorState({
      mode: 'editor',
      width: preset.width,
      height: preset.height,
      bgColor,
    })
  }

  if (editorState.mode === 'editor') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditorState({ mode: 'landing' })}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Editor de imágenes</h1>
            <p className="text-xs text-gray-400">
              {editorState.width} × {editorState.height}px
            </p>
          </div>
        </div>

        <ImageEditor
          width={editorState.width}
          height={editorState.height}
          backgroundColor={editorState.bgColor}
          backgroundImage={null}
        />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Editor de imágenes
        </h1>
        <p className="text-gray-500">
          Creá contenido visual para tus redes sociales
        </p>
      </div>

      <div className="max-w-md mx-auto">
        {/* Start blank card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col gap-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#fff8e7' }}
            >
              <Palette className="w-6 h-6" style={{ color: '#ffb703' }} />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">Empezar en blanco</p>
              <p className="text-sm text-gray-400">Elegí un tamaño y color de fondo</p>
            </div>
          </div>

          {/* Preset picker */}
          <div className="space-y-2">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              Tamaño
            </span>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((preset, i) => {
                const Icon = preset.Icon
                return (
                  <button
                    key={preset.label}
                    onClick={() => setSelectedPreset(i)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center',
                      selectedPreset === i
                        ? 'border-[#0095b6] bg-[#cceef5]/30'
                        : 'border-gray-100 hover:border-gray-200'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5',
                        selectedPreset === i ? 'text-[#0095b6]' : 'text-gray-400'
                      )}
                    />
                    <span
                      className={cn(
                        'text-xs font-medium',
                        selectedPreset === i ? 'text-[#0095b6]' : 'text-gray-600'
                      )}
                    >
                      {preset.label}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {preset.width}×{preset.height}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <button
            onClick={startBlank}
            className="w-full py-2.5 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#0095b6' }}
          >
            Crear canvas
          </button>
        </div>
      </div>
    </div>
  )
}
