'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  RefreshCw,
  Clock4,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar as CalendarIcon,
  Send,
  Image as ImageIcon,
  Smartphone,
} from 'lucide-react'
import { useAppStore } from '@/store/use-app-store'
import { Button } from '@/components/ui/button'
import { NETWORK_META } from '@/lib/networks'
import type { Post } from '@/types'
import { cn } from '@/lib/utils'

type StatusFilter = 'all' | 'drafts' | 'scheduled' | 'published'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Devuelve el badge de status de publicación (borrador / programada / publicada / falló). */
function getStatusBadge(post: Post) {
  if (post.status === 'scheduled') {
    return { label: 'Programada', icon: CalendarIcon, cls: 'bg-blue-50 text-blue-700 border-blue-200' }
  }
  if (post.status === 'published') {
    return { label: 'Publicada', icon: CheckCircle2, cls: 'bg-green-50 text-green-700 border-green-200' }
  }
  if (post.status === 'failed') {
    return { label: 'Falló al publicar', icon: AlertCircle, cls: 'bg-red-50 text-red-700 border-red-200' }
  }
  // draft, pending_approval, approved → todos son "borradores" desde la UX del CM
  return { label: 'Borrador', icon: FileText, cls: 'bg-gray-100 text-gray-700 border-gray-200' }
}

/**
 * Devuelve el badge de estado de aprobación, siempre visible para que el CM
 * sepa de un vistazo si está esperando feedback del cliente.
 */
function getApprovalBadge(post: Post) {
  if (post.status === 'pending_approval') {
    return { label: 'Esperando aprobación', icon: Clock4, cls: 'bg-amber-50 text-amber-700 border-amber-200' }
  }
  if (post.status === 'draft' && post.clientFeedback) {
    return { label: 'Rechazada por cliente', icon: AlertCircle, cls: 'bg-red-50 text-red-700 border-red-200' }
  }
  // Si pasó por aprobación y fue aceptada (status 'approved' o tiene approvedAt)
  if (post.status === 'approved' || post.approvedAt) {
    return { label: 'Aprobada por cliente', icon: CheckCircle2, cls: 'bg-green-50 text-green-700 border-green-200' }
  }
  // Borradores que nunca se enviaron a aprobar / publicados directos
  return { label: 'Sin pedir aprobación', icon: Send, cls: 'bg-gray-50 text-gray-500 border-gray-200' }
}

