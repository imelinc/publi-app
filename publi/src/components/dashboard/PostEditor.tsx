'use client'

import { useRef, useState, useEffect } from 'react'
import { Wand2, Hash, Clock, ImagePlus, X, Loader2, Crop, Trash2, AlertCircle, Lock } from 'lucide-react'
import type { Network } from '@/types'
import { useAppStore } from '@/store/use-app-store'
import { useToast } from '@/components/ui/use-toast'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { NETWORK_META } from '@/lib/networks'
import { AiPanel } from './AiPanel'
import { CropDialog } from './CropDialog'
import { PlanUpgradeDialog } from './PlanUpgradeDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface PostEditorProps {
  clientId: string
  description: string
  networks: Network[]
  mediaUrls: string[]
  contentFormat: 'feed' | 'story'
  onClientChange: (id: string) => void
  onDescriptionChange: (text: string) => void
  onNetworksChange: (networks: Network[]) => void
  onMediaUrlsChange: (urls: string[]) => void
  onContentFormatChange: (format: 'feed' | 'story') => void
  isCustomized: boolean
  onIsCustomizedChange: (v: boolean) => void
  customDescriptions: Record<Network, string>
  onCustomDescriptionsChange: (v: Record<Network, string>) => void
}

export function PostEditor({
  clientId,
  description,
  networks,
  mediaUrls,
  contentFormat,
  onClientChange,
  onDescriptionChange,
  onNetworksChange,
  onMediaUrlsChange,
  onContentFormatChange,
  isCustomized,
  onIsCustomizedChange,
  customDescriptions,
  onCustomDescriptionsChange,
}: PostEditorProps) {
  const [aiPanelType, setAiPanelType] = useState<'rewrite' | 'hashtags' | 'schedule' | null>(null)
  const [uploading, setUploading] = useState(false)
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null)
  const [cropImageIndex, setCropImageIndex] = useState<number>(-1)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [confirmSwitchOpen, setConfirmSwitchOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const clients = useAppStore((s) => s.clients)
  const uploadMedia = useAppStore((s) => s.uploadMedia)
  const userProfile = useAppStore((s) => s.userProfile)
  const selectedClient = clients.find((c) => c.id === clientId) ?? clients[0] ?? null

  const [activeEditorTab, setActiveEditorTab] = useState<Network | null>(null)

  // Sincronizar activeEditorTab con redes seleccionadas
  useEffect(() => {
    if (networks.length > 0) {
      if (!activeEditorTab || !networks.includes(activeEditorTab)) {
        setActiveEditorTab(networks[0])
      }
    } else {
      setActiveEditorTab(null)
    }
  }, [networks, activeEditorTab])

  // Limpiar descripciones personalizadas de redes deseleccionadas
  useEffect(() => {
    if (isCustomized) {
      let changed = false
      const updated = { ...customDescriptions }
      for (const net in updated) {
        if (!networks.includes(net as Network)) {
          delete updated[net as Network]
          changed = true
        }
      }
      if (changed) {
        onCustomDescriptionsChange(updated)
      }
    }
  }, [networks, isCustomized, customDescriptions, onCustomDescriptionsChange])

  async function handleFilesSelected(files: FileList) {
    const remainingSlots = contentFormat === 'story' ? 1 - mediaUrls.length : 10 - mediaUrls.length
    if (remainingSlots <= 0) {
      toast({
        title: contentFormat === 'story' ? 'Límite de archivos para Story' : 'Límite de imágenes alcanzado',
        description: contentFormat === 'story'
          ? 'Las Stories sólo permiten un único archivo (imagen o video).'
          : 'Sólo podés subir hasta 10 imágenes para el carrusel.',
      })
      return
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots)
    if (files.length > remainingSlots) {
      toast({
        title: contentFormat === 'story' ? 'Límite de archivos excedido' : 'Límite de imágenes excedido',
        description: contentFormat === 'story'
          ? 'Solo se subirá el primer archivo seleccionado.'
          : `Sólo se subirán las primeras ${remainingSlots} imágenes seleccionadas.`,
      })
    }

    setUploading(true)
    const newUrls: string[] = []

    for (const file of filesToUpload) {
      try {
        const optimizedFile = await compressImage(file)
        const url = await uploadMedia(optimizedFile)
        newUrls.push(url)
      } catch (err) {
        toast({
          title: `No se pudo subir ${file.name}`,
          description: err instanceof Error ? err.message : undefined,
        })
      }
    }

    if (newUrls.length > 0) {
      onMediaUrlsChange([...mediaUrls, ...newUrls])
    }
    setUploading(false)
  }

  function removeImage(index: number) {
    onMediaUrlsChange(mediaUrls.filter((_, idx) => idx !== index))
  }

  async function handleCropComplete(blob: Blob) {
    if (cropImageIndex === -1) return
    setUploading(true)
    setCropImageUrl(null)

    try {
      const croppedFile = new File([blob], `cropped-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      })
      const newUrl = await uploadMedia(croppedFile)
      
      const updated = [...mediaUrls]
      updated[cropImageIndex] = newUrl
      onMediaUrlsChange(updated)

      toast({ title: 'Imagen encuadrada con éxito' })
    } catch (err) {
      toast({
        title: 'Error al subir la imagen recortada',
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setUploading(false)
      setCropImageIndex(-1)
    }
  }

  const charLimit = isCustomized && activeEditorTab
    ? NETWORK_META[activeEditorTab].charLimit
    : networks.length > 0
      ? NETWORK_META[networks[0]].charLimit
      : 2200

  const activeText = isCustomized && activeEditorTab
    ? (customDescriptions[activeEditorTab] ?? '')
    : description

  const charCount = activeText.length

  const charCountColor =
    charCount > charLimit
      ? 'text-red-500'
      : charCount > charLimit * 0.8
        ? 'text-[#ffb703]'
        : 'text-gray-400'

  const availableNetworks: Network[] = selectedClient?.connectedNetworks ?? []

  function toggleNetwork(network: Network) {
    if (contentFormat === 'story') {
      if (network !== 'instagram') {
        toast({ title: 'Las Stories sólo están disponibles para Instagram' })
        return
      }
      return
    }
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
      if (isCustomized && activeEditorTab) {
        onCustomDescriptionsChange({
          ...customDescriptions,
          [activeEditorTab]: result,
        })
      } else {
        onDescriptionChange(result)
      }
    } else if (aiPanelType === 'hashtags') {
      const merged = activeText ? `${activeText} ${result}` : result
      if (isCustomized && activeEditorTab) {
        onCustomDescriptionsChange({
          ...customDescriptions,
          [activeEditorTab]: merged,
        })
      } else {
        onDescriptionChange(merged)
      }
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
              const isStory = contentFormat === 'story'
              const isDisabled = isStory && network !== 'instagram'
              if (isDisabled) return null // Ocultar otras redes en formato Story
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

      {availableNetworks.includes('instagram') && (
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Formato de publicación</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onContentFormatChange('feed')}
              className={`flex-1 py-2 text-center text-xs font-medium rounded-lg border transition-colors ${
                contentFormat === 'feed'
                  ? 'border-[#0095b6] bg-[#cceef5] text-[#0095b6]'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Feed / Post estándar
            </button>
            <button
              type="button"
              onClick={() => {
                onContentFormatChange('story')
                onNetworksChange(['instagram'])
                if (mediaUrls.length > 1) {
                  onMediaUrlsChange([mediaUrls[0]])
                  toast({
                    title: 'Formato cambiado a Story',
                    description: 'Se conservó solo la primera imagen/video (máximo permitido).',
                  })
                }
              }}
              className={`flex-1 py-2 text-center text-xs font-medium rounded-lg border transition-colors ${
                contentFormat === 'story'
                  ? 'border-[#0095b6] bg-[#cceef5] text-[#0095b6]'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Instagram Story
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between mb-1">
          <Label className="text-sm font-medium text-gray-700">Descripción</Label>
          <span className={`text-xs ${charCountColor}`}>
            {charCount}/{charLimit}
          </span>
        </div>

        {/* Selector de personalización */}
        {networks.length > 1 && (
          <div className="flex bg-gray-50 border border-gray-100 rounded-lg p-1 gap-1">
            <button
              type="button"
              onClick={() => {
                if (isCustomized) {
                  const hasCustomizedChanges = Object.keys(customDescriptions).some(
                    (key) => customDescriptions[key as Network] !== description
                  )
                  if (!hasCustomizedChanges) {
                    onDescriptionChange(description)
                    onIsCustomizedChange(false)
                  } else {
                    setConfirmSwitchOpen(true)
                  }
                }
              }}
              className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                !isCustomized
                  ? 'bg-white text-gray-900 shadow-xs border border-gray-200/50'
                  : 'text-gray-555 hover:text-gray-900'
              }`}
            >
              Mismo copy para todas
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isCustomized) {
                  const populated = {} as Record<Network, string>
                  networks.forEach(net => {
                    populated[net] = description
                  })
                  onCustomDescriptionsChange(populated)
                  onIsCustomizedChange(true)
                }
              }}
              className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                isCustomized
                  ? 'bg-white text-gray-900 shadow-xs border border-gray-200/50'
                  : 'text-gray-555 hover:text-gray-900'
              }`}
            >
              Personalizar por red
            </button>
          </div>
        )}

        {/* Pestañas de redes sociales para edición */}
        {isCustomized && networks.length > 0 && (
          <div className="flex gap-2 border-b border-gray-100 pb-2 overflow-x-auto">
            {networks.map((net) => {
              const isActive = activeEditorTab === net
              const hasText = !!(customDescriptions[net]?.trim())
              return (
                <button
                  key={net}
                  type="button"
                  onClick={() => setActiveEditorTab(net)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 -mb-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'border-[#0095b6] text-[#0095b6]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={NETWORK_META[net].iconColor}
                    alt={NETWORK_META[net].label}
                    className="size-3.5 object-contain"
                  />
                  {NETWORK_META[net].label}
                  {hasText && (
                    <span className="size-1.5 rounded-full bg-[#ffb703] animate-pulse" />
                  )}
                </button>
              )
            })}
          </div>
        )}

        <Textarea
          rows={6}
          value={activeText}
          onChange={(e) => {
            const val = e.target.value
            if (isCustomized && activeEditorTab) {
              onCustomDescriptionsChange({
                ...customDescriptions,
                [activeEditorTab]: val,
              })
            } else {
              onDescriptionChange(val)
            }
          }}
          placeholder={
            isCustomized && activeEditorTab
              ? `Escribí el copy específico para ${NETWORK_META[activeEditorTab].label}...`
              : "Escribí el copy de tu publicación..."
          }
          className="resize-none"
        />

        {contentFormat === 'story' && (
          <p className="text-xs text-amber-600 mt-2 flex items-start gap-1">
            <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
            <span>
              <strong>Nota para Story:</strong> Instagram no muestra textos de pie de foto en las Stories. La descripción se guardará de forma interna pero no saldrá como caption público.
            </span>
          </p>
        )}

        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              if (userProfile?.plan === 'free') {
                setUpgradeDialogOpen(true)
              } else {
                setAiPanelType(aiPanelType === 'rewrite' ? null : 'rewrite')
              }
            }}
            className={`inline-flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 transition-colors ${
              aiPanelType === 'rewrite'
                ? 'border border-[#0095b6] bg-[#cceef5] text-[#0095b6]'
                : 'border border-[#0095b6] text-[#0095b6] hover:bg-[#cceef5]/50'
            }`}
          >
            <Wand2 className="size-3.5" />
            Reescribir
            {userProfile?.plan === 'free' && <Lock className="size-3 text-[#0095b6] shrink-0" />}
          </button>
          <button
            onClick={() => {
              if (userProfile?.plan === 'free') {
                setUpgradeDialogOpen(true)
              } else {
                setAiPanelType(aiPanelType === 'hashtags' ? null : 'hashtags')
              }
            }}
            className={`inline-flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 transition-colors ${
              aiPanelType === 'hashtags'
                ? 'border border-[#0095b6] bg-[#cceef5] text-[#0095b6]'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-55'
            }`}
          >
            <Hash className="size-3.5" />
            Hashtags
            {userProfile?.plan === 'free' && <Lock className="size-3 text-[#0095b6] shrink-0" />}
          </button>
          <button
            onClick={() => {
              if (userProfile?.plan === 'free') {
                setUpgradeDialogOpen(true)
              } else {
                setAiPanelType(aiPanelType === 'schedule' ? null : 'schedule')
              }
            }}
            className={`inline-flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 transition-colors ${
              aiPanelType === 'schedule'
                ? 'border border-[#0095b6] bg-[#cceef5] text-[#0095b6]'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-55'
            }`}
          >
            <Clock className="size-3.5" />
            Horario
            {userProfile?.plan === 'free' && <Lock className="size-3 text-[#0095b6] shrink-0" />}
          </button>
        </div>

        {aiPanelType && (
          <AiPanel
            type={aiPanelType}
            content={activeText}
            networks={isCustomized && activeEditorTab ? [activeEditorTab] : networks}
            onAccept={handleAiAccept}
            onDiscard={handleAiDiscard}
          />
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium text-gray-700">
            {contentFormat === 'story' ? 'Multimedia de la Story' : `Multimedia (${mediaUrls.length}/10)`}
          </Label>
          {mediaUrls.length > 1 && (
            <span className="text-[10px] bg-[#cceef5] text-[#0095b6] px-2 py-0.5 rounded-full font-semibold">
              Formato Carrusel
            </span>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple={contentFormat !== 'story'}
          className="hidden"
          onChange={(e) => {
            const files = e.target.files
            if (files && files.length > 0) handleFilesSelected(files)
            e.target.value = ''
          }}
        />

        {mediaUrls.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {mediaUrls.map((url, index) => {
              const isVideo =
                url.split('?')[0].toLowerCase().endsWith('.mp4') ||
                url.split('?')[0].toLowerCase().endsWith('.mov') ||
                url.split('?')[0].toLowerCase().endsWith('.avi') ||
                url.split('?')[0].toLowerCase().endsWith('.webm') ||
                url.split('?')[0].toLowerCase().endsWith('.m4v')

              return (
                <div
                  key={url + '-' + index}
                  className="relative group h-28 w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
                >
                  {isVideo ? (
                    <video
                      src={url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      autoPlay
                      loop
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Index badge */}
                  <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                    {index + 1}
                  </span>

                  {/* Hover overlay with action buttons */}
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCropImageUrl(url)
                        setCropImageIndex(index)
                      }}
                      className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-lg hover:scale-105 transition-all"
                      title="Encuadrar imagen"
                    >
                      <Crop className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="bg-red-500/90 hover:bg-red-500 text-white p-2 rounded-lg hover:scale-105 transition-all"
                      title="Eliminar imagen"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              )
            })}

            {mediaUrls.length < (contentFormat === 'story' ? 1 : 10) && (
              <button
                type="button"
                onClick={() => !uploading && fileInputRef.current?.click()}
                disabled={uploading}
                className="flex h-28 flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl hover:border-[#0095b6] hover:bg-[#cceef5]/10 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="size-5 text-[#0095b6] animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="size-6 text-gray-400" />
                    <span className="text-[10px] text-gray-500 mt-1 font-medium">Agregar más</span>
                  </>
                )}
              </button>
            )}
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
              const files = e.dataTransfer.files
              if (files && files.length > 0) handleFilesSelected(files)
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
                <p className="text-sm text-gray-500 mt-2">Subiendo archivos…</p>
              </>
            ) : (
              <>
                <ImagePlus className="size-8 mx-auto text-gray-300" />
                <p className="text-sm text-gray-400 mt-2">
                  {contentFormat === 'story'
                    ? 'Arrastrá una imagen o video o hacé click para seleccionar'
                    : 'Arrastrá imágenes o hacé click para seleccionar'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {contentFormat === 'story'
                    ? 'Subí 1 archivo · JPG, PNG, WEBP, GIF, MP4, MOV · máx 8 MB'
                    : 'Subí hasta 10 fotos · JPG, PNG, WEBP o GIF · máx 8 MB'}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Crop Dialog */}
      {cropImageUrl && (
        <CropDialog
          isOpen={true}
          imageUrl={cropImageUrl}
          onClose={() => {
            setCropImageUrl(null)
            setCropImageIndex(-1)
          }}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Plan Upgrade Dialog */}
      <PlanUpgradeDialog
        open={upgradeDialogOpen}
        onClose={() => setUpgradeDialogOpen(false)}
      />

      {/* Diálogo premium de confirmación de des-personalización */}
      <AlertDialog open={confirmSwitchOpen} onOpenChange={setConfirmSwitchOpen}>
        <AlertDialogContent className="rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-md bg-white">
          <AlertDialogHeader className="flex flex-col items-center text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-500 ring-8 ring-amber-500/10 mb-4 animate-pulse">
              <AlertCircle className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-lg font-extrabold text-gray-900">
              ¿Volver al copy unificado?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed font-semibold mt-2">
              Se perderán los textos personalizados que escribiste para cada red y se usará el copy unificado. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2 sm:gap-0 flex justify-center">
            <AlertDialogCancel className="rounded-xl font-bold border-slate-200 hover:bg-slate-50 cursor-pointer flex-1">
              Mantener personalizados
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const fallbackCopy = activeEditorTab ? (customDescriptions[activeEditorTab] ?? description) : description
                onDescriptionChange(fallbackCopy)
                onIsCustomizedChange(false)
                setConfirmSwitchOpen(false)
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold cursor-pointer flex-1 border border-transparent"
            >
              Sí, unificar copy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file

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
        const maxDim = 1440

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
            const name = file.name.replace(/\.[^/.]+$/, '') + '.jpg'
            const compressedFile = new File([blob], name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          },
          'image/jpeg',
          0.85
        )
      }
      img.onerror = () => resolve(file)
      img.src = event.target?.result as string
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}
