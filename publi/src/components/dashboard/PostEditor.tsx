'use client'

import { useState } from 'react'
import { Wand2, Hash, Clock, ImagePlus, X } from 'lucide-react'
import type { Network } from '@/types'
import { useAppStore } from '@/store/use-app-store'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AiPanel } from './AiPanel'

interface PostEditorProps {
  clientId: string
  description: string
  networks: Network[]
  imageUrl: string | null
  onClientChange: (id: string) => void
  onDescriptionChange: (text: string) => void
  onNetworksChange: (networks: Network[]) => void
  onImageChange: (url: string | null) => void
}

const NETWORK_LIMITS: Record<Network, number> = {
  instagram: 2200,
}

const NETWORK_ICONS: Record<Network, string> = {
  instagram: '/icons/instagram-color.svg',
}

const NETWORK_NAMES: Record<Network, string> = {
  instagram: 'Instagram',
}

export function PostEditor({
  clientId,
  description,
  networks,
  imageUrl,
  onClientChange,
  onDescriptionChange,
  onNetworksChange,
  onImageChange,
}: PostEditorProps) {
  const [aiPanelType, setAiPanelType] = useState<'rewrite' | 'hashtags' | 'schedule' | null>(null)

  const clients = useAppStore((s) => s.clients)
  const selectedClient = clients.find((c) => c.id === clientId) ?? clients[0] ?? null

  const charLimit = networks.length > 0 ? NETWORK_LIMITS[networks[0]] : 2200
  const charCount = description.length

  const charCountColor =
    charCount > charLimit
      ? 'text-red-500'
      : charCount > charLimit * 0.8
        ? 'text-[#ffb703]'
        : 'text-gray-400'

  const availableNetworks: Network[] = selectedClient?.connectedNetworks ?? []

  function toggleNetwork(network: Network) {
    if (networks.includes(network)) {
      if (networks.length > 1) {
        onNetworksChange(networks.filter((n) => n !== network))
      }
    } else {
      onNetworksChange([...networks, network])
    }
  }

  function handleAiAccept(result: string) {
    if (aiPanelType === 'rewrite') {
      onDescriptionChange(result)
    } else if (aiPanelType === 'hashtags') {
      onDescriptionChange(description ? `${description} ${result}` : result)
    }
    setAiPanelType(null)
  }

  function handleAiDiscard() {
    setAiPanelType(null)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-6">
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">Cliente</Label>
        <div className="relative">
          <select
            value={clientId}
            onChange={(e) => onClientChange(e.target.value)}
            className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm outline-none focus:border-[#0095b6] transition-colors"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {selectedClient && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: selectedClient.color }}
              >
                {selectedClient.initials}
              </span>
            </div>
          )}
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">Redes sociales</Label>
        <div className="flex flex-wrap gap-2">
          {availableNetworks.length > 0 ? (
            availableNetworks.map((network) => {
              const selected = networks.includes(network)
              return (
                <button
                  key={network}
                  type="button"
                  onClick={() => toggleNetwork(network)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? 'border-[#0095b6] bg-[#cceef5] text-[#0095b6]'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={NETWORK_ICONS[network]}
                    alt={NETWORK_NAMES[network]}
                    width={16}
                    height={16}
                    className="size-4 object-contain"
                  />
                  {NETWORK_NAMES[network]}
                </button>
              )
            })
          ) : (
            <p className="text-sm text-gray-400">Este cliente no tiene redes conectadas</p>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium text-gray-700">Descripción</Label>
          <span className={`text-xs ${charCountColor}`}>
            {charCount}/{charLimit}
          </span>
        </div>
        <Textarea
          rows={6}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Escribí el copy de tu publicación..."
          className="resize-none"
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setAiPanelType(aiPanelType === 'rewrite' ? null : 'rewrite')}
            className={`inline-flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 transition-colors ${
              aiPanelType === 'rewrite'
                ? 'border border-[#0095b6] bg-[#cceef5] text-[#0095b6]'
                : 'border border-[#0095b6] text-[#0095b6] hover:bg-[#cceef5]/50'
            }`}
          >
            <Wand2 className="size-3.5" />
            Reescribir
          </button>
          <button
            onClick={() => setAiPanelType(aiPanelType === 'hashtags' ? null : 'hashtags')}
            className={`inline-flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 transition-colors ${
              aiPanelType === 'hashtags'
                ? 'border border-[#0095b6] bg-[#cceef5] text-[#0095b6]'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Hash className="size-3.5" />
            Hashtags
          </button>
          <button
            onClick={() => setAiPanelType(aiPanelType === 'schedule' ? null : 'schedule')}
            className={`inline-flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 transition-colors ${
              aiPanelType === 'schedule'
                ? 'border border-[#0095b6] bg-[#cceef5] text-[#0095b6]'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Clock className="size-3.5" />
            Horario
          </button>
        </div>

        {aiPanelType && (
          <AiPanel
            type={aiPanelType}
            content={description}
            networks={networks}
            onAccept={handleAiAccept}
            onDiscard={handleAiDiscard}
          />
        )}
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">Multimedia</Label>
        {imageUrl ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full h-48 object-cover rounded-xl"
            />
            <button
              onClick={() => onImageChange(null)}
              className="absolute top-2 right-2 bg-black/50 rounded-full p-1 text-white hover:bg-black/70 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => onImageChange('/images/restaurant.jpg')}
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#0095b6] hover:bg-[#cceef5]/20 transition-colors"
          >
            <ImagePlus className="size-8 mx-auto text-gray-300" />
            <p className="text-sm text-gray-400 mt-2">
              Arrastrá una imagen o hacé click para seleccionar
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
