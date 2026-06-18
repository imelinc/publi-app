'use client'

import { useEffect, useState, useRef } from 'react'
import { X } from 'lucide-react'
import Image from 'next/image'
import type { Network } from '@/types'
import { useAppStore } from '@/store/use-app-store'

export interface ScheduleRecommendation {
  dayOfWeek: string
  time: string // 'HH:MM'
  reason: string
}

interface AiPanelProps {
  type: 'rewrite' | 'hashtags' | 'schedule'
  content: string
  networks: Network[]
  /**
   * Callback al aceptar la sugerencia.
   * - rewrite / hashtags: `result` es el texto sugerido. `schedule` es null.
   * - schedule: `result` es el texto formateado. `schedule` trae la data parseada.
   */
  onAccept: (result: string, schedule?: ScheduleRecommendation) => void
  onDiscard: () => void
}

function generateFallback(
  type: 'rewrite' | 'hashtags' | 'schedule',
  content: string,
  networks: Network[]
): string {
  if (type === 'rewrite') {
    if (networks.includes('instagram')) {
      return `${content}\n\n✨ ¿Te identificás? Guardalo para después 🔖 Seguinos para más contenido como este.`
    }
    return `${content}\n\n✨ Versión optimizada para mayor engagement.`
  }

  if (type === 'hashtags') {
    return '#contenido #redessociales #marketing #comunidad #growth #socialmedia #digitalmarketing #branding #estrategia #comunitymanager #engagement #trending'
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
  const [scheduleData, setScheduleData] = useState<ScheduleRecommendation | null>(null)
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setLoading(true)
    setSuggestion(null)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const fallback = generateFallback(type, content, networks)

    async function fetchSuggestion() {
      try {
        if (type === 'rewrite') {
          const res = await fetch('/api/ai/rewrite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: content, clientId: activeWorkspaceId, tone: null, networks }),
            signal: controller.signal,
          })
          const data = await res.json()
          const dynamicVariant = data.suggestions?.find(
            (s: { text: string; label: string }) => s.label === 'Más dinámico'
          )
          setSuggestion(dynamicVariant?.text ?? data.suggestions?.[0]?.text ?? fallback)
        } else if (type === 'hashtags') {
          const res = await fetch('/api/ai/hashtags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: content, clientId: activeWorkspaceId, count: 12, networks }),
            signal: controller.signal,
          })
          const data = await res.json()
          if (Array.isArray(data.hashtags) && data.hashtags.length > 0) {
            setSuggestion(data.hashtags.join(' '))
          } else {
            setSuggestion(fallback)
          }
        } else {
          const res = await fetch('/api/ai/best-time', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: activeWorkspaceId, networks }),
            signal: controller.signal,
          })
          const data = await res.json()
          const rec = data.recommendation
          if (rec?.dayOfWeek && rec?.time && rec?.reason) {
            setSuggestion(`📅 ${rec.dayOfWeek} a las ${rec.time} hs\n\n${rec.reason}`)
            setScheduleData({ dayOfWeek: rec.dayOfWeek, time: rec.time, reason: rec.reason })
          } else {
            setSuggestion(fallback)
            // Parsear el fallback "📅 Miércoles a las 18:00 hs\n\nReason..."
            const match = fallback.match(/📅\s+(\S+)\s+a las\s+(\d{1,2}:\d{2})/)
            if (match) {
              setScheduleData({
                dayOfWeek: match[1],
                time: match[2],
                reason: fallback.split('\n\n')[1] ?? '',
              })
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setSuggestion(fallback)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchSuggestion()

    return () => controller.abort()
  }, [type, content, networks, activeWorkspaceId])

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
              <Image src="/images/copi.png" alt="Copi" width={24} height={24} className="rounded-full" />
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
            onClick={() =>
              onAccept(suggestion, type === 'schedule' ? scheduleData ?? undefined : undefined)
            }
            className="w-full mt-3 bg-[#0095b6] text-white text-sm rounded-lg py-2 hover:bg-[#007a94] transition-colors"
          >
            Aplicar sugerencia
          </button>
        </>
      ) : null}
    </div>
  )
}
