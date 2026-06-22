'use client'

import { useState, useEffect, use } from 'react'
import { CheckCircle2, AlertCircle, Clock, Loader2, Send, Check, MessageSquare, Calendar } from 'lucide-react'
import { PostPreview } from '@/components/dashboard/PostPreview'
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
  const [activePreviewNetwork, setActivePreviewNetwork] = useState<Network | null>(null)

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
          if (json.data.networks && json.data.networks.length > 0) {
            setActivePreviewNetwork(json.data.networks[0])
          }
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
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-gray-550">
          <div className="relative flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-100 border-t-[#0095b6]"></div>
          </div>
          <p className="text-sm font-medium animate-pulse">Cargando publicación…</p>
        </div>
      </Shell>
    )
  }

  if (state.status === 'invalid') {
    return (
      <Shell>
        <div className="p-8 sm:p-12 flex flex-col items-center text-center max-w-md mx-auto">
          <div className="size-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 ring-8 ring-rose-50 mb-6 animate-pulse">
            <AlertCircle className="size-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Enlace inválido o expirado
          </h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Este link de aprobación no existe o ha sido desactivado. Por favor, solicitá un link nuevo al CM.
          </p>
        </div>
      </Shell>
    )
  }

  if (state.status === 'already_processed') {
    const label: Record<string, string> = {
      approved: 'Aprobada ✅',
      draft: 'Devuelta para cambios ✍️',
      scheduled: 'Programada para publicación 🗓',
      published: 'Publicada en redes 🚀',
    }
    const isApproved = state.postStatus === 'approved' || state.postStatus === 'scheduled' || state.postStatus === 'published'
    return (
      <Shell>
        <div className="p-8 sm:p-12 flex flex-col items-center text-center max-w-md mx-auto">
          <div className={`size-16 rounded-full flex items-center justify-center ring-8 mb-6 ${
            isApproved 
              ? 'bg-emerald-100 text-emerald-600 ring-emerald-50' 
              : 'bg-amber-100 text-amber-600 ring-amber-50'
          }`}>
            {isApproved ? (
              <CheckCircle2 className="size-8" />
            ) : (
              <AlertCircle className="size-8" />
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Publicación ya procesada
          </h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Esta publicación ya ha sido respondida previamente.
          </p>
          <div className="mt-4 px-4 py-2 bg-gray-50 border border-gray-150 rounded-xl text-xs font-bold text-gray-700">
            Estado actual: {label[state.postStatus] ?? state.postStatus}
          </div>
        </div>
      </Shell>
    )
  }

  if (state.status === 'approved') {
    return (
      <Shell>
        <div className="p-8 sm:p-12 flex flex-col items-center text-center max-w-md mx-auto">
          <div className="size-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 ring-8 ring-emerald-50 mb-6 animate-bounce">
            <CheckCircle2 className="size-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            ¡Publicación Aprobada!
          </h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            ¡Muchas gracias! Ya notificamos al equipo. Nos encargaremos de programar y publicar el contenido en las fechas indicadas.
          </p>
        </div>
      </Shell>
    )
  }

  if (state.status === 'rejected') {
    return (
      <Shell>
        <div className="p-8 sm:p-12 flex flex-col items-center text-center max-w-md mx-auto">
          <div className="size-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 ring-8 ring-rose-50 mb-6">
            <Send className="size-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Feedback enviado al equipo
          </h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Gracias por tus sugerencias. El equipo revisará tus comentarios para ajustar el contenido y te enviaremos una versión corregida para tu revisión.
          </p>
        </div>
      </Shell>
    )
  }

  if (state.status === 'error') {
    return (
      <Shell>
        <div className="p-8 sm:p-12 flex flex-col items-center text-center max-w-md mx-auto">
          <div className="size-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 ring-8 ring-red-50 mb-6">
            <AlertCircle className="size-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Ocurrió un error
          </h2>
          <p className="text-sm text-red-600 mt-1 leading-relaxed">
            {state.message}
          </p>
          {currentPost && (
            <button
              onClick={() => setState({ status: 'ready', post: currentPost })}
              className="mt-6 text-sm font-semibold text-[#0095b6] hover:underline"
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

  // Construir mockClient para PostPreview
  const mockClient = {
    id: post.id,
    name: post.clientName,
    color: post.clientColor,
    initials: post.clientName
      ? post.clientName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
      : 'CL',
    connectedNetworks: post.networks,
  } as any

  return (
    <Shell>
      <div className="p-6 sm:p-8 md:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Post Preview */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center lg:sticky lg:top-6">
            <PostPreview
              description={post.description}
              mediaUrls={post.mediaUrls}
              client={mockClient}
              networks={post.networks}
              activeNetwork={activePreviewNetwork}
              contentFormat="feed"
              onNetworkSelect={(net) => setActivePreviewNetwork(net)}
            />
          </div>

          {/* Right Column: Meta details, feedback, & actions */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="size-5 rounded-full ring-2 ring-white shadow-xs flex-shrink-0"
                  style={{ backgroundColor: post.clientColor }}
                />
                <span className="text-sm font-bold text-gray-800">{post.clientName}</span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1">
                  <Clock className="size-3" />
                  Pendiente de revisión
                </span>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                Revisá tu publicación
              </h2>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                Examiná el diseño y el texto de la publicación para cada red social. Si estás de acuerdo, aprobala para programar su publicación; si necesitás cambios, déjanos tu comentario.
              </p>
            </div>

            {/* Details Box */}
            <div className="bg-[#f5f0e8]/40 border border-[#cceef5]/40 rounded-2xl p-4 space-y-3.5 shadow-inner">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">Redes Seleccionadas</span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {post.networks.map((network) => (
                    <span key={network} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white border border-gray-150 text-gray-700 shadow-2xs">
                      <span className="size-1.5 rounded-full" style={{ backgroundColor: NETWORK_META[network]?.color ?? '#999' }} />
                      {NETWORK_META[network]?.label ?? network}
                    </span>
                  ))}
                </div>
              </div>
              
              {post.scheduledAt && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">Fecha Programada</span>
                  <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-[#0095b6]" />
                    {formatDate(post.scheduledAt)}
                  </span>
                </div>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* Comments section */}
            <div className="space-y-2">
              <label htmlFor="feedback-input" className="block text-sm font-bold text-gray-700 flex items-center gap-1.5">
                <MessageSquare className="size-4 text-[#0095b6]" />
                Comentario o sugerencia (opcional)
              </label>
              <textarea
                id="feedback-input"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="¿Tenés alguna sugerencia, corrección o comentario? Escribilo acá para que el equipo pueda ajustarlo..."
                rows={4}
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-xs resize-none focus:outline-none focus:ring-2 focus:ring-[#0095b6] focus:border-transparent transition-all duration-300 disabled:opacity-50"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={() => handleDecision(true)}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 bg-[#0095b6] hover:bg-[#007a94] active:scale-[0.99] disabled:opacity-50 text-white font-bold rounded-2xl py-3.5 px-4 text-sm transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4.5 animate-spin" />
                ) : (
                  <Check className="size-4.5" />
                )}
                Aprobar Publicación
              </button>
              
              <button
                onClick={() => handleDecision(false)}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-red-600 bg-white hover:bg-red-50/50 active:scale-[0.99] disabled:opacity-50 font-semibold rounded-2xl py-3.5 px-4 text-sm transition-all shadow-2xs hover:shadow-xs cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4.5 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Solicitar Cambios
              </button>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}

// ─── Layout shell (logo + tarjeta centrada) ───────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f0e8] relative overflow-hidden flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Mesh decorative blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#cceef5]/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#ffb703]/10 blur-[120px] pointer-events-none" />
      
      {/* Brand Header */}
      <div className="relative z-10 mb-8 flex flex-col items-center">
        <span className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-1.5">
          <span className="text-[#0095b6]">publi</span>
          <span className="text-xs bg-[#cceef5] text-[#0095b6] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wide">
            Portal
          </span>
        </span>
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-4xl bg-white/80 backdrop-blur-md rounded-3xl border border-[#cceef5]/60 shadow-xl overflow-hidden transition-all duration-300">
        {children}
      </div>
    </div>
  )
}
