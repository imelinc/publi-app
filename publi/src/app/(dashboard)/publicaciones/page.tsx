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
  Search,
  SlidersHorizontal,
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
    return { label: 'Programada', icon: CalendarIcon, cls: 'bg-blue-50 text-blue-600 border-blue-100' }
  }
  if (post.status === 'published') {
    return { label: 'Publicada', icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' }
  }
  if (post.status === 'failed') {
    return { label: 'Falló al publicar', icon: AlertCircle, cls: 'bg-red-50 text-red-600 border-red-100' }
  }
  // draft, pending_approval, approved → todos son "borradores" desde la UX del CM
  return { label: 'Borrador', icon: FileText, cls: 'bg-gray-50 text-gray-600 border-gray-100' }
}

/**
 * Devuelve el badge de estado de aprobación, siempre visible para que el CM
 * sepa de un vistazo si está esperando feedback del cliente.
 */
function getApprovalBadge(post: Post) {
  if (post.status === 'pending_approval') {
    return { label: 'Esperando aprobación', icon: Clock4, cls: 'bg-amber-50 text-amber-600 border-amber-100' }
  }
  if (post.status === 'draft' && post.clientFeedback) {
    return { label: 'Rechazada por cliente', icon: AlertCircle, cls: 'bg-red-50 text-red-600 border-red-100' }
  }
  // Si pasó por aprobación y fue aceptada (status 'approved' o tiene approvedAt)
  if (post.status === 'approved' || post.approvedAt) {
    return { label: 'Aprobada por cliente', icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' }
  }
  // Borradores que nunca se enviaron a aprobar / publicados directos
  return { label: 'Sin pedir aprobación', icon: Send, cls: 'bg-gray-50 text-gray-400 border-gray-100' }
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

  const tabs: { key: StatusFilter; label: string; count: number; icon: typeof FileText }[] = [
    { key: 'all', label: 'Todas', count: counts.all, icon: SlidersHorizontal },
    { key: 'drafts', label: 'Borradores', count: counts.drafts, icon: FileText },
    { key: 'scheduled', label: 'Programadas', count: counts.scheduled, icon: CalendarIcon },
    { key: 'published', label: 'Publicadas', count: counts.published, icon: CheckCircle2 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            <span className="gradient-text">Publicaciones</span>
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Revisá todas las publicaciones de tus clientes y su estado de aprobación.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="h-10 rounded-xl border border-gray-200 bg-white pl-3 pr-8 text-sm text-gray-700 outline-none appearance-none hover:border-gray-300 transition-colors cursor-pointer"
            >
              <option value="all">Todos los clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value as 'all' | 'feed' | 'story')}
            className="h-10 rounded-xl border border-gray-200 bg-white pl-3 pr-8 text-sm text-gray-700 outline-none appearance-none hover:border-gray-300 transition-colors cursor-pointer"
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
            className="h-10 rounded-xl border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando…' : 'Actualizar'}
          </Button>
        </div>
      </div>

      {/* Premium tabs */}
      <div className="premium-card p-1.5 flex gap-1">
        {tabs.map((t) => {
          const active = statusFilter === t.key
          const TabIcon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setStatusFilter(t.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer',
                active
                  ? 'bg-primary text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
              style={
                active
                  ? { boxShadow: '0 2px 8px rgba(0, 149, 182, 0.3)' }
                  : undefined
              }
            >
              <TabIcon className="w-3.5 h-3.5" />
              {t.label}
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-semibold transition-colors',
                  active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                )}
              >
                {t.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Publication cards */}
      {filteredPosts.length === 0 ? (
        <div className="premium-card text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-gray-600 font-medium">No hay publicaciones en este filtro</p>
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
                className="premium-card p-0 overflow-hidden cursor-pointer group"
              >
                {/* Top color accent */}
                <div
                  className="h-1 opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ backgroundColor: post.clientColor }}
                />

                <div className="p-4 flex flex-col gap-3">
                  {/* Header: cliente + redes */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        style={{
                          backgroundColor: post.clientColor,
                          boxShadow: `0 2px 8px ${post.clientColor}30`,
                        }}
                      >
                        {post.clientName.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-gray-700 truncate">
                        {post.clientName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {post.networks.slice(0, 3).map((n) => {
                        const meta = NETWORK_META[n]
                        return (
                          <div
                            key={n}
                            className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center"
                          >
                            <img
                              src={meta.iconColor}
                              alt={meta.label}
                              width={14}
                              height={14}
                            />
                          </div>
                        )
                      })}
                      {post.networks.length > 3 && (
                        <span className="text-[10px] text-gray-400 ml-0.5">
                          +{post.networks.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body: image + content */}
                  <div className="flex gap-3">
                    {thumb ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={thumb}
                        alt=""
                        className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-100 group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                        <ImageIcon className="size-5 text-gray-200" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors duration-200">
                        {post.title || 'Sin título'}
                      </p>
                      <p className="text-xs text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {post.description || 'Sin descripción'}
                      </p>
                    </div>
                  </div>

                  {/* Feedback de cliente (si fue rechazada) */}
                  {post.status === 'draft' && post.clientFeedback && (
                    <p className="text-[11px] italic text-red-500 line-clamp-2 px-3 py-2 bg-red-50 rounded-lg border border-red-100">
                      &ldquo;{post.clientFeedback}&rdquo;
                    </p>
                  )}

                  {/* Footer: badges + fecha */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-3 border-t border-gray-50">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg border',
                        statusBadge.cls
                      )}
                    >
                      <StatusIcon className="size-3" />
                      {statusBadge.label}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg border',
                        approvalBadge.cls
                      )}
                    >
                      <ApprovalIcon className="size-3" />
                      {approvalBadge.label}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg border',
                        post.contentFormat === 'story'
                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                          : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                      )}
                    >
                      {post.contentFormat === 'story' ? (
                        <Smartphone className="size-3" />
                      ) : (
                        <ImageIcon className="size-3" />
                      )}
                      {post.contentFormat === 'story' ? 'Story' : 'Feed'}
                    </span>
                    <span className="ml-auto text-[10px] text-gray-400 font-medium">
                      {formatRelevantDate(post)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
