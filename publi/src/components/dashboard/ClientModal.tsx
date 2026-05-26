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
import { Button } from '@/components/ui/button'
import { NetworksManager } from './NetworksManager'

const COLORS = ['#92400e', '#6d28d9', '#be185d', '#0095b6', '#15803d', '#b45309'] as const

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
   * que se usa para conocer su `id` y avanzar al paso 3 (conexión de redes).
   */
  onSave: (data: { name: string; color: string; plan: Plan }) => Promise<Client>
}

export function ClientModal({ open, onClose, client, onSave }: ClientModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [name, setName] = useState('')
  const [color, setColor] = useState<string>(COLORS[0])
  const [plan, setPlan] = useState<Plan>('free')
  const [savedClientId, setSavedClientId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const initials = generateInitials(name)

  useEffect(() => {
    if (client) {
      setName(client.name)
      setColor(client.color)
      setPlan(client.plan)
      setSavedClientId(client.id) // ya existe, podemos saltar a paso 3 si quisiéramos
      setStep(1)
    }
  }, [client])

  useEffect(() => {
    if (!open) {
      setName('')
      setColor(COLORS[0])
      setPlan('free')
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
        color,
        plan,
      })
      setSavedClientId(result.id)
      setStep(3)
    } finally {
      setSaving(false)
    }
  }

  const dialogTitle = client ? 'Editar cliente' : 'Nuevo cliente'

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            {([1, 2, 3] as const).map((s) => (
              <div
                key={s}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{
                  backgroundColor: s < step ? '#cceef5' : s === step ? '#0095b6' : '#e5e7eb',
                  color: s <= step ? '#ffffff' : '#9ca3af',
                }}
              >
                {s}
              </div>
            ))}
          </div>
        </DialogHeader>

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Nombre del cliente</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Café Bruna"
              />
            </div>

            <div className="flex justify-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                style={{ backgroundColor: color || '#9ca3af' }}
              >
                {initials || '?'}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Color</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-6 h-6 rounded-full"
                    style={{
                      backgroundColor: c,
                      ...(color === c
                        ? { boxShadow: '0 0 0 2px white, 0 0 0 4px #111827' }
                        : {}),
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <label className="text-sm font-medium text-gray-700">Plan</label>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setPlan('free')}
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors text-left ${
                  plan === 'free'
                    ? 'border-[#0095b6] bg-[#cceef5] text-[#0095b6]'
                    : 'border-gray-200 bg-white text-gray-600'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Free</span>
                  <span className="text-xs">Gratis, hasta 3 clientes, sin IA</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPlan('pro')}
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors text-left ${
                  plan === 'pro'
                    ? 'border-[#0095b6] bg-[#cceef5] text-[#0095b6]'
                    : 'border-gray-200 bg-white text-gray-600'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Pro</span>
                  <span className="text-xs">$9.99/mes, clientes ilimitados, con IA</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {step === 3 && savedClientId && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-500">
              Ingresá el usuario de las redes que quieras conectar. Podés saltearte este
              paso y hacerlo más tarde desde el menú del cliente.
            </p>
            <NetworksManager clientId={savedClientId} />
          </div>
        )}

        <DialogFooter>
          {step === 1 && (
            <Button
              onClick={() => setStep(2)}
              disabled={!name.trim()}
              className="bg-[#0095b6] hover:bg-[#007a96] text-white"
            >
              Siguiente
            </Button>
          )}
          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)} disabled={saving}>
                Atrás
              </Button>
              <Button
                onClick={handleSaveAndNext}
                disabled={saving}
                className="bg-[#0095b6] hover:bg-[#007a96] text-white"
              >
                {saving ? 'Guardando…' : 'Guardar y continuar'}
              </Button>
            </>
          )}
          {step === 3 && (
            <Button
              onClick={onClose}
              className="bg-[#0095b6] hover:bg-[#007a96] text-white"
            >
              Listo
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
