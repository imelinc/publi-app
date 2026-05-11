'use client'

import { useEffect, useState } from 'react'
import type { SocialNetwork, Workspace } from '@/lib/mock-data'
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

const ALL_NETWORKS: SocialNetwork[] = [
  'instagram',
  'facebook',
  'tiktok',
  'linkedin',
  'twitter',
  'youtube',
  'threads',
]

const NETWORK_META: Record<SocialNetwork, { gray: string; color: string; label: string }> = {
  instagram: { gray: '/icons/instagram.svg', color: '/icons/instagram-color.svg', label: 'Instagram' },
  facebook: { gray: '/icons/facebook.svg', color: '/icons/facebook-color.svg', label: 'Facebook' },
  tiktok: { gray: '/icons/tiktok.svg', color: '/icons/tiktok-color.svg', label: 'TikTok' },
  linkedin: { gray: '/icons/linkedin.svg', color: '/icons/linkedin-color.svg', label: 'LinkedIn' },
  twitter: { gray: '/icons/twitter.svg', color: '/icons/twitter-color.svg', label: 'X' },
  youtube: { gray: '/icons/youtube.svg', color: '/icons/yt-color.svg', label: 'YouTube' },
  threads: { gray: '/icons/theads.svg', color: '/icons/threads-color.svg', label: 'Threads' },
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
  workspace: Workspace | null
  onSave: (data: Omit<Workspace, 'id' | 'clientSince'>) => void
}

export function ClientModal({ open, onClose, workspace, onSave }: ClientModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [name, setName] = useState('')
  const [color, setColor] = useState<string>(COLORS[0])
  const [selectedNetworks, setSelectedNetworks] = useState<SocialNetwork[]>([])
  const [plan, setPlan] = useState<'free' | 'pro'>('free')

  const initials = generateInitials(name)

  useEffect(() => {
    if (workspace) {
      setName(workspace.name)
      setColor(workspace.color)
      setSelectedNetworks([...workspace.networks])
      setPlan(workspace.plan)
      setStep(1)
    }
  }, [workspace])

  useEffect(() => {
    if (!open) {
      setName('')
      setColor(COLORS[0])
      setSelectedNetworks([])
      setPlan('free')
      setStep(1)
    }
  }, [open])

  function toggleNetwork(network: SocialNetwork) {
    setSelectedNetworks((prev) =>
      prev.includes(network) ? prev.filter((n) => n !== network) : [...prev, network]
    )
  }

  function handleSave() {
    onSave({
      name: name.trim(),
      color,
      initials: generateInitials(name),
      networks: selectedNetworks,
      plan,
    })
  }

  const dialogTitle = workspace ? 'Editar cliente' : 'Nuevo cliente'

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-[440px]">
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
            <label className="text-sm font-medium text-gray-700">
              Seleccioná las redes de este cliente
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ALL_NETWORKS.map((network) => {
                const meta = NETWORK_META[network]
                const isSelected = selectedNetworks.includes(network)
                return (
                  <button
                    key={network}
                    type="button"
                    onClick={() => toggleNetwork(network)}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-[#0095b6] bg-[#cceef5] text-[#0095b6]'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    <img
                      src={isSelected ? meta.color : meta.gray}
                      alt={meta.label}
                      width={16}
                      height={16}
                    />
                    <span className="text-xs font-medium">{meta.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 3 && (
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
              <Button variant="outline" onClick={() => setStep(1)}>
                Atrás
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="bg-[#0095b6] hover:bg-[#007a96] text-white"
              >
                Siguiente
              </Button>
            </>
          )}
          {step === 3 && (
            <>
              <Button variant="outline" onClick={() => setStep(2)}>
                Atrás
              </Button>
              <Button
                onClick={handleSave}
                className="bg-[#0095b6] hover:bg-[#007a96] text-white"
              >
                Guardar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}