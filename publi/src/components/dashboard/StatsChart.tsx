'use client'

import { useMemo } from 'react'
import type { Post } from '@/types'

interface StatsChartProps {
  posts: Post[]
  period: '7d' | '30d' | '3m'
}

function getWeekRange(weekOffset: number): { start: Date; end: Date } {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const thisMonday = new Date(now)
  thisMonday.setDate(now.getDate() + mondayOffset)
  thisMonday.setHours(0, 0, 0, 0)

  const weekStart = new Date(thisMonday)
  weekStart.setDate(thisMonday.getDate() - weekOffset * 7)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  return { start: weekStart, end: weekEnd }
}

function countPublishedInWeek(posts: Post[], start: Date, end: Date): number {
  return (posts || []).filter((p) => {
    if (!p || p.status !== 'published') return false
    const dateStr = p.scheduledAt ?? p.createdAt
    if (!dateStr) return false
    const d = new Date(dateStr)
    return !isNaN(d.getTime()) && d >= start && d <= end
  }).length
}

const DAY_LABELS_7D = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export function StatsChart({ posts, period }: StatsChartProps) {
  const bars = useMemo(() => {
    if (period === '7d') {
      const now = new Date()
      const dayOfWeek = now.getDay()
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monday = new Date(now)
      monday.setDate(now.getDate() + mondayOffset)
      monday.setHours(0, 0, 0, 0)

      return Array.from({ length: 7 }, (_, i) => {
        const dayStart = new Date(monday)
        dayStart.setDate(monday.getDate() + i)
        dayStart.setHours(0, 0, 0, 0)

        const dayEnd = new Date(dayStart)
        dayEnd.setHours(23, 59, 59, 999)

        const count = (posts || []).filter((p) => {
          if (!p) return false
          const dateStr = p.scheduledAt ?? p.createdAt
          if (!dateStr) return false
          const d = new Date(dateStr)
          return !isNaN(d.getTime()) && d >= dayStart && d <= dayEnd
        }).length

        return {
          label: DAY_LABELS_7D[i],
          value: count,
        }
      })
    }

    const weekCount = period === '30d' ? 4 : 12
    return Array.from({ length: weekCount }, (_, i) => {
      const { start, end } = getWeekRange(weekCount - 1 - i)
      return {
        label: `Sem ${i + 1}`,
        value: countPublishedInWeek(posts, start, end),
      }
    })
  }, [posts, period])

  const maxValue = Math.max(...bars.map((b) => b.value), 1)

  const yMax = Math.ceil(maxValue / 5) * 5 || 5
  const ySteps = Math.ceil(yMax / 5) || 1

  return (
    <div className="relative">
      <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between">
        {Array.from({ length: ySteps + 1 }, (_, i) => {
          const val = yMax - (yMax / ySteps) * i
          return (
            <span key={i} className="text-[10px] font-bold text-gray-400 w-6 text-right block pr-1">
              {Math.round(val)}
            </span>
          )
        })}
      </div>

      <div className="ml-8">
        <div className="h-80 flex items-end justify-around gap-6 px-4 py-4 relative">
          {Array.from({ length: ySteps + 1 }, (_, i) => (
            <div
              key={`line-${i}`}
              className="absolute left-0 right-0 border-t border-dashed border-gray-100/60"
              style={{ bottom: `${(i / ySteps) * 100}%`, top: 'auto' }}
            />
          ))}

          {bars.map((bar) => (
            <div key={bar.label} className="flex flex-col items-center gap-2 flex-1 max-w-[50px] group">
              <div
                className="rounded-t-xl transition-all duration-300 hover:brightness-105 hover:shadow-[0_4px_12px_rgba(0,149,182,0.15)] w-full min-w-[24px] cursor-pointer hover:scale-[1.03] active:scale-[0.97]"
                style={{
                  height: `${Math.max((bar.value / yMax) * 250, bar.value > 0 ? 12 : 6)}px`,
                  background:
                    bar.value > 0
                      ? 'linear-gradient(to top, #0095b6 0%, #00b4d8 100%)'
                      : '#f3f4f6',
                }}
                title={`${bar.value} publicaciones`}
              />
              <span className="text-[9px] font-bold text-gray-450 uppercase tracking-wider group-hover:text-gray-700 transition-colors">{bar.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
