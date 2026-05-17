"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store/use-app-store"
import type { Post } from "@/types"

const NETWORK_ICON_MAP: Record<string, string> = {
  instagram: "/icons/instagram.svg",
}

interface DraftPanelProps {
  posts: Post[]
}

export function DraftPanel({ posts }: DraftPanelProps) {
  const [activeTab, setActiveTab] = useState<"drafts" | "scheduled">("drafts")
  const deletePost = useAppStore((s) => s.deletePost)
  const router = useRouter()

  const draftPosts = posts.filter((p) => p.status === "draft")
  const scheduledPosts = posts.filter((p) => p.status === "scheduled")

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
            const iconPath =
              NETWORK_ICON_MAP[post.networks[0]] ??
              `/icons/${post.networks[0]}.svg`

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
                <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">
                  {post.description}
                </p>

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => router.push("/nueva-publicacion")}
                    className="border border-gray-200 text-gray-600 text-xs rounded px-2 py-1 hover:bg-gray-100 transition"
                  >
                    Editar
                  </button>
                  {post.status === "scheduled" && (
                    <button
                      onClick={() => deletePost(post.id)}
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
    </div>
  )
}