/** Fecha relevante a mostrar en la card: scheduledAt si existe, sino createdAt. */
function formatRelevantDate(post: Post): string {
  const iso = post.scheduledAt ?? post.createdAt
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PublicacionesPage() {
  const router = useRouter()
  const { posts, clients, fetchPosts } = useAppStore()
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [formatFilter, setFormatFilter] = useState<'all' | 'feed' | 'story'>('all')
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await fetchPosts()
    } finally {
      setRefreshing(false)
    }
  }

  // Filtrado por cliente (antes que por status para los conteos)
  const postsByClient = useMemo(() => {
    if (clientFilter === 'all') return posts
    return posts.filter((p) => p.clientId === clientFilter)
  }, [posts, clientFilter])

  // Conteos por estado (para mostrar en cada tab)
  const counts = useMemo(() => {
    const c = { all: 0, drafts: 0, scheduled: 0, published: 0 }
    for (const p of postsByClient) {
      if (formatFilter !== 'all' && p.contentFormat !== formatFilter) continue
      c.all++
      if (p.status === 'draft' || p.status === 'pending_approval' || p.status === 'approved') c.drafts++
      else if (p.status === 'scheduled') c.scheduled++
      else if (p.status === 'published' || p.status === 'failed') c.published++
    }
    return c
  }, [postsByClient, formatFilter])

  const filteredPosts = useMemo(() => {
    let result = postsByClient
    if (statusFilter === 'drafts') {
      result = result.filter(
        (p) => p.status === 'draft' || p.status === 'pending_approval' || p.status === 'approved'
      )
    } else if (statusFilter === 'scheduled') {
      result = result.filter((p) => p.status === 'scheduled')
    } else if (statusFilter === 'published') {
      result = result.filter((p) => p.status === 'published' || p.status === 'failed')
    }

    if (formatFilter !== 'all') {
      result = result.filter((p) => p.contentFormat === formatFilter)
    }

    // Más reciente primero (por scheduledAt o por createdAt)
    return [...result].sort((a, b) => {
      const da = a.scheduledAt ?? a.createdAt
      const db = b.scheduledAt ?? b.createdAt
      return db.localeCompare(da)
    })
  }, [postsByClient, statusFilter, formatFilter])

  function handleOpenPost(post: Post) {
    // Las publicadas/falladas no se pueden editar; el editor las bloquea pero
    // igual permitimos navegar para ver detalles (lo maneja la página de edición).
    router.push(`/borrador/${post.id}`)
  }

  const tabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'Todas', count: counts.all },
    { key: 'drafts', label: 'Borradores', count: counts.drafts },
    { key: 'scheduled', label: 'Programadas', count: counts.scheduled },
    { key: 'published', label: 'Publicadas', count: counts.published },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Publicaciones</h1>
          <p className="text-sm text-gray-500 mt-1">
            Revisá todas las publicaciones de tus clientes y su estado de aprobación.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none"
          >
            <option value="all">Todos los clientes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value as 'all' | 'feed' | 'story')}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none"
          >
            <option value="all">Todos los formatos</option>
            <option value="feed">Feed (Publicaciones)</option>
            <option value="story">Stories</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando…' : 'Actualizar'}
          </Button>
        </div>
      </div>

      {/* Tabs con contadores */}
      <div className="flex border-b border-gray-200 -mb-px">
        {tabs.map((t) => {
          const active = statusFilter === t.key
          return (
            <button
              key={t.key}
              onClick={() => setStatusFilter(t.key)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                active
                  ? 'border-[#0095b6] text-[#0095b6]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
              )}
            >
              {t.label}
              <span
                className={cn(
                  'ml-1.5 rounded-full px-1.5 py-0.5 text-xs',
                  active ? 'bg-[#cceef5] text-[#0095b6]' : 'bg-gray-100 text-gray-500'
                )}
              >
                {t.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Lista de publicaciones */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500">No hay publicaciones en este filtro.</p>
          <p className="text-sm text-gray-400 mt-1">
            Probá cambiar el cliente o el estado seleccionado.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map((post) => {
            const statusBadge = getStatusBadge(post)
            const approvalBadge = getApprovalBadge(post)
            const StatusIcon = statusBadge.icon
            const ApprovalIcon = approvalBadge.icon
            const thumb = post.mediaUrls?.[0] ?? null

            return (
              <div
                key={post.id}
                onClick={() => handleOpenPost(post)}
                className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer flex flex-col gap-3"
              >
                {/* Header: cliente + redes */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: post.clientColor }}
                    >
                      {post.clientName.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {post.clientName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {post.networks.slice(0, 3).map((n) => {
                      const meta = NETWORK_META[n]
                      return (
                        <img
                          key={n}
                          src={meta.iconColor}
                          alt={meta.label}
                          width={16}
                          height={16}
                        />
                      )
                    })}
                    {post.networks.length > 3 && (
                      <span className="text-[10px] text-gray-400 ml-0.5">
                        +{post.networks.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Cuerpo: imagen + contenido */}
                <div className="flex gap-3">
                  {thumb ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={thumb}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover shrink-0 border border-gray-100"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                      <ImageIcon className="size-5 text-gray-300" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                      {post.title || 'Sin título'}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                      {post.description || 'Sin descripción'}
                    </p>
                  </div>
                </div>

                {/* Feedback de cliente (si fue rechazada) */}
                {post.status === 'draft' && post.clientFeedback && (
                  <p className="text-[11px] italic text-red-500 line-clamp-2 px-2 py-1.5 bg-red-50 rounded">
                    “{post.clientFeedback}”
                  </p>
                )}

                {/* Footer: badges + fecha */}
                <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-gray-50">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border',
                      statusBadge.cls
                    )}
                  >
                    <StatusIcon className="size-3" />
                    {statusBadge.label}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border',
                      approvalBadge.cls
                    )}
                  >
                    <ApprovalIcon className="size-3" />
                    {approvalBadge.label}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border',
                      post.contentFormat === 'story'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    )}
                  >
                    {post.contentFormat === 'story' ? (
                      <Smartphone className="size-3" />
                    ) : (
                      <ImageIcon className="size-3" />
                    )}
                    {post.contentFormat === 'story' ? 'Story' : 'Feed'}
                  </span>
                  <span className="ml-auto text-[10px] text-gray-400">
                    {formatRelevantDate(post)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
