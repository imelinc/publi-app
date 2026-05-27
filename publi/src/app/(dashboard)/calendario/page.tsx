"use client"

import { useState, useMemo } from "react"
import { useAppStore } from "@/store/use-app-store"
import { CalendarGrid } from "@/components/dashboard/CalendarGrid"
import { DraftPanel } from "@/components/dashboard/DraftPanel"
import { EventModal } from "@/components/dashboard/EventModal"
import type { Post, CalendarEvent } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  PanelRightOpen,
  PanelRightClose,
  Calendar,
  Clock,
  Trash2,
  RefreshCw,
} from "lucide-react"

export default function CalendarioPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [draftPanelOpen, setDraftPanelOpen] = useState(true)
  const [viewMode, setViewMode] = useState<"month" | "week">("month")
  const [clientFilter, setClientFilter] = useState("all")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const { posts, events, deleteEvent, clients, fetchPosts, fetchEvents } = useAppStore()
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await Promise.all([fetchPosts(), fetchEvents()])
    } finally {
      setRefreshing(false)
    }
  }

  const filteredPosts = useMemo(() => {
    if (clientFilter === "all") return posts
    return posts.filter((p) => p.clientId === clientFilter)
  }, [posts, clientFilter])

  const filteredEvents = useMemo(() => {
    if (clientFilter === "all") return events
    return events.filter((e) => e.clientId === clientFilter)
  }, [events, clientFilter])

  function prevMonth() {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    )
  }

  function nextMonth() {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    )
  }

  function handleDayClick(date: Date) {
    setSelectedDate(date)
    setEventModalOpen(true)
  }

  function handlePostClick(post: Post) {
    setSelectedPost(post)
  }

  function handleEventClick(event: CalendarEvent) {
    setSelectedEvent(event)
  }

  const monthLabel = currentMonth.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  })
  const capitalizedMonthLabel =
    monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)

  const selectedEventClient = selectedEvent
    ? clients.find((c) => c.id === selectedEvent.clientId) ?? null
    : null

  return (
    <div className="flex gap-4 h-[calc(100vh-112px)]">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
              {capitalizedMonthLabel}
            </span>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex rounded-full bg-[#f5f0e8] p-1 ring-1 ring-[#e8f4f7]">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                viewMode === "month"
                  ? "bg-[#0095b6] text-white"
                  : "bg-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Mes
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                viewMode === "week"
                  ? "bg-[#0095b6] text-white"
                  : "bg-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Semana
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-700 outline-none"
            >
              <option value="all">Todos los clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refrescar para ver respuestas de aprobación recientes"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Actualizando…' : 'Actualizar'}
            </Button>

            <Button
              onClick={() => {
                setSelectedDate(new Date())
                setEventModalOpen(true)
              }}
              className="bg-[#0095b6] text-white text-sm hover:opacity-90"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar evento
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setDraftPanelOpen(!draftPanelOpen)}
            >
              {draftPanelOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <CalendarGrid
          currentMonth={currentMonth}
          posts={filteredPosts}
          events={filteredEvents}
          viewMode={viewMode}
          onDayClick={handleDayClick}
          onPostClick={handlePostClick}
          onEventClick={handleEventClick}
        />
      </div>

      {draftPanelOpen && <DraftPanel posts={filteredPosts} />}

      <EventModal
        open={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        selectedDate={selectedDate}
      />

      {selectedPost && (
        <Dialog
          open={!!selectedPost}
          onOpenChange={(open) => {
            if (!open) setSelectedPost(null)
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedPost.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: selectedPost.clientColor }}
                >
                  {selectedPost.clientName.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-sm text-gray-600">
                  {selectedPost.clientName}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {selectedPost.description}
              </p>
              <div className="flex gap-2">
                {selectedPost.networks.map((n) => (
                  <span
                    key={n}
                    className="text-xs bg-gray-100 px-2 py-1 rounded"
                  >
                    {n}
                  </span>
                ))}
              </div>
              {selectedPost.scheduledAt && (
                <p className="text-xs text-gray-400">
                  {new Date(
                    selectedPost.scheduledAt
                  ).toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
              <span
                className={`inline-block text-xs px-2 py-1 rounded ${
                  selectedPost.status === "scheduled"
                    ? "bg-blue-100 text-blue-700"
                    : selectedPost.status === "published"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                }`}
              >
                {selectedPost.status === "scheduled"
                  ? "Programada"
                  : selectedPost.status === "published"
                    ? "Publicada"
                    : "Borrador"}
              </span>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {selectedEvent && (
        <Dialog
          open={!!selectedEvent}
          onOpenChange={(open) => {
            if (!open) setSelectedEvent(null)
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: selectedEvent.color }}
                />
                {selectedEvent.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedEventClient && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ backgroundColor: selectedEventClient.color }}
                  >
                    {selectedEventClient.initials}
                  </div>
                  <span className="text-sm text-gray-600">
                    {selectedEventClient.name}
                  </span>
                </div>
              )}

              {selectedEvent.description && (
                <p className="text-sm text-gray-600">
                  {selectedEvent.description}
                </p>
              )}

              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {(() => {
                      // `selectedEvent.date` puede ser:
                      //  - 'YYYY-MM-DD' si isAllDay
                      //  - ISO completo con hora si !isAllDay
                      // En el primer caso, parseamos el mediodía local para evitar saltos de día por timezone.
                      const raw = selectedEvent.date ?? ""
                      const d = raw.includes("T")
                        ? new Date(raw)
                        : new Date(raw + "T12:00:00")
                      return isNaN(d.getTime())
                        ? raw
                        : d.toLocaleDateString("es-AR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                    })()}
                  </span>
                </div>

                {!selectedEvent.isAllDay && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>
                      {(() => {
                        const start = new Date(selectedEvent.date)
                        if (isNaN(start.getTime())) return ""
                        const fmt = (d: Date) =>
                          `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
                        if (selectedEvent.type === "deadline") {
                          return `Hasta las ${fmt(start)}`
                        }
                        if (selectedEvent.endAt) {
                          const end = new Date(selectedEvent.endAt)
                          if (!isNaN(end.getTime())) {
                            return `${fmt(start)} – ${fmt(end)}`
                          }
                        }
                        return fmt(start)
                      })()}
                    </span>
                  </div>
                )}

                <span
                  className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                    selectedEvent.type === "deadline"
                      ? "bg-red-50 text-red-600"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {selectedEvent.type === "deadline" ? "Deadline" : "Evento"}
                </span>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                  onClick={async () => {
                    try {
                      await deleteEvent(selectedEvent.id)
                    } catch {
                      // El error ya se maneja en el store / se puede agregar toast
                    }
                    setSelectedEvent(null)
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Eliminar evento
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
