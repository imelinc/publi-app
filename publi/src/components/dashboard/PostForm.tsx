'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Copy, Check, Send, Clock4, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store/use-app-store'
import type { Network, PostStatus, Post } from '@/types'
import { PostEditor } from '@/components/dashboard/PostEditor'
import { PostPreview } from '@/components/dashboard/PostPreview'
import { AiPanel, type ScheduleRecommendation } from '@/components/dashboard/AiPanel'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'

const DAY_TO_INDEX: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  'miércoles': 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  'sábado': 6,
}

function nextOccurrenceOf(dayOfWeek: string, time: string): { date: string; time: string } {
  const dayKey = dayOfWeek.trim().toLowerCase()
  const targetDay = DAY_TO_INDEX[dayKey]
  const now = new Date()

  if (targetDay === undefined) {
    const tomorrow = new Date(now)
    tomorrow.setDate(now.getDate() + 1)
    return { date: toDateInput(tomorrow), time }
  }

  let daysAhead = targetDay - now.getDay()
  if (daysAhead < 0) daysAhead += 7
  if (daysAhead === 0) {
    const [h, m] = time.split(':').map((n) => parseInt(n, 10))
    if (now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m)) {
      daysAhead = 7
    }
  }
  const target = new Date(now)
  target.setDate(now.getDate() + daysAhead)
  return { date: toDateInput(target), time }
}

