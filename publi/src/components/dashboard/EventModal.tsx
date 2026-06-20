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
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CalendarDays, AlertTriangle, ChevronDown } from "lucide-react"

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
  // dateStr en formato 'YYYY-MM-DD'. time en 'HH:MM'.
  // Devuelve un ISO en zona local convertido a UTC.
  const [yyyy, mm, dd] = dateStr.split("-").map((n) => parseInt(n, 10))
  const [hh, min] = time.split(":").map((n) => parseInt(n, 10))
  const combined = new Date(yyyy, (mm ?? 1) - 1, dd, hh, min, 0, 0)
  return combined.toISOString()
}

function toDateInputValue(date: Date): string {
  // Devuelve 'YYYY-MM-DD' en zona local (no UTC, para que <input type="date"> muestre el día correcto)
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

  // Cuando se abre el modal: pre-rellenar la fecha con la del día seleccionado
  // (o el día de hoy si no se pasó ninguna). El usuario puede cambiarla.
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

    // Validación de horario: solo para eventos con rango (type='event' && !isAllDay).
    // Para deadlines basta con una sola hora límite.
    if (!isAllDay && type === "event") {
      if (endTime <= startTime) {
        toast({
          title: "Horario inválido",
          description: "La hora de fin debe ser posterior a la de inicio.",
        })
        return
      }
    }

    // Construir date y endAt según tipo:
    //  - all-day: date es 'YYYY-MM-DD', endAt null
    //  - deadline con hora: date = fecha+horaLímite, endAt null (punto en el tiempo)
    //  - event con rango: date = fecha+horaInicio, endAt = fecha+horaFin
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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl border-gray-100 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Agregar al calendario
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Título <span className="text-red-400">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre del evento"
              className="rounded-xl border-gray-200 focus-visible:ring-primary focus-visible:border-primary h-10 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Fecha <span className="text-red-400">*</span>
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border-gray-200 focus-visible:ring-primary focus-visible:border-primary h-10 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Descripción
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción opcional..."
              rows={3}
              className="rounded-xl border-gray-200 focus-visible:ring-primary focus-visible:border-primary transition-all text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Tipo
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setType("event")}
                className={`flex-1 p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                  type === "event"
                    ? "border-primary bg-primary/5 text-primary shadow-xs"
                    : "border-gray-150 bg-white hover:border-gray-300 text-gray-600 hover:text-gray-900"
                }`}
              >
                <CalendarDays className="h-5 w-5 mb-1" />
                <p className="text-xs font-bold uppercase tracking-wide">Evento</p>
                <p className="text-[10px] text-gray-400/90 mt-0.5">
                  Registrá un evento importante
                </p>
              </button>
              <button
                type="button"
                onClick={() => setType("deadline")}
                className={`flex-1 p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                  type === "deadline"
                    ? "border-primary bg-primary/5 text-primary shadow-xs"
                    : "border-gray-150 bg-white hover:border-gray-300 text-gray-600 hover:text-gray-900"
                }`}
              >
                <AlertTriangle className="h-5 w-5 mb-1" />
                <p className="text-xs font-bold uppercase tracking-wide">Fecha límite</p>
                <p className="text-[10px] text-gray-400/90 mt-0.5">
                  Marcá una entrega o deadline
                </p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Color
            </label>
            <div className="flex gap-2.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-all duration-200 hover:scale-110 relative ${
                    color === c ? "ring-2 ring-offset-2 ring-primary scale-105" : ""
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && (
                    <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {type === "deadline" ? "Horario" : "Duración"}
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                />
                <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors font-semibold">Todo el día</span>
              </label>
            </div>
            {!isAllDay && type === "deadline" && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Hora límite</label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="rounded-xl border-gray-200 focus-visible:ring-primary focus-visible:border-primary h-10 transition-all text-sm"
                />
              </div>
            )}
            {!isAllDay && type === "event" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Inicio</label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="rounded-xl border-gray-200 focus-visible:ring-primary focus-visible:border-primary h-10 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Fin</label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="rounded-xl border-gray-200 focus-visible:ring-primary focus-visible:border-primary h-10 transition-all text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Cliente
            </label>
            <div className="relative">
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full h-10 rounded-xl border border-gray-200 bg-white pl-3 pr-10 text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer appearance-none font-medium"
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

        <DialogFooter className="mt-2 gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="rounded-xl h-10 border-gray-200 hover:bg-gray-50 hover:text-gray-700">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || !date}
            className="bg-gradient-to-r from-[#0095b6] to-[#00b4d8] text-white hover:opacity-95 shadow-[0_4px_12px_rgba(0,149,182,0.2)] rounded-xl transition-all h-10 px-6 font-semibold"
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
