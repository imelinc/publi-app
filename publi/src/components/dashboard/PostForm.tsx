'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Copy, Check, Send, Clock4, AlertCircle, CheckCircle2, Trash2, Lock } from 'lucide-react'
import { useAppStore } from '@/store/use-app-store'
import type { Network, PostStatus, Post } from '@/types'
import { PostEditor } from '@/components/dashboard/PostEditor'
import { NETWORK_META } from '@/lib/networks'
import { PostPreview } from '@/components/dashboard/PostPreview'
import { AiPanel, type ScheduleRecommendation } from '@/components/dashboard/AiPanel'
import { PlanUpgradeDialog } from '@/components/dashboard/PlanUpgradeDialog'
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

const FUNNY_MESSAGES = [
  "Iniciando motores de propulsión de posts...",
  "Estableciendo conexión segura con Meta...",
  "Llamando a las oficinas de Meta en Menlo Park...",
  "Consultando con Mark Zuckerberg (dice que le gusta tu post)...",
  "Verificando que no estés publicando fotos de gatitos sin autorización...",
  "Alineando píxeles en el feed...",
  "Subiendo imágenes a la nube intergaláctica...",
  "Sobornando a los algoritmos de Instagram para darte más alcance...",
  "Configurando el contenedor de carrusel (esto requiere café)...",
  "Casi listo, puliendo los últimos detalles..."
]

