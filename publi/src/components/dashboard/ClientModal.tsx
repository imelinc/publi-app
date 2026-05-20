'use client'

import { useEffect, useState } from 'react'
import type { Client } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
  onSave: (data: { name: string; color: string }) => void
}

export function ClientModal({ open, onClose, client, onSave }: ClientModalProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState<string>(COLORS[0])

  const initials = generateInitials(name)

  useEffect(() => {
    if (client) {
      setName(client.name)
      setColor(client.color)
    }
  }, [client])

  useEffect(() => {
    if (!open) {
      setName('')
      setColor(COLORS[0])
    }
  }, [open])

  function handleSave() {
    onSave({
      name: name.trim(),
      color,
    })
  }

  const dialogTitle = client ? 'Editar cliente' : 'Nuevo cliente'

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

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

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim()}
            className="bg-[#0095b6] hover:bg-[#007a96] text-white"
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
