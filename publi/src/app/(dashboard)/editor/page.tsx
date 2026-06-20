'use client'

import { useState } from 'react'
import { ImageEditor } from '@/components/editor/ImageEditor'
import { Palette, Square, Smartphone, Monitor, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/use-app-store'
import { PlanUpgradeGuard } from '@/components/dashboard/PlanUpgradeGuard'

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
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId)
  const clients = useAppStore((s) => s.clients)
  const userProfile = useAppStore((s) => s.userProfile)
  const activeClient = clients.find((c) => c.id === activeWorkspaceId) ?? clients[0] ?? null

  const [editorState, setEditorState] = useState<
    | { mode: 'landing' }
    | { mode: 'editor'; width: number; height: number; bgColor: string }
  >({ mode: 'landing' })

  const [bgColor, setBgColor] = useState('#ffffff')
  const [selectedPreset, setSelectedPreset] = useState(0)

  if (userProfile?.plan === 'free') {
    return (
      <PlanUpgradeGuard
        featureName="El Editor de imágenes"
      />
    )
  }

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
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-800 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Editor de imágenes</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5 bg-slate-50 px-2 py-0.5 border border-slate-100 rounded inline-block">
              Lienzo: {editorState.width} × {editorState.height}px
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
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight gradient-text">
          Editor de imágenes
        </h1>
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
          Creá contenido visual de alto nivel para tus redes sociales
        </p>
      </div>

      <div className="max-w-md mx-auto">
        {/* Start blank card */}
        <div className="premium-card p-8 flex flex-col gap-6 border border-gray-100/50">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50/70 border border-amber-100/50"
            >
              <Palette className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">Empezar en blanco</p>
              <p className="text-xs text-gray-400 font-medium">Elegí un tamaño y comenzá a editar</p>
            </div>
          </div>

          {/* Preset picker */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Tamaño del lienzo
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              {PRESETS.map((preset, i) => {
                const Icon = preset.Icon
                const isSelected = selectedPreset === i
                return (
                  <button
                    key={preset.label}
                    onClick={() => setSelectedPreset(i)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary shadow-xs'
                        : 'border-gray-100 bg-white hover:border-gray-250 text-gray-600'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5',
                        isSelected ? 'text-primary' : 'text-gray-450'
                      )}
                    />
                    <span
                      className={cn(
                        'text-xs font-bold',
                        isSelected ? 'text-primary' : 'text-gray-700'
                      )}
                    >
                      {preset.label}
                    </span>
                    <span className="text-[9px] text-gray-400 font-semibold font-mono">
                      {preset.width}×{preset.height}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <button
            onClick={startBlank}
            className="w-full h-11 bg-gradient-to-r from-primary to-[#00b4d8] text-white hover:opacity-95 shadow-[0_4px_12px_rgba(0,149,182,0.25)] rounded-xl text-xs font-bold uppercase tracking-wider hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            Crear lienzo
          </button>
        </div>
      </div>
    </div>
  )
}