const FUN_FACTS = [
  "¿Sabías que la primera foto en Instagram se subió el 16 de julio de 2010 y era un perro?",
  "¿Sabías que el hashtag nació en Twitter en 2007 gracias a Chris Messina?",
  "¿Sabías que Instagram tiene más de 2.000 millones de usuarios activos al mes?",
  "¿Sabías que el mejor horario general para publicar suele ser entre las 6 PM y 9 PM?",
  "¿Sabías que las publicaciones con al menos un hashtag reciben un 12.6% más de interacción?",
  "¿Sabías que el primer correo electrónico de la historia se envió en 1971 por Ray Tomlinson?",
  "¿Sabías que la pizza es la comida más fotografiada en Instagram a nivel mundial?",
  "¿Sabías que las publicaciones en carrusel tienen el mayor ratio de engagement promedio en Instagram?",
  "¿Sabías que el 80% de los usuarios de Instagram siguen al menos a una cuenta de empresa?",
  "¿Sabías que la fuente tipográfica de Instagram se llama Billabong?"
]

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
  const { addPost, updatePostRemote, deletePost, requestApproval, publishPostNow, activeWorkspaceId, clients, userProfile } = useAppStore()
  const setHasUnsavedChanges = useAppStore((s) => s.setHasUnsavedChanges)

  // ─── Estado del form ──────────────────────────────────────────────────────────
  const [title, setTitle] = useState(initialPost?.title ?? '')
  const [clientId, setClientId] = useState(initialPost?.clientId ?? activeWorkspaceId)
  const [description, setDescription] = useState(initialPost?.description ?? '')
  const [networks, setNetworks] = useState<Network[]>(initialPost?.networks ?? [])
  const [mediaUrls, setMediaUrls] = useState<string[]>(
    initialPost?.mediaUrls ?? []
  )
  const [activePreviewNetwork, setActivePreviewNetwork] = useState<Network | null>(
    initialPost?.networks?.[0] ?? null
  )
  const [contentFormat, setContentFormat] = useState<'feed' | 'story'>(
    initialPost?.contentFormat ?? 'feed'
  )
  const [isCustomized, setIsCustomized] = useState(() => {
    if (initialPost?.publications) {
      return initialPost.publications.some((pub) => pub.description !== null)
    }
    return false
  })
  const [customDescriptions, setCustomDescriptions] = useState<Record<Network, string>>(() => {
    const customs = {} as Record<Network, string>
    if (initialPost?.publications) {
      for (const pub of initialPost.publications) {
        if (pub.description !== null) {
          customs[pub.network] = pub.description
        }
      }
    }
    return customs
  })

  const [dailyLimit, setDailyLimit] = useState<{ used: number; limit: number; remaining: number; nextSlotAvailableAt: string | null } | null>(null)
  const [loadingDailyLimit, setLoadingDailyLimit] = useState(false)

  const fetchDailyLimit = useCallback(async (cId: string) => {
    if (!cId) return
    setLoadingDailyLimit(true)
    try {
      const res = await fetch(`/api/instagram/daily-limit?clientId=${cId}`)
      if (res.ok) {
        const data = await res.json()
        setDailyLimit(data)
      } else {
        setDailyLimit(null)
      }
    } catch (err) {
      console.error('Error fetching daily limit:', err)
      setDailyLimit(null)
    } finally {
      setLoadingDailyLimit(false)
    }
  }, [])

  useEffect(() => {
    if (clientId) {
      fetchDailyLimit(clientId)
    }
  }, [clientId, fetchDailyLimit])

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
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [savedPost, setSavedPost] = useState<Post | null>(initialPost ?? null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [funnyMsgIndex, setFunnyMsgIndex] = useState(0)
  const [factIndex, setFactIndex] = useState(0)

  // Dialog unificado: pide título + confirma según la acción
  type DialogAction = 'draft' | 'publish' | 'schedule' | 'approval'
  const [dialogAction, setDialogAction] = useState<DialogAction | null>(null)
  const [titleDraftInput, setTitleDraftInput] = useState('')

  const client = clients.find((c) => c.id === clientId) ?? null

  // ─── Tracking de cambios sin guardar ─────────────────────────────────────────
  // Snapshot del estado "limpio" (al cargar o después de cada save exitoso).
  // Comparamos contra esto para saber si hay cambios pendientes.
  // Extract initial custom descriptions for snapshot
  const getInitialCustomDescriptions = () => {
    const customs = {} as Record<Network, string>
    if (initialPost?.publications) {
      for (const pub of initialPost.publications) {
        if (pub.description !== null) {
          customs[pub.network] = pub.description
        }
      }
    }
    return customs
  }
  const initialIsCustomizedVal = initialPost?.publications 
    ? initialPost.publications.some((pub) => pub.description !== null)
    : false

  const cleanSnapshotRef = useRef({
    title: initialPost?.title ?? '',
    description: initialPost?.description ?? '',
    networks: initialPost?.networks ?? [],
    mediaUrls: initialPost?.mediaUrls ?? [],
    clientId: initialPost?.clientId ?? '',
    scheduleDate: initialPost?.scheduledAt ? toDateInput(new Date(initialPost.scheduledAt)) : '',
    scheduleTime: initialPost?.scheduledAt ? toTimeInput(initialPost.scheduledAt) : '',
    contentFormat: initialPost?.contentFormat ?? 'feed',
    isCustomized: initialIsCustomizedVal,
    customDescriptions: getInitialCustomDescriptions(),
  })

  // Al iniciar la publicación o programación, inicializamos los índices de forma aleatoria y rotamos mensajes
  useEffect(() => {
    if (publishing || scheduling) {
      setFunnyMsgIndex(Math.floor(Math.random() * FUNNY_MESSAGES.length))
      setFactIndex(Math.floor(Math.random() * FUN_FACTS.length))

      const msgInterval = setInterval(() => {
        setFunnyMsgIndex((prev) => (prev + 1) % FUNNY_MESSAGES.length)
      }, 4000)

      const factInterval = setInterval(() => {
        setFactIndex((prev) => (prev + 1) % FUN_FACTS.length)
      }, 7000)

      return () => {
        clearInterval(msgInterval)
        clearInterval(factInterval)
      }
    }
  }, [publishing, scheduling])

  // Detecta cambios y los reporta al store (para que el Sidebar consulte)
  useEffect(() => {
    const s = cleanSnapshotRef.current
    const isCreateEmpty =
      mode === 'create' &&
      title.trim() === '' &&
      description.trim() === '' &&
      mediaUrls.length === 0

    const dirty = !isCreateEmpty && (
      title !== s.title ||
      description !== s.description ||
      JSON.stringify(networks) !== JSON.stringify(s.networks) ||
      JSON.stringify(mediaUrls) !== JSON.stringify(s.mediaUrls) ||
      clientId !== s.clientId ||
      scheduleDate !== s.scheduleDate ||
      scheduleTime !== s.scheduleTime ||
      contentFormat !== s.contentFormat ||
      isCustomized !== s.isCustomized ||
      JSON.stringify(customDescriptions) !== JSON.stringify(s.customDescriptions)
    )
    setHasUnsavedChanges(dirty)
  }, [mode, title, description, networks, mediaUrls, clientId, scheduleDate, scheduleTime, contentFormat, isCustomized, customDescriptions, setHasUnsavedChanges])

  // Al desmontar el form, asegurarse de limpiar el flag global
  useEffect(() => {
    return () => setHasUnsavedChanges(false)
  }, [setHasUnsavedChanges])

  // beforeunload: prevenir cierre/refresh con cambios sin guardar o publicando/programando
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      // Re-leemos el store en cada call para no quedar con stale value
      if (useAppStore.getState().hasUnsavedChanges || publishing || scheduling) {
        e.preventDefault()
        e.returnValue = '' // Chrome requiere setear returnValue
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [publishing, scheduling])

  /** Refresca el snapshot "limpio" después de un save exitoso */
  function markClean(post?: Post) {
    const customs = {} as Record<Network, string>
    let isCust = false
    if (post?.publications) {
      for (const pub of post.publications) {
        if (pub.description !== null) {
          isCust = true
          customs[pub.network] = pub.description
        }
      }
    } else {
      isCust = isCustomized
      Object.assign(customs, customDescriptions)
    }

    cleanSnapshotRef.current = {
      title: post?.title ?? title,
      description: post?.description ?? description,
      networks: post?.networks ?? networks,
      mediaUrls: post?.mediaUrls ?? mediaUrls,
      clientId: post?.clientId ?? clientId,
      scheduleDate,
      scheduleTime,
      contentFormat: post?.contentFormat ?? contentFormat,
      isCustomized: isCust,
      customDescriptions: customs,
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

  // Sincronizar initialPost externo con estados internos de PostForm.
  // Esto es crucial para re-fetch, tiempo real y cuando cambia el post desde el padre,
  // sin forzar un remount total del componente que rompería flujos (ej: popup de aprobación).
  useEffect(() => {
    if (!initialPost) return

    setSavedPost(initialPost)

    const hasChanges = useAppStore.getState().hasUnsavedChanges
    // Solo sobreescribimos los campos editables si no hay cambios sin guardar.
    if (!hasChanges) {
      setTitle(initialPost.title ?? '')
      setClientId(initialPost.clientId)
      setDescription(initialPost.description ?? '')
      setNetworks(initialPost.networks ?? [])
      setMediaUrls(initialPost.mediaUrls ?? [])
      setContentFormat(initialPost.contentFormat ?? 'feed')
      
      const isCust = initialPost.publications 
        ? initialPost.publications.some((pub) => pub.description !== null)
        : false
      setIsCustomized(isCust)

      const customs = {} as Record<Network, string>
      if (initialPost.publications) {
        for (const pub of initialPost.publications) {
          if (pub.description !== null) {
            customs[pub.network] = pub.description
          }
        }
      }
      setCustomDescriptions(customs)

      setScheduleDate(initialPost.scheduledAt ? toDateInput(new Date(initialPost.scheduledAt)) : '')
      setScheduleTime(initialPost.scheduledAt ? toTimeInput(initialPost.scheduledAt) : '')

      // Actualizamos también el snap de limpieza
      cleanSnapshotRef.current = {
        title: initialPost.title ?? '',
        description: initialPost.description ?? '',
        networks: initialPost.networks ?? [],
        mediaUrls: initialPost.mediaUrls ?? [],
        clientId: initialPost.clientId,
        scheduleDate: initialPost.scheduledAt ? toDateInput(new Date(initialPost.scheduledAt)) : '',
        scheduleTime: initialPost.scheduledAt ? toTimeInput(initialPost.scheduledAt) : '',
        contentFormat: initialPost.contentFormat ?? 'feed',
        isCustomized: isCust,
        customDescriptions: customs,
      }
    }
  }, [initialPost])

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

  // Reset contentFormat to 'feed' if the selected client doesn't have instagram connected
  useEffect(() => {
    if (client && !client.connectedNetworks.includes('instagram') && contentFormat === 'story') {
      setContentFormat('feed')
    }
  }, [client, contentFormat])

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
  const handleMediaUrlsChange = useCallback((urls: string[]) => setMediaUrls(urls), [])
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
      const customDescPayload = isCustomized ? customDescriptions : null
      if (savedPost) {
        // PATCH al post existente — cambia status si corresponde (ej: scheduled → draft)
        result = await updatePostRemote(savedPost.id, {
          title: effectiveTitle,
          description,
          networks,
          mediaUrls,
          hashtags: [],
          status: status === 'draft' ? 'draft' : status === 'scheduled' ? 'scheduled' : 'published',
          scheduledAt: status === 'draft' ? null : buildScheduledAt(),
          contentFormat,
          customDescriptions: customDescPayload,
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
          mediaUrls,
          hashtags: [],
          contentFormat,
          customDescriptions: customDescPayload,
        })
        setSavedPost(result)
        setTitle(effectiveTitle)
      }
      fetchDailyLimit(clientId)
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
    setDialogAction(null)

    try {
      if (action === 'draft') {
        await saveOrUpdate('draft', finalTitle)
        toast({ title: savedPost ? 'Borrador actualizado' : 'Borrador guardado' })
        router.push('/calendario')
      } else if (action === 'publish') {
        // Guardamos como 'draft' primero; publishPostNow se encarga de actualizar
        // el status a 'published' o 'failed' según el resultado real de Instagram.
        const post = await saveOrUpdate('draft', finalTitle)
        setPublishing(true)
        try {
          const result = await publishPostNow(post.id)
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
        } finally {
          setPublishing(false)
        }
      } else if (action === 'schedule') {
        setScheduling(true)
        try {
          await saveOrUpdate('scheduled', finalTitle)
          toast({ title: '¡Publicación programada!' })
          router.push('/calendario')
        } finally {
          setScheduling(false)
        }
      } else if (action === 'approval') {
        const post = await saveOrUpdate('draft', finalTitle)
        setApprovalLoading(true)
        try {
          const { approvalUrl: url } = await requestApproval(post.id)
          setApprovalUrl(url)
          setSavedPost({ ...post, status: 'pending_approval', clientFeedback: null })
        } finally {
          setApprovalLoading(false)
        }
      }
    } catch (err) {
      toast({
        title: 'Hubo un error',
        description: err instanceof Error ? err.message : undefined,
      })
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
            mediaUrls={mediaUrls}
            contentFormat={contentFormat}
            onClientChange={handleClientChange}
            onDescriptionChange={handleDescriptionChange}
            onNetworksChange={handleNetworksChange}
            onMediaUrlsChange={handleMediaUrlsChange}
            onContentFormatChange={setContentFormat}
            isCustomized={isCustomized}
            onIsCustomizedChange={setIsCustomized}
            customDescriptions={customDescriptions}
            onCustomDescriptionsChange={setCustomDescriptions}
          />
        </div>

        <div className="w-96 flex flex-col gap-4">
          {savedPost && (savedPost.clientFeedback || savedPost.status === 'approved') && (() => {
            const feedbackText = savedPost.clientFeedback || 
              (savedPost.status === 'approved' 
                ? 'El cliente aprobó esta publicación.' 
                : 'El cliente solicitó cambios.')
            return (
              <div className={`rounded-xl border p-5 shadow-xs transition-all duration-300 ${
                savedPost.status === 'approved'
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 shadow-emerald-100/30'
                  : 'bg-rose-50/70 border-rose-200 text-rose-950 shadow-rose-100/30'
              }`}>
                <div className="flex items-center gap-2.5 mb-3">
                  {savedPost.status === 'approved' ? (
                    <div className="size-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 shadow-xs">
                      <CheckCircle2 className="size-4" />
                    </div>
                  ) : (
                    <div className="size-7 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 shrink-0 shadow-xs">
                      <AlertCircle className="size-4" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-[10px] uppercase tracking-wider text-gray-500">
                      Feedback del Cliente
                    </h3>
                    <p className="text-xs font-bold text-gray-900 leading-tight">
                      {savedPost.status === 'approved'
                        ? 'Publicación Aprobada'
                        : 'Cambios Solicitados'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-white/95 border border-black/5 rounded-xl p-3.5 text-xs italic text-gray-700 leading-relaxed font-sans shadow-xs relative overflow-hidden">
                  <span className="text-gray-200 text-3xl font-serif absolute -top-1.5 left-1 select-none pointer-events-none">“</span>
                  <p className="pl-4 pr-1 pt-0.5 font-medium whitespace-pre-wrap">{feedbackText}</p>
                  <span className="text-gray-200 text-3xl font-serif absolute -bottom-4 right-1 select-none pointer-events-none">”</span>
                </div>
                
                {savedPost.updatedAt && (
                  <p className="text-[9px] text-gray-400 mt-2 text-right font-medium">
                    Recibido el {new Date(savedPost.updatedAt).toLocaleDateString('es-AR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            )
          })()}

          <PostPreview
            description={
              isCustomized && activePreviewNetwork
                ? (customDescriptions[activePreviewNetwork] ?? description)
                : description
            }
            mediaUrls={mediaUrls}
            client={client}
            networks={networks}
            activeNetwork={activePreviewNetwork}
            contentFormat={contentFormat}
            onNetworkSelect={handleNetworkSelect}
          />

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Publicación</h2>

            {networks.includes('instagram') && dailyLimit && (
              <div className={`text-xs px-3 py-2.5 mb-4 rounded-lg border flex flex-col gap-1 ${
                dailyLimit.remaining <= 0
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : dailyLimit.remaining <= 3
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-green-50 text-green-700 border-green-200'
              }`}>
                <div className="flex items-center justify-between font-medium">
                  <span>Límite de Instagram:</span>
                  <span>{dailyLimit.used} de {dailyLimit.limit} usados</span>
                </div>
                {dailyLimit.remaining <= 0 ? (
                  <p className="text-[10px] leading-snug mt-1 opacity-90 font-medium">
                    ⚠️ Límite alcanzado. Próximo cupo disponible: {new Date(dailyLimit.nextSlotAvailableAt!).toLocaleString('es-AR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                ) : (
                  <p className="text-[10px] leading-snug mt-0.5 opacity-80">
                    Ventana móvil de 24 horas.
                  </p>
                )}
              </div>
            )}

            {approvalState && (
              <div
                className={`flex items-center gap-2 text-xs px-3 py-2 mb-4 rounded-lg border ${approvalState.className}`}
              >
                {approvalState.icon}
                <span className="font-medium">{approvalState.label}</span>
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
                  onClick={() => {
                    if (userProfile?.plan === 'free') {
                      setUpgradeDialogOpen(true)
                    } else {
                      setShowScheduleAi(!showScheduleAi)
                    }
                  }}
                  className="inline-flex items-center gap-1.5 border border-[#0095b6] text-[#0095b6] text-sm rounded-lg px-3 py-1.5 hover:bg-[#cceef5] transition-colors"
                >
                  <Sparkles className="size-3.5" />
                  IA: Sugerir horario
                  {userProfile?.plan === 'free' && <Lock className="size-3 text-[#0095b6] shrink-0" />}
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
                disabled={saving}
              >
                {draftButtonLabel}
              </Button>

              {canRequestApproval && (
                <Button
                  variant="outline"
                  className="w-full text-sm border-[#0095b6] text-[#0095b6] hover:bg-[#cceef5]"
                  onClick={() => openDialog('approval')}
                  disabled={approvalLoading || !description.trim() || saving}
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
                disabled={saving || (networks.includes('instagram') && dailyLimit !== null && dailyLimit.remaining <= 0)}
                className="w-full bg-[#0095b6] text-white font-medium rounded-lg py-2 text-sm hover:bg-[#007a94] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {publishNow ? 'Publicar' : 'Programar'}
              </button>
            </div>

            {/* Zona de peligro: solo si el post ya existe */}
            {savedPost && (
              <div className="border-t border-gray-100 pt-3 mt-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      disabled={deleting || saving}
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
                confirmLabel: saving ? 'Publicando…' : 'Sí, publicar ahora',
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
                      if (e.key === 'Enter' && titleDraftInput.trim() && !saving) {
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
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmDialog}
                    disabled={!titleDraftInput.trim() || saving}
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
        <DialogContent className="!flex !flex-col gap-4 !max-w-md sm:!max-w-md bg-white border border-gray-150 p-6 rounded-2xl shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#cceef5]/60 text-[#0095b6] ring-8 ring-[#cceef5]/20 mb-4 animate-pulse">
            <Send className="h-6 w-6" />
          </div>

          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold text-gray-900 text-center">
              ¡Link de Aprobación Listo!
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 text-center max-w-xs mx-auto mt-1">
              Copiá este enlace exclusivo y compartilo con tu cliente. No necesita registrarse ni iniciar sesión para responder.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-[#f5f0e8]/45 border border-[#cceef5]/40 rounded-xl p-4 my-3 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Cliente Destinatario</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-gray-950">
                <span className="size-2 rounded-full" style={{ backgroundColor: client?.color ?? '#0095b6' }} />
                {client?.name ?? 'Cliente'}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Redes Sociales</span>
              <div className="flex gap-1">
                {networks.map((network) => (
                  <span key={network} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white border border-gray-150 text-gray-700 shadow-2xs">
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: NETWORK_META[network]?.color ?? '#999' }} />
                    {NETWORK_META[network]?.label ?? network}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-2">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-150 rounded-xl p-1.5 pl-3">
              <div className="flex-1 text-xs text-gray-600 font-mono truncate select-all">
                {approvalUrl}
              </div>
              <Button
                size="sm"
                onClick={handleCopyLink}
                className="h-8 bg-[#0095b6] hover:bg-[#007a94] text-white text-xs font-semibold px-3 rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    Copiar
                  </>
                )}
              </Button>
            </div>

            {approvalUrl && (
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `¡Hola! Te comparto el borrador de la publicación "${title || 'Nueva publicación'}" de ${client?.name ?? 'Cliente'} para que la revises, dejes tus comentarios o la apruebes desde este link:\n\n${approvalUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] active:scale-[0.98] text-white font-semibold rounded-xl py-2.5 text-xs transition-all shadow-xs hover:shadow-md cursor-pointer"
              >
                <svg className="size-4 fill-none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.014 8.00613C6.12827 7.1024 7.30277 5.87414 8.23488 6.01043L8.23339 6.00894C9.14051 6.18132 9.85859 7.74261 10.2635 8.44465C10.5504 8.95402 10.3641 9.4701 10.0965 9.68787C9.7355 9.97883 9.17099 10.3803 9.28943 10.7834C9.5 11.5 12 14 13.2296 14.7107C13.695 14.9797 14.0325 14.2702 14.3207 13.9067C14.5301 13.6271 15.0466 13.46 15.5548 13.736C16.3138 14.178 17.0288 14.6917 17.69 15.27C18.0202 15.546 18.0977 15.9539 17.8689 16.385C17.4659 17.1443 16.3003 18.1456 15.4542 17.9421C13.9764 17.5868 8 15.27 6.08033 8.55801C5.97237 8.24048 5.99955 8.12044 6.014 8.00613Z" fill="currentColor"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 23C10.7764 23 10.0994 22.8687 9 22.5L6.89443 23.5528C5.56462 24.2177 4 23.2507 4 21.7639V19.5C1.84655 17.492 1 15.1767 1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23ZM6 18.6303L5.36395 18.0372C3.69087 16.4772 3 14.7331 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C11.0143 21 10.552 20.911 9.63595 20.6038L8.84847 20.3397L6 21.7639V18.6303Z" fill="currentColor"/>
                </svg>
                Compartir por WhatsApp
              </a>
            )}
          </div>

          <p className="text-[10px] text-center text-gray-400 leading-normal mt-3">
            El post quedó en estado <strong className="text-gray-600 font-semibold">pendiente de aprobación</strong>. Cuando el cliente responda, verás el resultado en tiempo real aquí mismo o en tu calendario.
          </p>
        </DialogContent>
      </Dialog>

      {/* Dialog de carga al publicar o programar */}
      <Dialog open={publishing || scheduling} onOpenChange={() => {}}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-md bg-white border border-gray-100 p-6 rounded-2xl shadow-xl overflow-hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="flex flex-col items-center text-center py-4 space-y-6">
            {/* Spinner animado y pulido */}
            <div className="relative flex items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-100 border-t-[#0095b6]"></div>
              <Sparkles className="absolute size-6 text-[#0095b6] animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {publishing ? 'Estamos publicando...' : 'Estamos programando...'}
              </h3>
              <p className="text-sm text-gray-500 font-medium min-h-[40px] px-2 transition-all duration-300 flex items-center justify-center">
                {FUNNY_MESSAGES[funnyMsgIndex]}
              </p>
            </div>

            {/* Separador sutil */}
            <div className="w-full border-t border-gray-100 my-2"></div>

            {/* Tarjeta de dato curioso */}
            <div className="w-full bg-[#f5f0e8]/50 rounded-xl p-4 border border-[#cceef5]/40 text-left space-y-1.5 transition-all duration-300">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0095b6] flex items-center gap-1">
                💡 Dato curioso
              </span>
              <p className="text-xs text-gray-600 leading-relaxed italic min-h-[36px]">
                {FUN_FACTS[factIndex]}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Plan Upgrade Dialog */}
      <PlanUpgradeDialog
        open={upgradeDialogOpen}
        onClose={() => setUpgradeDialogOpen(false)}
      />
    </div>
  )
}
