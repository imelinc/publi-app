'use client'

import { useEffect, useState, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAppStore } from '@/store/use-app-store'
import { PostForm } from '@/components/dashboard/PostForm'
import { ApprovalLinkDialog } from '@/components/dashboard/ApprovalLinkDialog'
import { createClient } from '@/lib/supabase/client'
import type { Post } from '@/types'

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
  const [post, setPost] = useState<Post | null>(
    () => postsInStore.find((p) => p.id === postId) ?? null
  )
  const [loading, setLoading] = useState(!post)
  const [error, setError] = useState<string | null>(null)
  // El link de aprobación vive acá (no en PostForm) porque pedir aprobación
  // cambia el status → remonta el PostForm (key por status). Acá sobrevive.
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null)

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

  // No se puede editar si ya fue publicado o falló
  if (post.status === 'published' || post.status === 'failed') {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white border border-amber-100 rounded-xl p-6 text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">No editable</h2>
        <p className="text-sm text-gray-500 mb-4">
          Esta publicación ya no puede editarse (estado: {post.status}).
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

  // Key fuerza remount del PostForm cuando cambia el status del post.
  // Sin esto, al re-fetch obtener un nuevo estado (ej: pending → approved),
  // los estados internos del form quedarían desactualizados.
  // El ApprovalLinkDialog va FUERA del PostForm keyed para sobrevivir al remount.
  return (
    <>
      <PostForm
        key={`${post.id}-${post.status}`}
        mode="edit"
        initialPost={post}
        onApprovalGenerated={setApprovalUrl}
      />
      <ApprovalLinkDialog url={approvalUrl} onClose={() => setApprovalUrl(null)} />
    </>
  )
}
