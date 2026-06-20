"use client"

import { useMemo } from "react"
import type { Post, CalendarEvent, Network } from "@/types"
import { NETWORK_META } from "@/lib/networks"

interface CalendarGridProps {
  currentMonth: Date
  posts: Post[]
  events: CalendarEvent[]
  viewMode: "month" | "week"
  onDayClick: (date: Date) => void
  onPostClick: (post: Post) => void
  onEventClick: (event: CalendarEvent) => void
}

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

function getDaysInGrid(month: Date): Date[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  let startDow = firstDay.getDay()
  startDow = startDow === 0 ? 6 : startDow - 1
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  const days: Date[] = []
  for (let i = startDow; i > 0; i--) {
    days.push(new Date(month.getFullYear(), month.getMonth(), 1 - i))
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(month.getFullYear(), month.getMonth(), i))
  }
  while (days.length % 7 !== 0) {
    days.push(
      new Date(
        month.getFullYear(),
        month.getMonth() + 1,
        days.length - lastDay.getDate() - startDow + 1
      )
    )
  }
  return days
}

function getWeekDays(referenceDate: Date): Date[] {
  const day = referenceDate.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(referenceDate)
  monday.setDate(referenceDate.getDate() + mondayOffset)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function formatDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
}

function getPostsForDay(posts: Post[], date: Date): Post[] {
  const dateStr = formatDateKey(date)
  return posts.filter((p) => {
    const postDate = p.scheduledAt ?? p.publishedAt
    return postDate !== null && postDate.startsWith(dateStr)
  })
}

function getEventsForDay(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const dateStr = formatDateKey(date)
  // `date` puede ser 'YYYY-MM-DD' (all-day) o ISO con hora.
  // Comparamos solo la parte de fecha.
  return events.filter((e) => (e.date ?? '').slice(0, 10) === dateStr)
}

function formatEventTime(event: CalendarEvent): string | null {
  if (event.isAllDay) return null
  const start = new Date(event.date)
  if (isNaN(start.getTime())) return null
  const hh = String(start.getHours()).padStart(2, '0')
  const mm = String(start.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

const EVENT_TYPE_ICONS: Record<string, string> = {
  event: "📅",
  deadline: "⏰",
}

export function CalendarGrid({
  currentMonth,
  posts,
  events,
  viewMode,
  onDayClick,
  onPostClick,
  onEventClick,
}: CalendarGridProps) {
  const today = useMemo(() => new Date(), [])

  const monthDays = useMemo(() => getDaysInGrid(currentMonth), [currentMonth])
  const weekDays = useMemo(() => getWeekDays(currentMonth), [currentMonth])

  const days = viewMode === "month" ? monthDays : weekDays

  return (
    <div className="flex flex-col flex-1 overflow-hidden rounded-2xl border border-gray-100 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="grid grid-cols-7 bg-gray-50/50 border-b border-gray-100/80">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-[10px] font-bold text-gray-400 text-center py-3 uppercase tracking-wider"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1 overflow-auto divide-x divide-y divide-gray-100/80 border-b border-r border-gray-100/80">
        {days.map((date, i) => {
          const isCurrentMonth =
            date.getMonth() === currentMonth.getMonth() &&
            date.getFullYear() === currentMonth.getFullYear()
          const isToday = isSameDay(date, today)
          const dayPosts = getPostsForDay(posts, date)
          const dayEvents = getEventsForDay(events, date)
          const maxChips = 3
          const totalItems = dayPosts.length + dayEvents.length
          const overflow = totalItems > maxChips ? totalItems - maxChips : 0
          // Mostrar eventos primero (deadlines son críticos), luego posts
          const eventsToShow = Math.min(dayEvents.length, maxChips)
          const remainingSlots = maxChips - eventsToShow
          const postsToShow = Math.min(dayPosts.length, remainingSlots)

          return (
            <div
              key={i}
              onClick={() => onDayClick(date)}
              className={`min-h-[110px] p-2.5 cursor-pointer transition-all duration-200 hover:bg-slate-50/60 relative group flex flex-col justify-between ${
                isToday ? "bg-primary/2" : "bg-white"
              } ${
                !isCurrentMonth && viewMode === "month" ? "opacity-35 bg-gray-50/40" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  {isToday ? (
                    <span className="bg-gradient-to-br from-[#0095b6] to-[#00b4d8] text-white rounded-lg w-6 h-6 flex items-center justify-center text-xs font-bold shadow-[0_2px_8px_rgba(0,149,182,0.3)]">
                      {date.getDate()}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500 font-bold group-hover:text-gray-900 transition-colors">
                      {date.getDate()}
                    </span>
                  )}
                  {viewMode === "week" && (
                    <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                      {date.toLocaleDateString("es-AR", { month: "short" })}
                    </span>
                  )}
                </div>
                
                <div className="space-y-1">
                  {dayEvents.slice(0, eventsToShow).map((event) => {
                    const time = formatEventTime(event)
                    return (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEventClick(event)
                        }}
                        className="flex items-center gap-1 text-[10px] rounded-lg px-2 py-1.5 cursor-pointer truncate border border-gray-100/50 border-l-4 font-semibold transition-all duration-200 hover:scale-[1.02] hover:shadow-xs active:scale-[0.98]"
                        style={{
                          borderLeftColor: event.color,
                          backgroundColor: event.color + "12",
                          color: event.color,
                        }}
                      >
                        <span className="shrink-0 text-[10px]">{EVENT_TYPE_ICONS[event.type] ?? "📅"}</span>
                        {time && <span className="shrink-0 text-[9px] opacity-75 font-mono">{time}</span>}
                        <span className="truncate font-medium">{event.title}</span>
                      </div>
                    )
                  })}

                  {dayPosts.slice(0, postsToShow).map((post) => {
                    const color = post.clientColor
                    const firstNetwork = post.networks[0] as Network | undefined
                    const iconPath = firstNetwork ? NETWORK_META[firstNetwork].icon : ""
                    const isStory = post.contentFormat === 'story'
                    const leftBorderColor = isStory ? "#ffb703" : color
                    return (
                      <div
                        key={post.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onPostClick(post)
                        }}
                        className="flex items-center gap-1.5 text-[10px] rounded-lg px-2 py-1.5 cursor-pointer truncate border border-gray-100/50 border-l-4 font-semibold transition-all duration-200 hover:scale-[1.02] hover:shadow-xs active:scale-[0.98]"
                        style={{
                          borderLeftColor: leftBorderColor,
                          backgroundColor: color + "12",
                          color: color,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={iconPath}
                          alt=""
                          width={10}
                          height={10}
                          className="shrink-0 opacity-80"
                        />
                        {isStory && (
                          <span
                            className="text-[7px] font-extrabold px-1 rounded shrink-0 uppercase tracking-wider"
                            style={{
                              color: "#ffb703",
                              backgroundColor: "#ffb70312",
                              border: "1px solid #ffb70330",
                            }}
                          >
                            Story
                          </span>
                        )}
                        <span className="truncate font-medium">{post.title}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {overflow > 0 && (
                <div className="text-[9px] text-gray-400 font-bold bg-gray-50 px-1.5 py-0.5 rounded self-start mt-1">
                  +{overflow} más
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
