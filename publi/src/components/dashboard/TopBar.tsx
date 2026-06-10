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
      <header className="h-16 bg-white flex items-center justify-between px-6">
        <span className="text-lg font-semibold text-gray-900">{title}</span>

        <div className="flex items-center gap-3">
          <span
            className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors duration-300"
            style={{ backgroundColor: color + '18', color }}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            {name}
          </span>

          <NotificationsDropdown />

          {userProfile?.avatarUrl ? (
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
              style={{ backgroundColor: '#0095b6' }}
            >
              {userProfile?.initials ?? '…'}
            </div>
          )}
        </div>
      </header>
      <div
        className="h-[7px] transition-colors duration-500"
        style={{ backgroundColor: color }}
      />
    </div>
  )
}
