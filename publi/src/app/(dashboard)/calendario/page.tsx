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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  PanelRightOpen,
  PanelRightClose,
  Calendar,
  Clock,
  Trash2,
  RefreshCw,
  Clock4,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { NETWORK_META } from "@/lib/networks"
import { cn } from "@/lib/utils"

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

  const handlePrev = () => {
    if (viewMode === "week") {
      setCurrentMonth(
        (prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7)
      )
    } else {
      setCurrentMonth(
        (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
      )
    }
  }

  const handleNext = () => {
    if (viewMode === "week") {
      setCurrentMonth(
        (prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7)
      )
    } else {
      setCurrentMonth(
        (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
      )
    }
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

  const capitalizedMonthLabel = useMemo(() => {
    if (viewMode === "month") {
      const monthLabel = currentMonth.toLocaleDateString("es-AR", {
        month: "long",
        year: "numeric",
      })
      return monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)
    } else {
      const day = currentMonth.getDay()
      const sundayOffset = -day
      const sunday = new Date(currentMonth)
      sunday.setDate(currentMonth.getDate() + sundayOffset)
      
      const saturday = new Date(sunday)
      saturday.setDate(sunday.getDate() + 6)
      
      const startDay = sunday.getDate()
      const endDay = saturday.getDate()
      
      if (sunday.getMonth() === saturday.getMonth()) {
        const monthStr = sunday.toLocaleDateString("es-AR", { month: "long" })
        const yearStr = sunday.getFullYear()
        return `Semana del ${startDay} al ${endDay} de ${monthStr} de ${yearStr}`
      } else {
        const startMonthStr = sunday.toLocaleDateString("es-AR", { month: "short" })
        const endMonthStr = saturday.toLocaleDateString("es-AR", { month: "long" })
        const endYearStr = saturday.getFullYear()
        return `Semana del ${startDay} de ${startMonthStr} al ${endDay} de ${endMonthStr} de ${endYearStr}`
      }
    }
  }, [currentMonth, viewMode])

  const selectedEventClient = selectedEvent
    ? clients.find((c) => c.id === selectedEvent.clientId) ?? null
    : null

  return (
    <div className="flex gap-4 h-[calc(100vh-112px)]">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-gray-100 shadow-sm">
            <Button variant="ghost" size="icon" onClick={handlePrev} className="h-8 w-8 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </Button>
            <span className="text-sm font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent min-w-[200px] text-center tracking-tight">
              {capitalizedMonthLabel}
            </span>
            <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </Button>
          </div>

          <div className="flex rounded-xl bg-gray-100/80 p-1 ring-1 ring-black/5 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                viewMode === "month"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "bg-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Mes
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                viewMode === "week"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "bg-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Semana
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <div className="relative">
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="h-9 rounded-xl border border-gray-200 bg-white pl-3 pr-8 text-xs font-medium text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer shadow-sm hover:border-gray-300 appearance-none"
              >
                <option value="all">Todos los clientes</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <ChevronDown className="h-3.5 w-3.5" />
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-sm transition-all"
              title="Refrescar para ver respuestas de aprobación recientes"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Actualizando…' : 'Actualizar'}
            </Button>

            <Button
              onClick={() => {
                setSelectedDate(new Date())
                setEventModalOpen(true)
              }}
              className="h-9 bg-gradient-to-r from-[#0095b6] to-[#00b4d8] text-white text-xs font-semibold hover:opacity-95 shadow-[0_4px_12px_rgba(0,149,182,0.25)] rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              size="sm"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Agregar evento
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setDraftPanelOpen(!draftPanelOpen)}
              className="h-9 w-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-800 shadow-sm transition-all"
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
          <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-3xl border border-slate-100 shadow-2xl bg-white">
            {/* Gradient Header matching brand color */}
            <div
              className="px-6 pt-6 pb-5 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${selectedPost.clientColor}18 0%, ${selectedPost.clientColor}08 100%)`,
              }}
            >
              <div
                className="absolute -right-8 -top-8 w-28 h-28 rounded-full opacity-[0.05] blur-xl"
                style={{ backgroundColor: selectedPost.clientColor }}
              />
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-xs shadow-3xs shrink-0"
                  style={{ backgroundColor: selectedPost.clientColor }}
                >
                  {selectedPost.clientName.slice(0, 2).toUpperCase()}
                </div>
                <div className="space-y-0.5">
                  <DialogTitle className="text-base font-extrabold text-gray-900 leading-tight">
                    {selectedPost.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-500 font-semibold">
                    Publicación de {selectedPost.clientName}
                  </DialogDescription>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Copy / Description Container */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Copy de publicación</span>
                <div className="text-xs text-slate-700 leading-relaxed font-semibold bg-slate-50/50 border border-slate-150 p-4 rounded-2xl italic shadow-3xs whitespace-pre-wrap">
                  {selectedPost.description || 'Sin copy redactado'}
                </div>
              </div>

              {/* Grid: Networks & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Redes */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Canales de difusión</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedPost.networks.map((n) => {
                      const meta = NETWORK_META[n]
                      return (
                        <span
                          key={n}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold bg-white border border-slate-150 text-slate-700 shadow-3xs"
                        >
                          {meta && (
                            <img src={meta.icon} alt="" width={10} height={10} className="size-3 object-contain shrink-0" />
                          )}
                          {meta ? meta.label : n}
                        </span>
                      )
                    })}
                  </div>
                </div>

                {/* Fecha programada */}
                {(selectedPost.scheduledAt || selectedPost.publishedAt) && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Fecha y Hora</span>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 pt-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {new Date(
                          (selectedPost.scheduledAt || selectedPost.publishedAt) as string
                        ).toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Estado</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-3xs mt-1",
                    selectedPost.status === "scheduled"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : selectedPost.status === "published"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                  )}
                >
                  <span className={cn("size-1.5 rounded-full shrink-0",
                    selectedPost.status === "scheduled" ? "bg-blue-500" :
                    selectedPost.status === "published" ? "bg-emerald-500 animate-pulse" :
                    "bg-slate-400"
                  )} />
                  {selectedPost.status === "scheduled"
                    ? "Programada"
                    : selectedPost.status === "published"
                      ? "Publicada"
                      : "Borrador"}
                </span>
              </div>
            </div>

            <DialogFooter className="px-6 pb-6 pt-3 border-t border-slate-50">
              <Button
                onClick={() => setSelectedPost(null)}
                className="w-full bg-[#0095b6] hover:bg-[#007a94] text-white rounded-xl font-bold h-10 text-xs shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer border border-transparent"
              >
                Cerrar
              </Button>
            </DialogFooter>
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
          <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-3xl border border-slate-100 shadow-2xl bg-white">
            {/* Gradient Header matching event color */}
            <div
              className="px-6 pt-6 pb-5 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${selectedEvent.color}18 0%, ${selectedEvent.color}08 100%)`,
              }}
            >
              <div
                className="absolute -right-8 -top-8 w-28 h-28 rounded-full opacity-[0.05] blur-xl"
                style={{ backgroundColor: selectedEvent.color }}
              />
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-3xs"
                  style={{ backgroundColor: selectedEvent.color }}
                >
                  <span className="text-white text-base">
                    {selectedEvent.type === "deadline" ? "⏰" : "📅"}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <DialogTitle className="text-base font-extrabold text-gray-900 leading-tight">
                    {selectedEvent.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-500 font-semibold">
                    {selectedEvent.type === "deadline" ? "Fecha límite establecida" : "Evento calendarizado"}
                  </DialogDescription>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Description */}
              {selectedEvent.description && (
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Descripción</span>
                  <div className="text-xs text-slate-700 leading-relaxed font-semibold bg-slate-50/50 border border-slate-150 p-4 rounded-2xl italic shadow-3xs">
                    {selectedEvent.description}
                  </div>
                </div>
              )}

              {/* Grid: Client & Time details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Cliente */}
                {selectedEventClient && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Asociado a cliente</span>
                    <div className="flex items-center gap-2 pt-1">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[9px] font-bold shadow-3xs"
                        style={{ backgroundColor: selectedEventClient.color }}
                      >
                        {selectedEventClient.initials}
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        {selectedEventClient.name}
                      </span>
                    </div>
                  </div>
                )}

                {/* Fecha */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Fecha programada</span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 pt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {(() => {
                        const raw = selectedEvent.date ?? ""
                        const d = raw.includes("T")
                          ? new Date(raw)
                          : new Date(raw + "T12:00:00")
                        return isNaN(d.getTime())
                          ? raw
                          : d.toLocaleDateString("es-AR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                      })()}
                    </span>
                  </div>
                </div>

                {/* Horario (Si no es todo el día) */}
                {!selectedEvent.isAllDay && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Horario</span>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 pt-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
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
                  </div>
                )}

                {/* Tipo de evento badge */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Tipo</span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border shadow-3xs mt-1",
                      selectedEvent.type === "deadline"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    )}
                  >
                    {selectedEvent.type === "deadline" ? "Deadline" : "Evento"}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="px-6 pb-6 pt-3 border-t border-slate-50 flex flex-col-reverse sm:flex-row justify-between gap-2.5">
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 rounded-xl font-bold h-10 text-xs cursor-pointer transition-all shadow-3xs"
                onClick={async () => {
                  try {
                    await deleteEvent(selectedEvent.id)
                  } catch {}
                  setSelectedEvent(null)
                }}
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Eliminar evento
              </Button>
              <Button
                onClick={() => setSelectedEvent(null)}
                className="bg-[#0095b6] hover:bg-[#007a94] text-white rounded-xl font-bold h-10 text-xs shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer border border-transparent flex-1"
              >
                Listo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