function toDateInput(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function toTimeInput(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

interface PostFormProps {
  mode: 'create' | 'edit'
  initialPost?: Post | null
}

/**
 * Form compartido entre `nueva-publicacion` y `borrador/[postId]`.
 * - `create`: post nuevo, sin estado previo.
 * - `edit`: post ya guardado (típicamente borrador). Pre-llena todos los campos.
 */
export function PostForm({ mode, initialPost = null }: PostFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { addPost, updatePostRemote, deletePost, requestApproval, publishPostNow, activeWorkspaceId, clients } = useAppStore()
  const setHasUnsavedChanges = useAppStore((s) => s.setHasUnsavedChanges)

  // ─── Estado del form ──────────────────────────────────────────────────────────
  const [title, setTitle] = useState(initialPost?.title ?? '')
  const [clientId, setClientId] = useState(initialPost?.clientId ?? activeWorkspaceId)
  const [description, setDescription] = useState(initialPost?.description ?? '')
  const [networks, setNetworks] = useState<Network[]>(initialPost?.networks ?? [])
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialPost?.mediaUrls?.[0] ?? null
  )
  const [activePreviewNetwork, setActivePreviewNetwork] = useState<Network | null>(
    initialPost?.networks?.[0] ?? null
  )

  const initialPublishNow = initialPost
    ? initialPost.status !== 'scheduled' // si estaba programado, arranco en "Programar"
    : true
  const [publishNow, setPublishNow] = useState(initialPublishNow)

  const [scheduleDate, setScheduleDate] = useState(
    initialPost?.scheduledAt ? toDateInput(new Date(initialPost.scheduledAt)) : ''
  )
  const [scheduleTime, setScheduleTime] = useState(
    initialPost?.scheduledAt ? toTimeInput(initialPost.scheduledAt) : ''
  )

  const [showScheduleAi, setShowScheduleAi] = useState(false)
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [savedPost, setSavedPost] = useState<Post | null>(initialPost ?? null)
  const [saving, setSaving] = useState(false)
  // Publicación inmediata en curso (Instagram tarda unos segundos): mantiene el
  // diálogo/botón en estado "Publicando…" hasta confirmar el resultado real.
  const [publishing, setPublishing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Dialog unificado: pide título + confirma según la acción
  type DialogAction = 'draft' | 'publish' | 'schedule' | 'approval'
  const [dialogAction, setDialogAction] = useState<DialogAction | null>(null)
  const [titleDraftInput, setTitleDraftInput] = useState('')

  const client = clients.find((c) => c.id === clientId) ?? null

  // ─── Tracking de cambios sin guardar ─────────────────────────────────────────
  // Snapshot del estado "limpio" (al cargar o después de cada save exitoso).
  // Comparamos contra esto para saber si hay cambios pendientes.
  const cleanSnapshotRef = useRef({
    title: initialPost?.title ?? '',
    description: initialPost?.description ?? '',
    networks: initialPost?.networks ?? [],
    imageUrl: initialPost?.mediaUrls?.[0] ?? null,
    clientId: initialPost?.clientId ?? '',
    scheduleDate: initialPost?.scheduledAt ? toDateInput(new Date(initialPost.scheduledAt)) : '',
    scheduleTime: initialPost?.scheduledAt ? toTimeInput(initialPost.scheduledAt) : '',
  })

  // Detecta cambios y los reporta al store (para que el Sidebar consulte)
  useEffect(() => {
    const s = cleanSnapshotRef.current
    const dirty =
      title !== s.title ||
      description !== s.description ||
      JSON.stringify(networks) !== JSON.stringify(s.networks) ||
      imageUrl !== s.imageUrl ||
      clientId !== s.clientId ||
      scheduleDate !== s.scheduleDate ||
      scheduleTime !== s.scheduleTime
    setHasUnsavedChanges(dirty)
  }, [title, description, networks, imageUrl, clientId, scheduleDate, scheduleTime, setHasUnsavedChanges])

  // Al desmontar el form, asegurarse de limpiar el flag global
  useEffect(() => {
    return () => setHasUnsavedChanges(false)
  }, [setHasUnsavedChanges])

  // beforeunload: prevenir cierre/refresh con cambios sin guardar
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      // Re-leemos el store en cada call para no quedar con stale value
      if (useAppStore.getState().hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = '' // Chrome requiere setear returnValue
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  /** Refresca el snapshot "limpio" después de un save exitoso */
  function markClean(post?: Post) {
    cleanSnapshotRef.current = {
      title: post?.title ?? title,
      description: post?.description ?? description,
      networks: post?.networks ?? networks,
      imageUrl: post?.mediaUrls?.[0] ?? imageUrl,
      clientId: post?.clientId ?? clientId,
      scheduleDate,
      scheduleTime,
    }
    setHasUnsavedChanges(false)
  }

  // Sincronizar clientId si está vacío (caso "create")
  useEffect(() => {
    if (clientId) return
    if (activeWorkspaceId) {
      setClientId(activeWorkspaceId)
    } else if (clients.length > 0) {
      setClientId(clients[0].id)
    }
  }, [clientId, activeWorkspaceId, clients])

  // En modo create, cuando se elige cliente, pre-cargar sus redes conectadas
  useEffect(() => {
    if (mode === 'edit') return
    if (client) {
      const connected = client.connectedNetworks
      setNetworks(connected)
      if (connected.length > 0) {
        setActivePreviewNetwork(connected[0])
      }
    }
  }, [mode, clientId, client?.id])

  const handleClientChange = useCallback((id: string) => setClientId(id), [])
  const handleNetworksChange = useCallback((newNetworks: Network[]) => {
    setNetworks(newNetworks)
    if (newNetworks.length > 0) {
      setActivePreviewNetwork(newNetworks[0])
    } else {
      setActivePreviewNetwork(null)
    }
  }, [])
  const handleNetworkSelect = useCallback((network: Network) => {
    setActivePreviewNetwork(network)
  }, [])
  const handleImageChange = useCallback((url: string | null) => setImageUrl(url), [])
  const handleDescriptionChange = useCallback((text: string) => setDescription(text), [])

  function buildScheduledAt(): string | null {
    if (publishNow) return new Date().toISOString()
    if (scheduleDate && scheduleTime) {
      return new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
    }
    return null
  }

  /**
   * Validación previa al guardado. Devuelve `true` si pasa.
   * Para publicar/programar, el título no se pide explícitamente: si no hay,
   * se deriva de la descripción. Solo se valida que haya cliente.
   */
  function validateBeforeSave(): boolean {
    if (!clientId) {
      toast({ title: 'Seleccioná un cliente antes de guardar' })
      return false
    }
    return true
  }

  /**
   * Crea o actualiza el post. Si `overrideTitle` se pasa, lo usa; si no,
   * usa el `title` actual, y como último fallback los primeros 50 chars
   * de la descripción.
   */
  async function saveOrUpdate(status: PostStatus, overrideTitle?: string): Promise<Post> {
    const effectiveTitle =
      (overrideTitle ?? title).trim() || description.slice(0, 50) || 'Sin título'
    setSaving(true)
    try {
      let result: Post
      if (savedPost) {
        // PATCH al post existente — cambia status si corresponde (ej: scheduled → draft)
        result = await updatePostRemote(savedPost.id, {
          title: effectiveTitle,
          description,
          networks,
          mediaUrls: imageUrl ? [imageUrl] : [],
          hashtags: [],
          status: status === 'draft' ? 'draft' : status === 'scheduled' ? 'scheduled' : 'published',
          scheduledAt: status === 'draft' ? null : buildScheduledAt(),
        })
        setSavedPost(result)
        setTitle(effectiveTitle)
      } else {
        result = await addPost({
          clientId,
          title: effectiveTitle,
          description,
          networks,
          status,
          scheduledAt: status === 'draft' ? null : buildScheduledAt(),
          mediaUrls: imageUrl ? [imageUrl] : [],
          hashtags: [],
        })
        setSavedPost(result)
        setTitle(effectiveTitle)
      }
      markClean(result)
      return result
    } finally {
      setSaving(false)
    }
  }

  /**
   * Abre el dialog unificado con la acción correspondiente. Valida cliente
   * antes de abrir. Pre-llena el input con el título actual o una sugerencia
   * basada en la descripción.
   */
  function openDialog(action: DialogAction) {
    if (!validateBeforeSave()) return
    // Para programar, además validamos que haya fecha y hora seleccionadas
    if (action === 'schedule' && (!scheduleDate || !scheduleTime)) {
      toast({
        title: 'Falta fecha u hora',
        description: 'Elegí cuándo se va a publicar antes de programarla.',
      })
      return
    }
    const suggested = title.trim() || description.slice(0, 60).trim()
    setTitleDraftInput(suggested)
    setDialogAction(action)
  }

  /**
   * Confirma la acción del dialog. Despacha según `dialogAction`:
   * draft → guarda/actualiza borrador
   * publish → publica ahora
   * schedule → programa
   * approval → guarda como borrador + pide link de aprobación
   */
  async function handleConfirmDialog() {
    const finalTitle = titleDraftInput.trim()
    if (!finalTitle) {
      toast({ title: 'Escribí un título antes de continuar' })
      return
    }
    const action = dialogAction
    if (!action) return
    // Nota: NO cerramos el diálogo al inicio. Lo dejamos abierto durante el
    // guardado/publicación para que el botón muestre el estado de carga, y lo
    // cerramos recién al terminar (antes del toast/redirect).

    try {
      if (action === 'draft') {
        await saveOrUpdate('draft', finalTitle)
        setDialogAction(null)
        toast({ title: savedPost ? 'Borrador actualizado' : 'Borrador guardado' })
        router.push('/calendario')
      } else if (action === 'publish') {
        // Guardamos con status 'published' y fecha = ahora (buildScheduledAt),
        // así el post tiene una fecha y aparece en el calendario. El diálogo
        // queda en "Publicando…" mientras se confirma la publicación real
        // (Instagram tarda unos segundos; las simuladas son instantáneas).
        setPublishing(true)
        const post = await saveOrUpdate('published', finalTitle)
        const result = await publishPostNow(post.id)
        setDialogAction(null)
        if (result.status === 'failed') {
          const igErr = result.results.find((r) => r.status === 'failed')?.error
          toast({
            title: 'No se pudo publicar',
            description: igErr ?? 'Revisá la cuenta conectada o la imagen.',
          })
        } else {
          const partial = result.results.some((r) => r.status === 'failed')
          toast({
            title: partial
              ? 'Publicado, pero alguna red falló'
              : '¡Publicación publicada!',
          })
        }
        router.push('/calendario')
      } else if (action === 'schedule') {
        await saveOrUpdate('scheduled', finalTitle)
        setDialogAction(null)
        toast({ title: '¡Publicación programada!' })
        router.push('/calendario')
      } else if (action === 'approval') {
        const post = await saveOrUpdate('draft', finalTitle)
        setDialogAction(null)
        setApprovalLoading(true)
        try {
          const { approvalUrl: url } = await requestApproval(post.id)
          setApprovalUrl(url)
          setSavedPost({ ...post, status: 'pending_approval' })
        } finally {
          setApprovalLoading(false)
        }
      }
    } catch (err) {
      toast({
        title: 'Hubo un error',
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setPublishing(false)
    }
  }

  async function handleCopyLink() {
    if (!approvalUrl) return
    await navigator.clipboard.writeText(approvalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDelete() {
    if (!savedPost) return
    setDeleting(true)
    try {
      await deletePost(savedPost.id)
      toast({ title: 'Borrador eliminado' })
      router.push('/calendario')
    } catch (err) {
      toast({
        title: 'No se pudo eliminar',
        description: err instanceof Error ? err.message : undefined,
      })
      setDeleting(false)
    }
  }

  function handleAcceptSchedule(_text: string, schedule?: ScheduleRecommendation) {
    setShowScheduleAi(false)
    if (!schedule) return
    const { date, time } = nextOccurrenceOf(schedule.dayOfWeek, schedule.time)
    setPublishNow(false)
    setScheduleDate(date)
    setScheduleTime(time)
    toast({
      title: 'Horario aplicado',
      description: `${schedule.dayOfWeek} a las ${schedule.time}. Podés cambiarlo si querés.`,
    })
  }

  // ─── Badge de estado de aprobación ────────────────────────────────────────
  const approvalState = (() => {
    if (!savedPost) return null
    if (savedPost.status === 'pending_approval') {
      return {
        kind: 'pending' as const,
        label: 'Pendiente de aprobación',
        icon: <Clock4 className="size-3.5" />,
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      }
    }
    if (savedPost.status === 'approved') {
      return {
        kind: 'approved' as const,
        label: 'Aprobado por el cliente',
        icon: <CheckCircle2 className="size-3.5" />,
        className: 'bg-green-50 text-green-700 border-green-200',
      }
    }
    if (savedPost.status === 'draft' && savedPost.clientFeedback) {
      return {
        kind: 'rejected' as const,
        label: 'Rechazado por el cliente',
        icon: <AlertCircle className="size-3.5" />,
        className: 'bg-red-50 text-red-700 border-red-200',
        feedback: savedPost.clientFeedback,
      }
    }
    if (savedPost.status === 'scheduled') {
      const when = savedPost.scheduledAt
        ? new Date(savedPost.scheduledAt).toLocaleString('es-AR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })
        : null
      return {
        kind: 'scheduled' as const,
        label: when ? `Programada para ${when}` : 'Programada',
        icon: <Clock4 className="size-3.5" />,
        className: 'bg-blue-50 text-blue-700 border-blue-200',
      }
    }
    if (savedPost.status === 'draft') {
      return {
        kind: 'draft' as const,
        label: mode === 'edit' ? 'Editando borrador' : 'Borrador guardado',
        icon: <CheckCircle2 className="size-3.5" />,
        className: 'bg-gray-50 text-gray-600 border-gray-200',
      }
    }
    return null
  })()

  // Status del post para decidir textos
  const editingScheduled = mode === 'edit' && savedPost?.status === 'scheduled'

  // Sólo se pide aprobación para borradores o posts nuevos sin guardar.
  // No tiene sentido para programados/aprobados/publicados.
  const canRequestApproval =
    !savedPost || (savedPost.status === 'draft' && !editingScheduled)

  const heading = (() => {
    if (mode !== 'edit') return 'Nueva publicación'
    if (savedPost?.status === 'scheduled') return 'Editar publicación programada'
    if (savedPost?.status === 'pending_approval') return 'Editar borrador en aprobación'
    if (savedPost?.status === 'approved') return 'Editar publicación aprobada'
    return 'Editar borrador'
  })()

  const draftButtonLabel = saving
    ? 'Guardando…'
    : editingScheduled
    ? 'Convertir a borrador'
    : savedPost
    ? 'Actualizar borrador'
    : 'Guardar borrador'

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{heading}</h1>
        {mode === 'edit' && savedPost && (
          <span className="text-xs text-gray-400 truncate">
            · {savedPost.title}
          </span>
        )}
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <PostEditor
            clientId={clientId}
            description={description}
            networks={networks}
            imageUrl={imageUrl}
            onClientChange={handleClientChange}
            onDescriptionChange={handleDescriptionChange}
            onNetworksChange={handleNetworksChange}
            onImageChange={handleImageChange}
          />
        </div>

        <div className="w-96 flex flex-col gap-4">
          <PostPreview
            description={description}
            imageUrl={imageUrl}
            client={client}
            networks={networks}
            activeNetwork={activePreviewNetwork}
            onNetworkSelect={handleNetworkSelect}
          />

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Publicación</h2>

            {approvalState && (
              <div
                className={`flex items-center gap-2 text-xs px-3 py-2 mb-4 rounded-lg border ${approvalState.className}`}
              >
                {approvalState.icon}
                <span className="font-medium">{approvalState.label}</span>
                {approvalState.kind === 'rejected' && (
                  <span className="ml-1 italic opacity-80 truncate">
                    “{approvalState.feedback}”
                  </span>
                )}
              </div>
            )}

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
                {(() => {
                  if (!scheduleDate) return null
                  const dt = new Date(`${scheduleDate}T${scheduleTime || '00:00'}`)
                  if (isNaN(dt.getTime())) return null
                  return (
                    <p className="text-xs text-gray-400">
                      Se publicará automáticamente en la fecha indicada.
                    </p>
                  )
                })()}
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
                    onAccept={handleAcceptSchedule}
                    onDiscard={() => setShowScheduleAi(false)}
                  />
                )}
              </div>
            )}

            <div className="border-t border-gray-100 pt-4 mt-4 space-y-3">
              <Button
                variant="outline"
                className="w-full text-sm"
                onClick={() => openDialog('draft')}
                disabled={saving || publishing}
              >
                {draftButtonLabel}
              </Button>

              {canRequestApproval && (
                <Button
                  variant="outline"
                  className="w-full text-sm border-[#0095b6] text-[#0095b6] hover:bg-[#cceef5]"
                  onClick={() => openDialog('approval')}
                  disabled={approvalLoading || !description.trim() || saving || publishing}
                >
                  {approvalLoading ? (
                    'Generando link…'
                  ) : (
                    <>
                      <Send className="size-3.5 mr-1.5" />
                      Pedir aprobación al cliente
                    </>
                  )}
                </Button>
              )}

              <button
                onClick={() => openDialog(publishNow ? 'publish' : 'schedule')}
                disabled={saving || publishing}
                className="w-full bg-[#0095b6] text-white font-medium rounded-lg py-2 text-sm hover:bg-[#007a94] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {publishing ? 'Publicando…' : publishNow ? 'Publicar' : 'Programar'}
              </button>
            </div>

            {/* Zona de peligro: solo si el post ya existe */}
            {savedPost && (
              <div className="border-t border-gray-100 pt-3 mt-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      disabled={deleting || saving || publishing}
                      className="w-full text-sm text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="size-3.5 mr-1.5" />
                      {deleting ? 'Eliminando…' : 'Eliminar borrador'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar este borrador?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se va a borrar permanentemente “{savedPost.title}” y no se podrá recuperar.
                        {savedPost.status === 'pending_approval' && (
                          <span className="block mt-2 text-amber-700">
                            ⚠️ El link de aprobación que ya enviaste dejará de funcionar.
                          </span>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        Sí, eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog unificado: pide título + confirma según la acción */}
      <Dialog open={!!dialogAction} onOpenChange={(open) => !open && setDialogAction(null)}>
        <DialogContent className="sm:max-w-md">
          {(() => {
            // Configuración por acción
            const clientName = client?.name ?? 'el cliente seleccionado'
            const scheduleAtFmt =
              dialogAction === 'schedule' && scheduleDate && scheduleTime
                ? new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString('es-AR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ''

            const config = {
              draft: {
                title: editingScheduled
                  ? 'Convertir a borrador'
                  : savedPost
                  ? 'Actualizar borrador'
                  : 'Guardar como borrador',
                description: editingScheduled ? (
                  <>
                    Vas a sacar esta publicación del calendario. <strong>No se va
                    a publicar en la fecha programada</strong>. Va a quedar
                    guardada como borrador y la podés re-programar cuando quieras.
                  </>
                ) : savedPost ? (
                  'Vas a sobrescribir los datos del borrador con lo que tenés ahora. Los cambios anteriores quedan reemplazados.'
                ) : (
                  'Ponele un título a este borrador para identificarlo fácil en tu lista. No se muestra a tu audiencia.'
                ),
                confirmLabel: saving
                  ? 'Guardando…'
                  : editingScheduled
                  ? 'Sí, convertir'
                  : savedPost
                  ? 'Actualizar'
                  : 'Guardar',
                confirmClass: 'bg-[#0095b6] hover:bg-[#007a94] text-white',
              },
              publish: {
                title: 'Publicar ahora',
                description: (
                  <>
                    Vas a publicar inmediatamente en las redes de{' '}
                    <strong className="text-gray-900">{clientName}</strong>.{' '}
                    <span className="text-red-600 font-medium">Esta acción no se puede deshacer</span> —
                    una vez en la red, publi no puede borrar la publicación.
                  </>
                ),
                confirmLabel: saving || publishing ? 'Publicando…' : 'Sí, publicar ahora',
                confirmClass: 'bg-[#0095b6] hover:bg-[#007a94] text-white',
              },
              schedule: {
                title: 'Programar publicación',
                description: (
                  <>
                    Se va a publicar automáticamente {scheduleAtFmt && (<>el <strong className="text-gray-900">{scheduleAtFmt}</strong></>)} en las redes de{' '}
                    <strong className="text-gray-900">{clientName}</strong>. Vas a poder
                    editarla o cancelarla desde el calendario en cualquier momento antes
                    de la fecha de publicación.
                  </>
                ),
                confirmLabel: saving ? 'Programando…' : 'Programar',
                confirmClass: 'bg-[#0095b6] hover:bg-[#007a94] text-white',
              },
              approval: {
                title: 'Enviar al cliente para aprobación',
                description: (
                  <>
                    Vamos a guardar como borrador y generar un link público para que{' '}
                    <strong className="text-gray-900">{clientName}</strong> apruebe o
                    rechace esta publicación. Vas a recibir su respuesta en esta misma
                    pantalla.
                  </>
                ),
                confirmLabel: saving ? 'Guardando…' : 'Guardar y generar link',
                confirmClass: 'bg-[#0095b6] hover:bg-[#007a94] text-white',
              },
            } as const

            const c = dialogAction ? config[dialogAction] : null
            if (!c) return null

            return (
              <>
                <DialogHeader>
                  <DialogTitle>{c.title}</DialogTitle>
                  <DialogDescription>{c.description}</DialogDescription>
                </DialogHeader>

                <div className="mt-2">
                  <Label
                    htmlFor="dialog-title-input"
                    className="text-sm font-medium text-gray-700 mb-2 block"
                  >
                    Título <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="dialog-title-input"
                    autoFocus
                    value={titleDraftInput}
                    onChange={(e) => setTitleDraftInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && titleDraftInput.trim() && !saving && !publishing) {
                        handleConfirmDialog()
                      }
                    }}
                    placeholder="ej: Lanzamiento campaña primavera"
                    maxLength={120}
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    Nombre interno para encontrarlo después. No se muestra a tu audiencia.
                  </p>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogAction(null)}
                    disabled={saving || publishing}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmDialog}
                    disabled={!titleDraftInput.trim() || saving || publishing}
                    className={c.confirmClass}
                  >
                    {c.confirmLabel}
                  </Button>
                </DialogFooter>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={!!approvalUrl} onOpenChange={(open) => !open && setApprovalUrl(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="size-4 text-[#0095b6]" />
              Link de aprobación listo
            </DialogTitle>
            <DialogDescription>
              Copiá este link y enviáselo a tu cliente por WhatsApp, email o como prefieras.
              No necesita crear una cuenta para responder.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 truncate">
              {approvalUrl}
            </div>
            <button
              onClick={handleCopyLink}
              className="shrink-0 flex items-center gap-1.5 bg-[#0095b6] text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-[#007a94] transition-colors"
            >
              {copied ? (
                <>
                  <Check className="size-4" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  Copiar
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-2">
            El post quedó en estado <strong>pendiente de aprobación</strong>.
            Una vez que tu cliente responda, verás el resultado acá mismo o en el calendario.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
