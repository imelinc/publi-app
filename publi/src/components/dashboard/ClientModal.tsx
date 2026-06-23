'use client'

import { useEffect, useState } from 'react'
import type { Client, Plan } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { NetworksManager } from './NetworksManager'
import { Check, User, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'

const COLORS = ['#92400e', '#6d28d9', '#be185d', '#0095b6', '#15803d', '#b45309'] as const

const COLOR_NAMES: Record<string, string> = {
  '#92400e': 'Ámbar',
  '#6d28d9': 'Violeta',
  '#be185d': 'Magenta',
  '#0095b6': 'Celeste',
  '#15803d': 'Verde',
  '#b45309': 'Naranja',
}

function generateInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 0 || !words[0]) return ''
  const first = words[0][0] || ''
  const second = words.length > 1 && words[1] ? words[1][0] : ''
  return (first + second).toUpperCase()
}

interface ClientModalProps {
  open: boolean
  onClose: () => void
  client: Client | null
  /**
   * Guarda el cliente (crear o actualizar) y devuelve el cliente resultante,
   * que se usa para conocer su `id` y avanzar al paso 2 (conexión de redes).
   */
  onSave: (data: { name: string; description?: string; color: string }) => Promise<Client>
}

export function ClientModal({ open, onClose, client, onSave }: ClientModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState<string>(COLORS[0])
  const [savedClientId, setSavedClientId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const initials = generateInitials(name)

  useEffect(() => {
    if (client) {
      setName(client.name)
      setDescription(client.description ?? '')
      setColor(client.color)
      setSavedClientId(client.id)
      setStep(1)
    }
  }, [client])

  useEffect(() => {
    if (!open) {
      setName('')
      setDescription('')
      setColor(COLORS[0])
      setStep(1)
      setSavedClientId(null)
      setSaving(false)
    }
  }, [open])

  async function handleSaveAndNext() {
    setSaving(true)
    try {
      const result = await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
      })
      setSavedClientId(result.id)
      setStep(2)
    } finally {
      setSaving(false)
    }
  }

  const dialogTitle = client ? 'Editar cliente' : 'Nuevo cliente'

  const steps = [
    { num: 1 as const, label: 'Datos', icon: User },
    { num: 2 as const, label: 'Redes', icon: Wifi },
  ]

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden">
        {/* Gradient header */}
        <div
          className="px-6 pt-6 pb-5 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${color}12 0%, ${color}06 100%)`,
          }}
        >
          {/* Decorative blur circle */}
          <div
            className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-[0.08] blur-2xl"
            style={{ backgroundColor: color }}
          />

          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {dialogTitle}
            </DialogTitle>
          </DialogHeader>

          {/* Premium stepper */}
          <div className="flex items-center gap-3 mt-4">
            {steps.map((s, i) => {
              const isCompleted = s.num < step
              const isActive = s.num === step
              const StepIcon = s.icon
              return (
                <div key={s.num} className="flex items-center gap-2">
                  {i > 0 && (
                    <div
                      className={cn(
                        "w-8 h-[2px] rounded-full transition-colors duration-300",
                        isCompleted ? 'bg-primary' : 'bg-gray-200'
                      )}
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                        isCompleted && "bg-primary text-white",
                        isActive && "bg-primary text-white shadow-md",
                        !isActive && !isCompleted && "bg-gray-100 text-gray-400"
                      )}
                      style={
                        isActive
                          ? { boxShadow: `0 4px 12px ${color}40` }
                          : undefined
                      }
                    >
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <StepIcon className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium transition-colors duration-300",
                        isActive ? "text-gray-900" : isCompleted ? "text-primary" : "text-gray-400"
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <div className="flex flex-col gap-5">
              {/* Live avatar preview */}
              <div className="flex justify-center">
                <div className="relative">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-xl transition-all duration-300 relative overflow-hidden"
                    style={{
                      backgroundColor: color || '#9ca3af',
                      boxShadow: `0 8px 24px -8px ${color}55`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                    <span className="relative">{initials || '?'}</span>
                  </div>
                  {name.trim() && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Nombre del cliente</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Café Bruna"
                  className="h-11 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Descripción
                  <span className="text-gray-400 font-normal ml-1">— opcional</span>
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Cafetería de especialidad en Palermo con foco en café de origen y experiencia de brunch los domingos."
                  rows={3}
                  className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20 transition-all resize-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Color de marca</label>
                <div className="flex gap-2.5">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={cn(
                        "w-9 h-9 rounded-xl transition-all duration-200 relative group cursor-pointer",
                        color === c
                          ? 'scale-110'
                          : 'hover:scale-105'
                      )}
                      style={{
                        backgroundColor: c,
                        boxShadow: color === c
                          ? `0 0 0 2px white, 0 0 0 4px ${c}, 0 4px 12px ${c}40`
                          : `0 2px 8px ${c}30`,
                      }}
                      title={COLOR_NAMES[c] ?? c}
                    >
                      {color === c && (
                        <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && savedClientId && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-3 bg-primary/[0.04] rounded-xl border border-primary/10">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wifi className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm text-gray-600">
                  Conectá las redes sociales del cliente. Podés saltear este paso y hacerlo después.
                </p>
              </div>
              <NetworksManager clientId={savedClientId} />
            </div>
          )}
        </div>

        <DialogFooter className="px-6 pb-6 pt-0">
          {step === 1 && (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveAndNext}
                disabled={!name.trim() || saving}
                className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md transition-all hover:shadow-lg"
                style={{
                  boxShadow: name.trim() ? `0 4px 14px ${color}30` : undefined,
                }}
              >
                {saving ? 'Guardando…' : 'Guardar y continuar'}
              </Button>
            </>
          )}
          {step === 2 && (
            <Button
              onClick={onClose}
              className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md"
            >
              Listo
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
