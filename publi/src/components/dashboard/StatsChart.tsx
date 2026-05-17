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
  return posts.filter((p) => {
    if (p.status !== 'published') return false
    const dateStr = p.scheduledAt ?? p.createdAt
    const d = new Date(dateStr)
    return d >= start && d <= end
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

        const count = posts.filter((p) => {
          const dateStr = p.scheduledAt ?? p.createdAt
          const d = new Date(dateStr)
          return d >= dayStart && d <= dayEnd
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
            <span key={i} className="text-xs text-gray-300 w-6 text-right block">
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
              className="absolute left-0 right-0 border-t border-gray-100"
              style={{ bottom: `${(i / ySteps) * 100}%`, top: 'auto' }}
            />
          ))}

          {bars.map((bar) => (
            <div key={bar.label} className="flex flex-col items-center gap-2 flex-1 max-w-[60px]">
              <div
                className="rounded-t-lg transition-shadow hover:shadow-md w-full min-w-[28px]"
                style={{
                  height: `${Math.max((bar.value / yMax) * 260, bar.value > 0 ? 10 : 0)}px`,
                  background:
                    bar.value > 0
                      ? 'linear-gradient(to top, #0095b6, #cceef5)'
                      : '#e5e7eb',
                }}
                title={`${bar.value} publicaciones`}
              />
              <span className="text-xs text-gray-400">{bar.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
