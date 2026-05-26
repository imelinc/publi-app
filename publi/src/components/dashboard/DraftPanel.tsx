"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store/use-app-store"
import type { Post, Network } from "@/types"
import { NETWORK_META } from "@/lib/networks"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"

interface DraftPanelProps {
  posts: Post[]
}

export function DraftPanel({ posts }: DraftPanelProps) {
  const [activeTab, setActiveTab] = useState<"drafts" | "scheduled">("drafts")
  const [postToCancel, setPostToCancel] = useState<Post | null>(null)
  const deletePost = useAppStore((s) => s.deletePost)
  const { toast } = useToast()
  const router = useRouter()

  async function confirmCancelScheduled() {
    if (!postToCancel) return
    try {
      await deletePost(postToCancel.id)
      toast({ title: "Publicación cancelada" })
    } catch (err) {
      toast({
        title: "No se pudo cancelar",
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setPostToCancel(null)
    }
  }

  // Borradores incluyen los pendientes de aprobación (siguen sin publicarse).
  // Los rechazados vuelven a 'draft' con `clientFeedback`, ya entran acá.
  const draftPosts = posts.filter(
    (p) => p.status === "draft" || p.status === "pending_approval"
  )
  const scheduledPosts = posts.filter((p) => p.status === "scheduled")

  // Devuelve el badge a mostrar para cada borrador según su estado de aprobación.
  function approvalBadge(post: Post) {
    if (post.status === "pending_approval") {
      return { label: "Pendiente aprobación", cls: "bg-amber-50 text-amber-700" }
    }
    if (post.status === "draft" && post.clientFeedback) {
      return { label: "Rechazado por cliente", cls: "bg-red-50 text-red-600" }
    }
    return null
  }

  const displayedPosts = activeTab === "drafts" ? draftPosts : scheduledPosts

  return (
    <div className="bg-white rounded-xl border border-gray-100 h-full flex flex-col overflow-hidden w-72 flex-shrink-0">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Publicaciones</h3>
      </div>

      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab("drafts")}
          className={`flex-1 py-2.5 text-sm text-center transition ${
            activeTab === "drafts"
              ? "border-b-2 border-[#0095b6] text-[#0095b6] font-medium"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Borradores ({draftPosts.length})
        </button>
        <button
          onClick={() => setActiveTab("scheduled")}
          className={`flex-1 py-2.5 text-sm text-center transition ${
            activeTab === "scheduled"
              ? "border-b-2 border-[#0095b6] text-[#0095b6] font-medium"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Programadas ({scheduledPosts.length})
        </button>
      </div>

      <div className="overflow-y-auto flex-1 p-3 space-y-2">
        {displayedPosts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No hay publicaciones
          </p>
        ) : (
          displayedPosts.map((post) => {
            const firstNetwork = post.networks[0] as Network | undefined
            const iconPath = firstNetwork ? NETWORK_META[firstNetwork].icon : ""
            const badge = approvalBadge(post)

            return (
              <div key={post.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div className="flex gap-2 items-center">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: post.clientColor }}
                    >
                      {post.clientName.slice(0, 2).toUpperCase()}
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={iconPath}
                      alt=""
                      width={14}
                      height={14}
                      className="shrink-0"
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {post.scheduledAt
                      ? new Date(post.scheduledAt).toLocaleDateString(
                          "es-AR",
                          { day: "numeric", month: "short" }
                        )
                      : "Borrador"}
                  </span>
                </div>

                <p className="text-sm font-medium text-gray-900 mt-1 line-clamp-1">
                  {post.title}
                </p>
                {badge && (
                  <span
                    className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                )}
                <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">
                  {post.description}
                </p>
                {post.status === "draft" && post.clientFeedback && (
                  <p className="text-[11px] text-red-500 italic mt-1 line-clamp-2">
                    “{post.clientFeedback}”
                  </p>
                )}

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => router.push(`/borrador/${post.id}`)}
                    className="border border-gray-200 text-gray-600 text-xs rounded px-2 py-1 hover:bg-gray-100 transition"
                  >
                    Editar
                  </button>
                  {post.status === "scheduled" && (
                    <button
                      onClick={() => setPostToCancel(post)}
                      className="text-red-400 text-xs hover:text-red-600 transition"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <AlertDialog
        open={!!postToCancel}
        onOpenChange={(open) => !open && setPostToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar publicación programada?</AlertDialogTitle>
            <AlertDialogDescription>
              {postToCancel ? (
                <>
                  Se va a eliminar “{postToCancel.title}” y no se va a publicar en{' '}
                  {postToCancel.scheduledAt
                    ? new Date(postToCancel.scheduledAt).toLocaleString('es-AR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'la fecha programada'}
                  . Esta acción no se puede deshacer.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelScheduled}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Sí, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
