'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, ImageOff, Loader2 } from 'lucide-react'
import { NETWORK_META } from '@/lib/networks'
import type { Network } from '@/types'

interface PostPreviewData {
  id: string
  description: string
  networks: Network[]
  hashtags: string[]
  mediaUrls: string[]
  scheduledAt: string | null
  clientName: string
  clientColor: string
}

type PageState =
  | { status: 'loading' }
  | { status: 'ready'; post: PostPreviewData }
  | { status: 'already_processed'; postStatus: string }
  | { status: 'invalid' }
  | { status: 'submitting' }
  | { status: 'approved' }
  | { status: 'rejected' }
  | { status: 'error'; message: string }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ApprovalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const [token, setToken] = useState<string | null>(null)
  const [state, setState] = useState<PageState>({ status: 'loading' })
  const [currentPost, setCurrentPost] = useState<PostPreviewData | null>(null)
  const [feedback, setFeedback] = useState('')

  // Resolver params (Next.js 15 los hace async)
  useEffect(() => {
    params.then(({ token: t }) => setToken(t))
  }, [params])

  // Cargar datos del post cuando tengamos el token
  useEffect(() => {
    if (!token) return
    fetch(`/api/approve/${token}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error && json.status) {
          setState({ status: 'already_processed', postStatus: json.status })
        } else if (json.error) {
          setState({ status: 'invalid' })
        } else {
          setCurrentPost(json.data)
          setState({ status: 'ready', post: json.data })
        }
      })
      .catch(() => setState({ status: 'invalid' }))
  }, [token])

  async function handleDecision(approved: boolean) {
    if (!token || state.status !== 'ready') return
    setState({ status: 'submitting' })
    try {
      const res = await fetch(`/api/approve/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, feedback: feedback.trim() || undefined }),
      })
      const json = await res.json()
      if (!res.ok) {
        setState({ status: 'error', message: json.error ?? 'Error inesperado' })
      } else {
        setState({ status: approved ? 'approved' : 'rejected' })
      }
    } catch {
      setState({ status: 'error', message: 'No se pudo conectar. Intentá de nuevo.' })
    }
  }

  // ─── Estados de carga / resultado ────────────────────────────────────────────

  if (state.status === 'loading') {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 py-16 text-gray-500">
          <Loader2 className="size-8 animate-spin" />
          <p>Cargando publicación…</p>
        </div>
      </Shell>
    )
  }

  if (state.status === 'invalid') {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 py-16 text-gray-500">
          <XCircle className="size-10 text-red-400" />
          <p className="font-medium text-gray-700">Link inválido o expirado</p>
          <p className="text-sm text-center">
            Este link de aprobación no existe o ya no está activo.
            <br />
            Pedile al CM que te reenvíe un link nuevo.
          </p>
        </div>
      </Shell>
    )
  }

  if (state.status === 'already_processed') {
    const label: Record<string, string> = {
      approved: 'Aprobado ✅',
      draft: 'Enviado de vuelta para revisión',
      scheduled: 'Programado 🗓',
      published: 'Publicado 🚀',
    }
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 py-16 text-gray-500">
          <CheckCircle className="size-10 text-green-400" />
          <p className="font-medium text-gray-700">Este post ya fue procesado</p>
          <p className="text-sm">Estado actual: {label[state.postStatus] ?? state.postStatus}</p>
        </div>
      </Shell>
    )
  }

  if (state.status === 'approved') {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="size-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="size-9 text-green-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">¡Post aprobado!</h2>
          <p className="text-gray-500 text-center text-sm max-w-xs">
            Gracias. El equipo ya fue notificado y se encargará de programar la publicación.
          </p>
        </div>
      </Shell>
    )
  }

  if (state.status === 'rejected') {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="size-16 rounded-full bg-orange-100 flex items-center justify-center">
            <XCircle className="size-9 text-orange-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Feedback enviado</h2>
          <p className="text-gray-500 text-center text-sm max-w-xs">
            Gracias por tu respuesta. El equipo revisará tus comentarios y te enviará una versión actualizada.
          </p>
        </div>
      </Shell>
    )
  }

  if (state.status === 'error') {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 py-16 text-gray-500">
          <XCircle className="size-10 text-red-400" />
          <p className="font-medium text-gray-700">Ocurrió un error</p>
          <p className="text-sm">{state.message}</p>
          {currentPost && (
            <button
              onClick={() => setState({ status: 'ready', post: currentPost })}
              className="mt-2 text-sm text-[#0095b6] underline"
            >
              Volver a intentar
            </button>
          )}
        </div>
      </Shell>
    )
  }

  // ─── Vista principal: preview del post ───────────────────────────────────────

  const post = state.status === 'ready' || state.status === 'submitting'
    ? (state.status === 'ready' ? state.post : currentPost)
    : null

  if (!post) return null

  const isSubmitting = state.status === 'submitting'

  return (
    <Shell>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="size-5 rounded-full"
            style={{ backgroundColor: post.clientColor }}
          />
          <span className="text-sm font-medium text-gray-500">{post.clientName}</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-800">
          Revisá esta publicación
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Aprobala o enviá tu feedback al equipo.
        </p>
      </div>

      {/* Redes a las que va */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(post.networks as Network[]).map((network: Network) => (
          <span
            key={network}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: NETWORK_META[network]?.color ?? '#999' }}
            />
            {NETWORK_META[network]?.label ?? network}
          </span>
        ))}
      </div>

      {/* Imagen */}
      {post.mediaUrls && post.mediaUrls.length > 0 ? (
        <div className="rounded-xl overflow-hidden mb-5 bg-gray-100 aspect-square w-full max-w-sm mx-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.mediaUrls[0]}
            alt="Imagen de la publicación"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="rounded-xl bg-gray-50 border border-dashed border-gray-200 aspect-square w-full max-w-sm mx-auto flex flex-col items-center justify-center gap-2 mb-5 text-gray-400">
          <ImageOff className="size-8" />
          <span className="text-sm">Sin imagen</span>
        </div>
      )}

      {/* Descripción */}
      <div className="bg-gray-50 rounded-xl p-4 mb-5">
        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
          {post.description}
        </p>
        {post.hashtags && post.hashtags.length > 0 && (
          <p className="mt-3 text-sm text-[#0095b6] font-medium">
            {(post.hashtags as string[]).map((h: string) => `#${h.replace(/^#/, '')}`).join(' ')}
          </p>
        )}
      </div>

      {/* Fecha programada */}
      {post.scheduledAt && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Clock className="size-4" />
          <span>Programada para el {formatDate(post.scheduledAt)}</span>
        </div>
      )}

      {/* Separador */}
      <hr className="border-gray-100 mb-6" />

      {/* Feedback */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comentario (opcional)
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="¿Tenés alguna sugerencia o corrección? Podés escribirla acá…"
          rows={3}
          disabled={isSubmitting}
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0095b6] focus:border-transparent disabled:opacity-50"
        />
      </div>

      {/* Botones */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => handleDecision(true)}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-medium rounded-xl py-3 text-sm transition-colors"
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCircle className="size-4" />
          )}
          Aprobar publicación
        </button>
        <button
          onClick={() => handleDecision(false)}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 font-medium rounded-xl py-3 text-sm transition-colors"
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <XCircle className="size-4" />
          )}
          Pedir cambios
        </button>
      </div>

      {/* Nota al pie */}
      <p className="text-xs text-gray-400 text-center mt-6">
        Este link es exclusivo para vos. No necesitás crear una cuenta.
      </p>
    </Shell>
  )
}

// ─── Layout shell (logo + tarjeta centrada) ───────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-start py-10 px-4">
      {/* Logo */}
      <div className="mb-8">
        <span className="text-2xl font-bold text-[#0095b6]">publi</span>
      </div>

      {/* Tarjeta */}
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        {children}
      </div>
    </div>
  )
}
