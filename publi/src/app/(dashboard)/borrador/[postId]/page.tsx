'use client'

import { useEffect, useState, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  ArrowLeft,
  Calendar as CalendarIcon,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Smartphone,
  Image as ImageIcon,
} from 'lucide-react'
import { useAppStore } from '@/store/use-app-store'
import { PostForm } from '@/components/dashboard/PostForm'
import { PostPreview } from '@/components/dashboard/PostPreview'
import { createClient } from '@/lib/supabase/client'
import { NETWORK_META } from '@/lib/networks'
import type { Post, Network } from '@/types'

interface PageProps {
  params: Promise<{ postId: string }>
}

/**
 * Pantalla de edición de un borrador existente.
 * Siempre lee del API para tener el estado más reciente (importante para
 * detectar aprobaciones/rechazos del cliente que pasaron mientras tanto).
 * Si el store ya lo tiene, lo mostramos primero para no parpadear.
 */
export default function EditarBorradorPage({ params }: PageProps) {
  const { postId } = use(params)
  const router = useRouter()

  const postsInStore = useAppStore((s) => s.posts)
  const clients = useAppStore((s) => s.clients)
  const [post, setPost] = useState<Post | null>(
    () => postsInStore.find((p) => p.id === postId) ?? null
  )
  const [loading, setLoading] = useState(!post)
  const [error, setError] = useState<string | null>(null)
  const [activeNetwork, setActiveNetwork] = useState<Network | null>(null)

  // Inicializar red activa para el preview
  useEffect(() => {
    if (post && post.networks && post.networks.length > 0 && !activeNetwork) {
      setActiveNetwork(post.networks[0])
    }
  }, [post, activeNetwork])

  const loadPostFromApi = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch(`/api/posts/${postId}`)
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'No se pudo cargar el borrador')
      }
      const json = await res.json()
      setPost(json.data as Post)
      setError(null)
    } catch (err) {
      // Si la carga silenciosa falla, ignoramos (mantenemos lo que ya teníamos)
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [postId])

  // Carga inicial: aunque ya haya algo del store, traemos versión fresca del API
  useEffect(() => {
    loadPostFromApi(!!post)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  // Cuando la pestaña vuelve a tener foco, re-fetch para detectar cambios
  // del cliente (aprobación/rechazo) hechos mientras estabas en otra app.
  useEffect(() => {
    function onFocus() {
      if (document.visibilityState === 'visible') {
        loadPostFromApi(true)
      }
    }
    document.addEventListener('visibilitychange', onFocus)
    window.addEventListener('focus', onFocus)
    return () => {
      document.removeEventListener('visibilitychange', onFocus)
      window.removeEventListener('focus', onFocus)
    }
  }, [loadPostFromApi])

  // Supabase Realtime: actualización instantánea cuando el cliente
  // aprueba/rechaza desde el link público.
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`realtime-post-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: `id=eq.${postId}`,
        },
        () => {
          loadPostFromApi(true)
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId, loadPostFromApi])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white border border-red-100 rounded-xl p-6 text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">No se pudo cargar el borrador</h2>
        <p className="text-sm text-gray-500 mb-4">
          {error ?? 'El post no existe o no tenés acceso.'}
        </p>
        <button
          onClick={() => router.push('/calendario')}
          className="text-sm text-[#0095b6] hover:underline"
        >
          Volver al calendario
        </button>
      </div>
    )
  }

  // No se puede editar si ya fue publicado o falló -> Mostrar detalle de la publicación
  if (post.status === 'published' || post.status === 'failed') {
    const isStory = post.contentFormat === 'story'
    const formattedDate = post.publishedAt
      ? new Date(post.publishedAt).toLocaleDateString('es-AR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null

    const client = clients.find((c) => c.id === post.clientId) ?? null

    return (
      <div className="space-y-6 max-w-6xl mx-auto px-4 py-6">
        {/* Header con botón de volver */}
        <div className="flex items-center justify-between gap-4 border-b border-gray-150 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition cursor-pointer"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">
                  {post.title || 'Publicación sin título'}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    post.status === 'published'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {post.status === 'published' ? (
                    <CheckCircle2 className="size-3" />
                  ) : (
                    <AlertCircle className="size-3" />
                  )}
                  {post.status === 'published' ? 'Publicada' : 'Falló al publicar'}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    isStory
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}
                >
                  {isStory ? <Smartphone className="size-3" /> : <ImageIcon className="size-3" />}
                  {isStory ? 'Story' : 'Feed'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <CalendarIcon className="size-3.5" />
                {formattedDate
                  ? `Publicado el ${formattedDate}`
                  : `Creado el ${new Date(post.createdAt).toLocaleDateString('es-AR')}`}
              </p>
            </div>
          </div>
        </div>

        {/* Dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Detalles e Historial */}
          <div className="lg:col-span-7 space-y-6">
            {/* Copy / Contenido */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-50 pb-2">
                Contenido
              </h3>
              <div className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                {post.description}
              </div>
              {post.hashtags && post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {post.hashtags.map((h, i) => (
                    <span
                      key={i}
                      className="text-xs text-[#0095b6] bg-[#cceef5]/40 px-2 py-0.5 rounded"
                    >
                      {h.startsWith('#') ? h : `#${h}`}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Redes y Estados de publicación por Red */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-50 pb-2">
                Estado de publicación por red
              </h3>
              <div className="divide-y divide-gray-50">
                {post.publications?.map((pub) => {
                  const meta = NETWORK_META[pub.network]
                  return (
                    <div
                      key={pub.id}
                      className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={meta.iconColor} alt={meta.label} width={20} height={20} />
                        <span className="text-sm font-medium text-gray-700">{meta.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {pub.status === 'published' || pub.status === 'simulated' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                            <CheckCircle2 className="size-3" />
                            {pub.status === 'simulated' ? 'Simulada (Demo)' : 'Publicado'}
                          </span>
                        ) : pub.status === 'failed' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                            <AlertCircle className="size-3" />
                            Falló
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
                            Pendiente
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Errores (si hay alguno) */}
            {post.status === 'failed' && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-5 space-y-2 text-red-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="size-5 text-red-650" />
                  <h3 className="text-sm font-semibold">Detalle del error</h3>
                </div>
                <p className="text-xs font-mono leading-relaxed bg-white/60 p-3 rounded border border-red-100 overflow-x-auto">
                  {post.publications?.find((p) => p.status === 'failed')?.errorMessage ||
                    'Error desconocido al intentar publicar en las redes seleccionadas.'}
                </p>
              </div>
            )}

            {/* Métricas / Engagement si está publicado y no es una Story */}
            {post.status === 'published' && !isStory && (
              <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
                  <BarChart3 className="size-4.5 text-[#0095b6]" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    Métricas de rendimiento
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Likes */}
                  <div className="bg-gray-550 rounded-lg p-3 text-center bg-gray-50">
                    <p className="text-xs text-gray-500 font-medium">Likes</p>
                    <p className="text-lg font-bold text-gray-950 mt-1">
                      {post.publications?.reduce((acc, curr) => acc + (curr.engagement?.likes ?? 0), 0) ?? 0}
                    </p>
                  </div>
                  {/* Comentarios */}
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-550 font-medium">Comentarios</p>
                    <p className="text-lg font-bold text-gray-950 mt-1">
                      {post.publications?.reduce((acc, curr) => acc + (curr.engagement?.comments ?? 0), 0) ?? 0}
                    </p>
                  </div>
                  {/* Impresiones / Vistas */}
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 font-medium">Visualizaciones</p>
                    <p className="text-lg font-bold text-gray-950 mt-1">
                      {post.publications?.reduce((acc, curr) => acc + (curr.engagement?.views ?? 0), 0) ?? 0}
                    </p>
                  </div>
                  {/* Alcance */}
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 font-medium">Alcance</p>
                    <p className="text-lg font-bold text-gray-950 mt-1">
                      {post.publications?.reduce((acc, curr) => acc + (curr.engagement?.reach ?? 0), 0) ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Vista Previa Visual Mockup */}
          <div className="lg:col-span-5">
            <div className="sticky top-6">
              <PostPreview
                description={
                  (activeNetwork && post.publications?.find((p) => p.network === activeNetwork)?.description) ||
                  post.description
                }
                mediaUrls={post.mediaUrls}
                client={client}
                networks={post.networks}
                activeNetwork={activeNetwork}
                contentFormat={post.contentFormat}
                onNetworkSelect={setActiveNetwork}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Usamos el id como key para mantener la misma instancia de PostForm durante la edición.
  // Los cambios de estado (ej: pending_approval) se sincronizan internamente mediante useEffect
  // sin destruir el componente (lo cual cerraría diálogos activos como el de copiar link).
  return <PostForm key={post.id} mode="edit" initialPost={post} />
}
