"use client"

import { useEffect, useState } from "react"
import { WORKSPACES, EventType } from "@/lib/mock-data"
import { useAppStore } from "@/store/use-app-store"
import { useToast } from "@/components/ui/use-toast"
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

export function EventModal({ open, onClose, selectedDate }: EventModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<EventType>("event")
  const [color, setColor] = useState("#0095b6")
  const [workspaceId, setWorkspaceId] = useState("")

  const addEvent = useAppStore((s) => s.addEvent)
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId)
  const { toast } = useToast()

  useEffect(() => {
    if (!open) {
      setTitle("")
      setDescription("")
      setType("event")
      setColor("#0095b6")
      setWorkspaceId(activeWorkspaceId)
    }
  }, [open, activeWorkspaceId])

  useEffect(() => {
    if (open && !workspaceId) {
      setWorkspaceId(activeWorkspaceId)
    }
  }, [open, activeWorkspaceId, workspaceId])

  function handleSave() {
    if (!title.trim() || !selectedDate) return

    addEvent({
      workspaceId,
      title: title.trim(),
      description: description.trim(),
      type,
      color,
      date: selectedDate.toISOString().split("T")[0],
    })

    toast({ title: "Evento agregado" })
    onClose()
  }

  const formattedDate = selectedDate
    ? selectedDate.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : null

  const capitalizedDate = formattedDate
    ? formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)
    : null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar al calendario</DialogTitle>
          {capitalizedDate && (
            <p className="text-sm text-gray-400">{capitalizedDate}</p>
          )}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente
            </label>
            <select
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="w-full h-8 rounded-lg border border-gray-200 bg-white px-2.5 text-sm text-gray-700 outline-none"
            >
              {WORKSPACES.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
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
            disabled={!title.trim() || !selectedDate}
            className="bg-[#0095b6] text-white hover:opacity-90"
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}