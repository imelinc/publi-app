'use client'

import { useEffect, useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import type { SocialNetwork } from '@/lib/mock-data'

interface AiPanelProps {
  type: 'rewrite' | 'hashtags' | 'schedule'
  content: string
  networks: SocialNetwork[]
  onAccept: (result: string) => void
  onDiscard: () => void
}

function generateSuggestion(
  type: 'rewrite' | 'hashtags' | 'schedule',
  content: string,
  networks: SocialNetwork[]
): string {
  if (type === 'rewrite') {
    if (networks.includes('instagram')) {
      return `${content}\n\n✨ ¿Te identificás? Guardalo para después 🔖 Seguinos para más contenido como este.`
    }
    if (networks.includes('linkedin')) {
      return `${content}\n\n¿Qué pensás? Dejame tu opinión en los comentarios.`
    }
    if (networks.includes('tiktok')) {
      return `${content} ¡Seguinos para más! 🎵`
    }
    return `${content}\n\n✨ Versión optimizada para mayor engagement.`
  }

  if (type === 'hashtags') {
    return '#contenido #redessociales #marketing #comunidad #growth #socialmedia #digitalmarketing #branding #estrategia #comunitymanager #engagement #trending'
  }

  if (networks.includes('tiktok')) {
    return '📅 Viernes a las 20:00 hs\n\nEste horario tiene el mayor engagement histórico para TikTok. Tu audiencia está más activa entre las 19 y 21 hs.'
  }
  if (networks.includes('linkedin')) {
    return '📅 Martes a las 12:00 hs\n\nEste horario tiene el mayor engagement histórico para LinkedIn. Tu audiencia profesional está más activa entre las 11 y 13 hs.'
  }
  if (networks.includes('facebook')) {
    return '📅 Jueves a las 19:00 hs\n\nEste horario tiene el mayor engagement histórico para Facebook. Tu audiencia está más activa entre las 18 y 20 hs.'
  }
  return '📅 Miércoles a las 18:00 hs\n\nEste horario tiene el mayor engagement histórico para Instagram. Tu audiencia está más activa entre las 17 y 19 hs.'
}

const TYPE_LABELS: Record<string, string> = {
  rewrite: 'Sugerencia de copy',
  hashtags: 'Hashtags sugeridos',
  schedule: 'Horario recomendado',
}

export function AiPanel({ type, content, networks, onAccept, onDiscard }: AiPanelProps) {
  const [loading, setLoading] = useState(true)
  const [suggestion, setSuggestion] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setSuggestion(null)
    const timer = setTimeout(() => {
      setLoading(false)
      setSuggestion(generateSuggestion(type, content, networks))
    }, 1200)
    return () => clearTimeout(timer)
  }, [type, content, networks])

  return (
    <div className="bg-[#cceef5]/30 border border-[#0095b6]/20 rounded-xl p-4 mt-3">
      {loading ? (
        <>
          <div className="space-y-2">
            <div className="animate-pulse bg-gray-200 rounded h-3 w-full" />
            <div className="animate-pulse bg-gray-200 rounded h-3 w-4/5" />
            <div className="animate-pulse bg-gray-200 rounded h-3 w-3/5" />
          </div>
          <p className="text-xs text-gray-400 mt-2">La IA está analizando tu contenido...</p>
        </>
      ) : suggestion ? (
        <>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-[#0095b6]" />
              <span className="text-xs font-medium text-[#0095b6]">{TYPE_LABELS[type]}</span>
            </div>
            <button onClick={onDiscard} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="size-3.5" />
            </button>
          </div>
          {type === 'hashtags' ? (
            <div className="flex flex-wrap gap-1">
              {suggestion.split(' ').map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="inline-block bg-[#cceef5] text-[#0095b6] rounded px-1.5 py-0.5 text-xs cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {suggestion}
            </p>
          )}
          <button
            onClick={() => onAccept(suggestion)}
            className="w-full mt-3 bg-[#0095b6] text-white text-sm rounded-lg py-2 hover:bg-[#007a94] transition-colors"
          >
            Aplicar sugerencia
          </button>
        </>
      ) : null}
    </div>
  )
}