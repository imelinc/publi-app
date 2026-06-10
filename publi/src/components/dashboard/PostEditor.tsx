'use client'

import { useRef, useState } from 'react'
import { Wand2, Hash, Clock, ImagePlus, X, Loader2 } from 'lucide-react'
import type { Network } from '@/types'
import { useAppStore } from '@/store/use-app-store'
import { useToast } from '@/components/ui/use-toast'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { NETWORK_META } from '@/lib/networks'
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
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const clients = useAppStore((s) => s.clients)
  const uploadMedia = useAppStore((s) => s.uploadMedia)
  const selectedClient = clients.find((c) => c.id === clientId) ?? clients[0] ?? null

  async function handleFileSelected(file: File) {
    setUploading(true)
    try {
      const optimizedFile = await compressImage(file)
      const url = await uploadMedia(optimizedFile)
      onImageChange(url)
    } catch (err) {
      toast({
        title: 'No se pudo subir la imagen',
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setUploading(false)
    }
  }

  const charLimit = networks.length > 0 ? NETWORK_META[networks[0]].charLimit : 2200
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
                    src={NETWORK_META[network].iconColor}
                    alt={NETWORK_META[network].label}
                    width={16}
                    height={16}
                    className="size-4 object-contain"
                  />
                  {NETWORK_META[network].label}
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFileSelected(f)
            // Reset para permitir re-elegir el mismo archivo
            e.target.value = ''
          }}
        />
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
              aria-label="Quitar imagen"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (uploading) return
              const f = e.dataTransfer.files?.[0]
              if (f) handleFileSelected(f)
            }}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              uploading
                ? 'border-gray-200 bg-gray-50 cursor-wait'
                : 'border-gray-200 cursor-pointer hover:border-[#0095b6] hover:bg-[#cceef5]/20'
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="size-8 mx-auto text-[#0095b6] animate-spin" />
                <p className="text-sm text-gray-500 mt-2">Subiendo imagen…</p>
              </>
            ) : (
              <>
                <ImagePlus className="size-8 mx-auto text-gray-300" />
                <p className="text-sm text-gray-400 mt-2">
                  Arrastrá una imagen o hacé click para seleccionar
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG, WEBP o GIF · hasta 10 MB
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

async function compressImage(file: File): Promise<File> {
  // Si no es una imagen, no hacer nada
  if (!file.type.startsWith('image/')) return file

  // Si la imagen ya es chica (< 1MB) y es JPEG o PNG, no hace falta comprimir
  if (file.size < 1 * 1024 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/png')) {
    return file
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        const maxDim = 1440 // Límite de Instagram para no re-escalar agresivamente

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file)
              return
            }
            // Renombrar la extensión a .jpg ya que exportamos como image/jpeg
            const name = file.name.replace(/\.[^/.]+$/, '') + '.jpg'
            const compressedFile = new File([blob], name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          },
          'image/jpeg',
          0.85 // Calidad
        )
      }
      img.onerror = () => resolve(file)
      img.src = event.target?.result as string
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}
