'use client'

import { useRouter } from 'next/navigation'
import type { Post, CalendarEvent } from '@/types'

interface MiniCalendarProps {
  posts: Post[]
  events?: CalendarEvent[]
}

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

function getWeekDays(): Date[] {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function toDateString(d: Date): string {
  // Zona horaria local (no UTC) para evitar saltos de día en GMT-X
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function MiniCalendar({ posts, events = [] }: MiniCalendarProps) {
  const router = useRouter()
  const weekDays = getWeekDays()
  const today = new Date()

  const postsByDay = weekDays.map((day) => {
    const dateStr = toDateString(day)
    return posts.filter((p) => {
      const postDate = p.scheduledAt ?? p.publishedAt
      return postDate !== null && postDate.startsWith(dateStr)
    })
  })

  const eventsByDay = weekDays.map((day) => {
    const dateStr = toDateString(day)
    // `e.date` puede ser 'YYYY-MM-DD' (all-day) o ISO completo con hora.
    return events.filter((e) => (e.date ?? '').slice(0, 10) === dateStr)
  })

  const firstDay = weekDays[0]
  const lastDay = weekDays[6]
  const rangeLabel = `${firstDay.getDate()} - ${lastDay.getDate()} de ${MONTH_NAMES[lastDay.getMonth()]}`

  return (
    <div className="premium-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Esta semana</h3>
        <span className="text-sm text-gray-400">{rangeLabel}</span>
      </div>

      <div className="grid grid-cols-7 gap-2 mt-4">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-xs text-gray-400 text-center pb-2 font-medium"
          >
            {label}
          </div>
        ))}

        {weekDays.map((day, i) => {
          const dayPosts = postsByDay[i]
          const dayEvents = eventsByDay[i]
          const isToday = isSameDay(day, today)
          const totalItems = dayPosts.length + dayEvents.length

          return (
            <div key={day.toISOString()} className="flex flex-col items-center min-h-[80px]">
              {isToday ? (
                <div className="w-7 h-7 rounded-full bg-[#0095b6] text-white flex items-center justify-center text-xs font-semibold">
                  {day.getDate()}
                </div>
              ) : (
                <span className="text-sm text-gray-700">{day.getDate()}</span>
              )}

              <div className="flex flex-col gap-1 mt-2 items-center w-full px-2">
                {/* Posts como barras verticales */}
                {dayPosts.slice(0, 3).map((post) => (
                  <div
                    key={post.id}
                    className="w-2 h-8 rounded-full"
                    style={{ backgroundColor: post.clientColor }}
                    title={post.title}
                  />
                ))}

                {/* Eventos / deadlines como puntos de color */}
                {dayEvents.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap justify-center">
                    {dayEvents.slice(0, 4).map((event) => (
                      <div
                        key={event.id}
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: event.color }}
                        title={`${event.type === 'deadline' ? '⏰' : '📅'} ${event.title}`}
                      />
                    ))}
                    {dayEvents.length > 4 && (
                      <span className="text-[9px] text-gray-400 leading-none">
                        +{dayEvents.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {totalItems > 3 && (
                  <span className="text-xs text-gray-400 mt-1">
                    +{totalItems - 3}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={() => router.push('/calendario')}
        className="text-sm text-primary text-center mt-4 hover:text-primary/80 w-full block transition-colors"
      >
        Ver calendario completo
      </button>
    </div>
  )
}
