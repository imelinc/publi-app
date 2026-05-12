"use client"

import { useState } from "react"
import {
  Pencil,
  CheckCircle2,
  CalendarClock,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
type Platform = "instagram" | "facebook" | "linkedin" | "tiktok" | "x"
type PostStatus = "programada" | "borrador" | "publicada" | "fallida"

interface DashboardPost {
  id: string
  client: string
  clientInitials: string
  platform: Platform
  caption: string
  status: PostStatus
  scheduledAt: string
}

const platformLabels: Record<Platform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  x: "X",
}

// ─── Platform icon map ────────────────────────────────────────────────────────

function PlatformIcon({ platform }: { platform: Platform }) {
  const shared = "h-4 w-4 shrink-0"
  switch (platform) {
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={shared} aria-hidden="true">
          <rect x="4.5" y="4.5" width="15" height="15" rx="4" stroke="#E1306C" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="3.5" stroke="#E1306C" strokeWidth="1.8" />
          <circle cx="16.4" cy="7.6" r="1" fill="#E1306C" />
        </svg>
      )
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" className={shared} aria-hidden="true">
          <path d="M13.2 20v-6h2.1l.4-2.4h-2.5V10c0-.7.2-1.2 1.3-1.2H16V6.6c-.3 0-1-.1-1.8-.1-1.8 0-3.1 1.1-3.1 3.3v1.8H9V14h2.1v6h2.1Z" fill="#1877F2" />
        </svg>
      )
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" className={shared} aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="3" fill="#0A66C2" />
          <circle cx="9" cy="9" r="1.3" fill="white" />
          <path d="M8 11h2v5H8zm3.2 0h1.9v.8h.1c.3-.5 1-.9 1.9-.9 2 0 2.4 1.3 2.4 3v3.1h-2v-2.7c0-.7 0-1.6-1-1.6s-1.1.8-1.1 1.5V17h-2V11Z" fill="white" />
        </svg>
      )
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" className={shared} aria-hidden="true">
          <path d="M13.7 4c.4 1.4 1.3 2.5 2.8 3.1.7.4 1.5.6 2.3.7v2.8a6.9 6.9 0 0 1-3.8-1.1v5.2a5 5 0 1 1-5-5c.3 0 .7 0 1 .1v2.9a2.3 2.3 0 1 0 1.7 2.2V4h3Z" fill="#111111" />
        </svg>
      )
    case "x":
      return (
        <svg viewBox="0 0 24 24" className={shared} aria-hidden="true">
          <path d="M6 4h4.3l4 5.2L18.7 4H20l-5 5.8L20.3 20H16l-4.2-5.6L7 20H5.7l5.4-6.2L6 4Zm2.3 1.6H7.4l8.4 12.8h.9L8.3 5.6Z" fill="#111111" />
        </svg>
      )
  }
}

// ─── Status pill config ───────────────────────────────────────────────────────

const statusStyles: Record<PostStatus, string> = {
  programada: "bg-primary-light text-primary",
  borrador: "bg-amber-50 text-amber-700",
  publicada: "bg-emerald-50 text-emerald-700",
  fallida: "bg-red-50 text-red-600",
}

const statusLabels: Record<PostStatus, string> = {
  programada: "Programada",
  borrador: "Borrador",
  publicada: "Publicada",
  fallida: "Fallida",
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PostCardProps {
  post: DashboardPost
  onEdit?: (id: string) => void
  onApprove?: (id: string) => void
  onReschedule?: (id: string) => void
  onDelete?: (id: string) => void
}

export function PostCard({
  post,
  onEdit,
  onApprove,
  onReschedule,
  onDelete,
}: PostCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-4 rounded-xl border bg-white p-4 transition-all lg:flex-row lg:items-start",
        post.status === "fallida"
          ? "border-red-200 hover:border-red-300"
          : "border-primary-light/60 hover:border-primary/40",
        "hover:shadow-[0_6px_24px_-8px_rgba(0,149,182,0.12)]"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Client avatar */}
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          post.status === "fallida"
            ? "bg-red-50 text-red-600"
            : "bg-primary-light text-primary"
        )}
      >
        {post.clientInitials}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{post.client}</p>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <PlatformIcon platform={post.platform} />
            {platformLabels[post.platform]}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {post.caption}
        </p>
      </div>

      {/* Meta + actions */}
      <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-end lg:justify-start">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              statusStyles[post.status]
            )}
          >
            {statusLabels[post.status]}
          </span>
          <span className="text-xs text-muted-foreground">
            {post.scheduledAt}
          </span>
        </div>

        {/* Quick actions — visible on hover */}
        <div
          className={cn(
            "flex items-center gap-1 transition-opacity",
            hovered ? "opacity-100" : "opacity-0 lg:pointer-events-none"
          )}
        >
          {onEdit && (
            <ActionButton
              title="Editar"
              onClick={() => onEdit(post.id)}
              icon={<Pencil className="h-3.5 w-3.5" />}
            />
          )}
          {onApprove && post.status === "borrador" && (
            <ActionButton
              title="Aprobar"
              onClick={() => onApprove(post.id)}
              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
              className="hover:text-emerald-600"
            />
          )}
          {onReschedule && (
            <ActionButton
              title="Reprogramar"
              onClick={() => onReschedule(post.id)}
              icon={<CalendarClock className="h-3.5 w-3.5" />}
              className="hover:text-amber-600"
            />
          )}
          {onDelete && (
            <ActionButton
              title="Eliminar"
              onClick={() => onDelete(post.id)}
              icon={<Trash2 className="h-3.5 w-3.5" />}
              className="hover:text-red-600"
            />
          )}
        </div>
      </div>
    </article>
  )
}

// ─── Small action button ──────────────────────────────────────────────────────

function ActionButton({
  title,
  onClick,
  icon,
  className,
}: {
  title: string
  onClick: () => void
  icon: React.ReactNode
  className?: string
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        "rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted",
        className
      )}
    >
      {icon}
    </button>
  )
}
