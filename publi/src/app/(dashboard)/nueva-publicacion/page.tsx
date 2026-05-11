'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { useAppStore } from '@/store/use-app-store'
import { WORKSPACES } from '@/lib/mock-data'
import type { SocialNetwork, PostStatus } from '@/lib/mock-data'
import { PostEditor } from '@/components/dashboard/PostEditor'
import { PostPreview } from '@/components/dashboard/PostPreview'
import { AiPanel } from '@/components/dashboard/AiPanel'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'

export default function NuevaPublicacionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { addPost, activeWorkspaceId } = useAppStore()

  const [workspaceId, setWorkspaceId] = useState(activeWorkspaceId)
  const [description, setDescription] = useState('')
  const [networks, setNetworks] = useState<SocialNetwork[]>([])
  const [scheduledAt, setScheduledAt] = useState<string | null>(null)
  const [publishNow, setPublishNow] = useState(true)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [activePreviewNetwork, setActivePreviewNetwork] = useState<SocialNetwork | null>(null)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [showScheduleAi, setShowScheduleAi] = useState(false)

  const workspace = WORKSPACES.find((w) => w.id === workspaceId) ?? null

  useEffect(() => {
    if (workspace) {
      setNetworks(workspace.networks)
      if (workspace.networks.length > 0) {
        setActivePreviewNetwork(workspace.networks[0])
      }
    }
  }, [workspaceId])

  const handleWorkspaceChange = useCallback((id: string) => {
    setWorkspaceId(id)
  }, [])

  const handleNetworksChange = useCallback((newNetworks: SocialNetwork[]) => {
    setNetworks(newNetworks)
    if (newNetworks.length > 0) {
      setActivePreviewNetwork(newNetworks[0])
    } else {
      setActivePreviewNetwork(null)
    }
  }, [])

  const handleNetworkSelect = useCallback((network: SocialNetwork) => {
    setActivePreviewNetwork(network)
  }, [])

  const handleImageChange = useCallback((url: string | null) => {
    setImageUrl(url)
  }, [])

  const handleDescriptionChange = useCallback((text: string) => {
    setDescription(text)
  }, [])

  function buildScheduledAt(): string | null {
    if (publishNow) return new Date().toISOString()
    if (scheduleDate && scheduleTime) {
      return new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
    }
    return null
  }

  function handleSaveDraft() {
    addPost({
      workspaceId,
      title: description.slice(0, 50) || 'Sin título',
      description,
      networks,
      status: 'draft' as PostStatus,
      scheduledAt: null,
      imageUrl,
    })
    toast({ title: 'Borrador guardado' })
  }

  function handleConfirmPublish() {
    const status: PostStatus = publishNow ? 'published' : 'scheduled'
    addPost({
      workspaceId,
      title: description.slice(0, 50) || 'Sin título',
      description,
      networks,
      status,
      scheduledAt: buildScheduledAt(),
      imageUrl,
    })
    toast({ title: '¡Publicación programada!' })
    router.push('/calendario')
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Nueva publicación</h1>

      <div className="flex gap-6">
        <div className="flex-1">
          <PostEditor
            workspaceId={workspaceId}
            description={description}
            networks={networks}
            imageUrl={imageUrl}
            onWorkspaceChange={handleWorkspaceChange}
            onDescriptionChange={handleDescriptionChange}
            onNetworksChange={handleNetworksChange}
            onImageChange={handleImageChange}
          />
        </div>

        <div className="w-96 flex flex-col gap-4">
          <PostPreview
            description={description}
            imageUrl={imageUrl}
            workspace={workspace}
            networks={networks}
            activeNetwork={activePreviewNetwork}
            onNetworkSelect={handleNetworkSelect}
          />

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Publicación</h2>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setPublishNow(true)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  publishNow
                    ? 'bg-[#0095b6] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Publicar ahora
              </button>
              <button
                onClick={() => setPublishNow(false)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !publishNow
                    ? 'bg-[#0095b6] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Programar
              </button>
            </div>

            {!publishNow && (
              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm text-gray-700 mb-1 block">Fecha</Label>
                    <Input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-700 mb-1 block">Hora</Label>
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  onClick={() => setShowScheduleAi(!showScheduleAi)}
                  className="inline-flex items-center gap-1.5 border border-[#0095b6] text-[#0095b6] text-sm rounded-lg px-3 py-1.5 hover:bg-[#cceef5] transition-colors"
                >
                  <Sparkles className="size-3.5" />
                  IA: Sugerir horario
                </button>
                {showScheduleAi && (
                  <AiPanel
                    type="schedule"
                    content={description}
                    networks={networks}
                    onAccept={(result) => {
                      setShowScheduleAi(false)
                    }}
                    onDiscard={() => setShowScheduleAi(false)}
                  />
                )}
              </div>
            )}

            <div className="border-t border-gray-100 pt-4 mt-4 space-y-3">
              <Button
                variant="outline"
                className="w-full text-sm"
                onClick={handleSaveDraft}
              >
                Guardar borrador
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="w-full bg-[#0095b6] text-white font-medium rounded-lg py-2 text-sm hover:bg-[#007a94] transition-colors">
                    {publishNow ? 'Publicar' : 'Programar'}
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {publishNow ? 'Confirmar publicación' : 'Confirmar programación'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {publishNow
                        ? '¿Estás seguro de que querés publicar ahora? La publicación se verá en las redes seleccionadas de forma inmediata.'
                        : '¿Estás seguro de que querés programar esta publicación? Se publicará automáticamente en la fecha y hora seleccionadas.'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmPublish}>
                      {publishNow ? 'Publicar ahora' : 'Programar'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}