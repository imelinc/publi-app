"use client"

import { useEffect, useState } from "react"
import { useAppStore } from "@/store/use-app-store"
import { useToast } from "@/components/ui/use-toast"
import type { EventType } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CalendarDays, AlertTriangle, ChevronDown, Clock, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface EventModalProps {
  open: boolean
  onClose: () => void
  selectedDate: Date | null
}

const COLOR_OPTIONS = [
  "#0095b6",
  "#ffb703",
  "#ef4444",
  "#22c55e",
  "#a855f7",
  "#f97316",
]

function buildLocalDateTimeISO(dateStr: string, time: string): string {
  const [yyyy, mm, dd] = dateStr.split("-").map((n) => parseInt(n, 10))
  const [hh, min] = time.split(":").map((n) => parseInt(n, 10))
  const combined = new Date(yyyy, (mm ?? 1) - 1, dd, hh, min, 0, 0)
  return combined.toISOString()
}

function toDateInputValue(date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

export function EventModal({ open, onClose, selectedDate }: EventModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<EventType>("event")
  const [color, setColor] = useState("#0095b6")
  const [clientId, setClientId] = useState("")
  const [isAllDay, setIsAllDay] = useState(true)
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [date, setDate] = useState<string>(toDateInputValue(new Date()))

  const addEvent = useAppStore((s) => s.addEvent)
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId)
  const clients = useAppStore((s) => s.clients)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setDate(toDateInputValue(selectedDate ?? new Date()))
    }
  }, [open, selectedDate])

  useEffect(() => {
    if (!open) {
      setTitle("")
      setDescription("")
      setType("event")
      setColor("#0095b6")
      setClientId(activeWorkspaceId)
      setIsAllDay(true)
      setStartTime("09:00")
      setEndTime("10:00")
    }
  }, [open, activeWorkspaceId])

  useEffect(() => {
    if (open && !clientId) {
      setClientId(activeWorkspaceId)
    }
  }, [open, activeWorkspaceId, clientId])

  function handleSave() {
    if (!title.trim() || !date) return

    if (!isAllDay && type === "event") {
      if (endTime <= startTime) {
        toast({
          title: "Horario inválido",
          description: "La hora de fin debe ser posterior a la de inicio.",
        })
        return
      }
    }

    let dateValue: string
    let endAt: string | null

    if (isAllDay) {
      dateValue = date
      endAt = null
    } else if (type === "deadline") {
      dateValue = buildLocalDateTimeISO(date, startTime)
      endAt = null
    } else {
      dateValue = buildLocalDateTimeISO(date, startTime)
      endAt = buildLocalDateTimeISO(date, endTime)
    }

    addEvent({
      clientId,
      title: title.trim(),
      description: description.trim(),
      type,
      color,
      date: dateValue,
      endAt,
      isAllDay,
    })

    toast({ title: "Evento agregado" })
    onClose()
  }

  // Define dynamic header theme based on type
  const isTypeEvent = type === "event"
  const themeBg = isTypeEvent
    ? "from-[#0095b6]/10 to-[#00b4d8]/5"
    : "from-rose-500/10 to-red-500/5"
  const themeIconBg = isTypeEvent
    ? "bg-[#0095b6]/10 text-[#0095b6]"
    : "bg-rose-500/10 text-rose-600"
  const themeColor = isTypeEvent ? "#0095b6" : "#ef4444"
  const themeIcon = isTypeEvent ? <CalendarDays className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-3xl border border-slate-100 shadow-2xl bg-white">
        {/* Gradient Header */}
        <div className={cn("px-6 pt-6 pb-5 relative overflow-hidden bg-gradient-to-br", themeBg)}>
          <div
            className="absolute -right-8 -top-8 w-28 h-28 rounded-full opacity-[0.08] blur-xl"
            style={{ backgroundColor: themeColor }}
          />
          <div className="flex items-center gap-3">
            <div className={cn("h-11 w-11 flex items-center justify-center rounded-xl shrink-0 shadow-3xs", themeIconBg)}>
              {themeIcon}
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-base font-extrabold text-gray-900">
                Agregar al calendario
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 font-medium">
                Creá un evento o una fecha límite para tu organización
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Título */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Título <span className="text-red-400">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Entrega de contenidos de junio"
              className="rounded-xl border-slate-200 focus-visible:ring-primary focus-visible:border-primary h-10 transition-all text-sm font-semibold shadow-3xs"
            />
          </div>

          {/* Grid: Fecha y Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Fecha <span className="text-red-400">*</span>
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border-slate-200 focus-visible:ring-primary focus-visible:border-primary h-10 transition-all text-sm font-semibold shadow-3xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Cliente
              </label>
              <div className="relative">
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-3 pr-10 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer appearance-none font-semibold shadow-3xs"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Descripción
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre el evento..."
              rows={2}
              className="rounded-xl border-slate-200 focus-visible:ring-primary focus-visible:border-primary transition-all text-sm font-semibold resize-none shadow-3xs"
            />
          </div>

          {/* Tipo de Evento / Deadline */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tipo de registro
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("event")}
                className={cn(
                  "flex flex-col p-3 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer shadow-3xs",
                  type === "event"
                    ? "border-primary bg-primary/[0.03] text-primary"
                    : "border-slate-150 bg-white hover:border-slate-300 text-gray-600 hover:text-gray-900"
                )}
              >
                <CalendarDays className="h-4 w-4 mb-1.5 shrink-0" />
                <p className="text-xs font-bold uppercase tracking-tight">Evento</p>
                <p className="text-[9px] text-gray-400 font-medium leading-tight mt-0.5">
                  Planificación o reunión.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setType("deadline")}
                className={cn(
                  "flex flex-col p-3 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer shadow-3xs",
                  type === "deadline"
                    ? "border-rose-500 bg-rose-500/[0.03] text-rose-600"
                    : "border-slate-150 bg-white hover:border-slate-300 text-gray-600 hover:text-gray-900"
                )}
              >
                <AlertTriangle className="h-4 w-4 mb-1.5 shrink-0" />
                <p className="text-xs font-bold uppercase tracking-tight">Fecha límite</p>
                <p className="text-[9px] text-gray-400 font-medium leading-tight mt-0.5">
                  Vencimiento o deadline.
                </p>
              </button>
            </div>
          </div>

          {/* Selección de color e interruptor de horario */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Color */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Color identificador
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-6 h-6 rounded-full transition-all duration-200 hover:scale-110 relative cursor-pointer shadow-3xs",
                      color === c ? "ring-2 ring-offset-2 ring-primary scale-105" : ""
                    )}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && (
                      <span className="absolute inset-0 flex items-center justify-center text-white text-[9px] font-extrabold">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Todo el día toggle */}
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2.5 cursor-pointer group h-10 select-none">
                <input
                  type="checkbox"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="h-4.5 w-4.5 rounded-lg border-slate-300 text-primary focus:ring-primary accent-primary cursor-pointer shadow-3xs"
                />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-800 font-bold group-hover:text-gray-900 transition-colors">Durar todo el día</span>
                  <span className="text-[9px] text-gray-400 font-medium">Sin horario definido</span>
                </div>
              </label>
            </div>
          </div>

          {/* Horario Condicional */}
          {!isAllDay && (
            <div className="border-t border-slate-100 pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
              {type === "deadline" ? (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Hora límite</label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="rounded-xl border-slate-200 focus-visible:ring-primary focus-visible:border-primary h-10 transition-all text-sm font-semibold shadow-3xs bg-white w-full sm:w-1/2"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Hora inicio</label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="rounded-xl border-slate-200 focus-visible:ring-primary focus-visible:border-primary h-10 transition-all text-sm font-semibold shadow-3xs bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Hora fin</label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="rounded-xl border-slate-200 focus-visible:ring-primary focus-visible:border-primary h-10 transition-all text-sm font-semibold shadow-3xs bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 pb-6 pt-3 gap-2 sm:gap-0 border-t border-slate-50">
          <Button variant="outline" onClick={onClose} className="rounded-xl h-10 text-xs font-bold border-slate-200 hover:bg-slate-50 hover:text-gray-700 cursor-pointer">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || !date}
            className="bg-gradient-to-r from-[#0095b6] to-[#00b4d8] text-white hover:opacity-95 shadow-[0_4px_12px_rgba(0,149,182,0.2)] rounded-xl transition-all h-10 px-6 font-bold text-xs cursor-pointer border border-transparent"
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
