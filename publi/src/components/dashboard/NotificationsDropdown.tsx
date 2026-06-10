'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  CheckCheck,
  X,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/store/use-app-store'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Notification, NotificationType } from '@/types'

const POLL_INTERVAL_MS = 30_000

const typeConfig: Record<
  NotificationType,
  { icon: typeof CheckCircle2; colorClass: string }
> = {
  post_published: { icon: CheckCircle2, colorClass: 'text-emerald-500' },
  post_failed: { icon: XCircle, colorClass: 'text-red-500' },
  post_scheduled: { icon: Clock, colorClass: 'text-amber-500' },
}

export function NotificationsDropdown() {
  const notifications = useAppStore((s) => s.notifications)
  const unreadCount = useAppStore((s) => s.unreadCount)
  const fetchNotifications = useAppStore((s) => s.fetchNotifications)
  const markAllRead = useAppStore((s) => s.markAllRead)
  const deleteNotification = useAppStore((s) => s.deleteNotification)

  const [open, setOpen] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch inicial + polling.
  useEffect(() => {
    fetchNotifications()
    pollingRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [fetchNotifications])

  // Al abrir el dropdown, marcar como leídas.
  useEffect(() => {
    if (open && unreadCount > 0) {
      markAllRead()
    }
  }, [open, unreadCount, markAllRead])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          id="notifications-trigger"
          className="relative text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none animate-in zoom-in-50 fade-in duration-200">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0 max-h-[480px] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">
            Notificaciones
          </h3>
          {notifications.length > 0 && (
            <button
              onClick={() => markAllRead()}
              className="flex items-center gap-1 text-xs text-[#0095b6] hover:text-[#007a96] transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Marcar leídas
            </button>
          )}
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <EmptyState />
          ) : (
            notifications.map((notification, idx) => (
              <div key={notification.id}>
                <NotificationItem
                  notification={notification}
                  onDelete={deleteNotification}
                />
                {idx < notifications.length - 1 && (
                  <DropdownMenuSeparator className="my-0" />
                )}
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NotificationItem({
  notification,
  onDelete,
}: {
  notification: Notification
  onDelete: (id: string) => void
}) {
  const config = typeConfig[notification.type]
  const Icon = config.icon

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: es,
  })

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50/80',
        !notification.read && 'bg-[#0095b6]/[0.03]'
      )}
    >
      {/* Indicador de no leída */}
      {!notification.read && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#0095b6]" />
      )}

      {/* Ícono */}
      <div className={cn('mt-0.5 shrink-0', config.colorClass)}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 leading-tight">
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
          {notification.body}
        </p>
        <p className="text-[11px] text-gray-400 mt-1">{timeAgo}</p>
      </div>

      {/* Botón eliminar */}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDelete(notification.id)
        }}
        className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
        title="Eliminar notificación"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <Bell className="w-6 h-6 text-gray-300" />
      </div>
      <p className="text-sm font-medium text-gray-500">
        No tenés notificaciones
      </p>
      <p className="text-xs text-gray-400 mt-1">
        Te avisaremos cuando tus publicaciones se publiquen o fallen.
      </p>
    </div>
  )
}
