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
import { CalendarDays, AlertTriangle } from "lucide-react"

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar al calendario</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título <span className="text-red-400">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre del evento"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha <span className="text-red-400">*</span>
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción opcional..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setType("event")}
                className={`flex-1 p-3 rounded-lg border-2 text-left transition ${
                  type === "event"
                    ? "border-[#0095b6] bg-[#cceef5]/30"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <CalendarDays className="h-5 w-5 mb-1" />
                <p className="text-sm font-medium">Evento</p>
                <p className="text-xs text-gray-400">
                  Registrá un evento importante
                </p>
              </button>
              <button
                type="button"
                onClick={() => setType("deadline")}
                className={`flex-1 p-3 rounded-lg border-2 text-left transition ${
                  type === "deadline"
                    ? "border-[#0095b6] bg-[#cceef5]/30"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <AlertTriangle className="h-5 w-5 mb-1" />
                <p className="text-sm font-medium">Fecha límite</p>
                <p className="text-xs text-gray-400">
                  Marcá una entrega o deadline
                </p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-5 h-5 rounded-full transition ${
                    color === c ? "ring-2 ring-offset-1 ring-gray-400" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                {type === "deadline" ? "Horario" : "Duración"}
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#0095b6] focus:ring-[#0095b6]"
                />
                <span className="text-sm text-gray-700">Todo el día</span>
              </label>
            </div>
            {!isAllDay && type === "deadline" && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hora límite</label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            )}
            {!isAllDay && type === "event" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Inicio</label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Fin</label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full h-8 rounded-lg border border-gray-200 bg-white px-2.5 text-sm text-gray-700 outline-none"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || !date}
            className="bg-[#0095b6] text-white hover:opacity-90"
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
