'use client'

import { usePathname } from 'next/navigation'
import { useAppStore } from '@/store/use-app-store'
import { NotificationsDropdown } from '@/components/dashboard/NotificationsDropdown'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Inicio',
  '/clientes': 'Clientes',
  '/calendario': 'Calendario',
  '/metricas': 'Métricas',
  '/nueva-publicacion': 'Nueva publicación',
  '/configuracion': 'Configuración',
}

export function TopBar() {
  const pathname = usePathname()
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId)
  const clients = useAppStore((s) => s.clients)
  const userProfile = useAppStore((s) => s.userProfile)
  const activeClient = clients.find((c) => c.id === activeWorkspaceId) ?? clients[0] ?? null

  const title = pageTitles[pathname] ?? 'Inicio'

  const color = activeClient?.color ?? '#0095b6'
  const name = activeClient?.name ?? 'publi'

  return (
    <div>
      <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-gray-100/60 flex items-center justify-between px-6 sticky top-0 z-20">
        <span className="text-lg font-semibold text-gray-900 tracking-tight">{title}</span>

        <div className="flex items-center gap-3">
          <span
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border"
            style={{
              backgroundColor: color + '0a',
              color,
              borderColor: color + '18',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            {name}
          </span>

          <NotificationsDropdown />

          {userProfile?.avatarUrl ? (
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ring-2 ring-gray-100"
              style={{ backgroundColor: '#0095b6' }}
            >
              {userProfile?.initials ?? '…'}
            </div>
          )}
        </div>
      </header>
      {/* Subtle gradient accent line */}
      <div
        className="h-[4px]"
        style={{
          background: `linear-gradient(90deg, ${color}00 0%, ${color} 30%, ${color} 70%, ${color}00 100%)`,
        }}
      />
    </div>
  )
}
