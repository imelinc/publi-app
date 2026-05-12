'use client'

import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { useAppStore } from '@/store/use-app-store'
import { WORKSPACES } from '@/lib/mock-data'

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
  const activeWorkspace = WORKSPACES.find((w) => w.id === activeWorkspaceId) ?? WORKSPACES[0]

  const title = pageTitles[pathname] ?? 'Inicio'

  return (
    <div>
      <header className="h-16 bg-white flex items-center justify-between px-6">
        {/* Left */}
        <span className="text-lg font-semibold text-gray-900">{title}</span>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Workspace badge */}
          <span
            className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors duration-300"
            style={{ backgroundColor: activeWorkspace.color + '18', color: activeWorkspace.color }}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: activeWorkspace.color }}
            />
            {activeWorkspace.name}
          </span>

          {/* Bell */}
          <button className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
            style={{ backgroundColor: '#0095b6' }}
          >
            NM
          </div>
        </div>
      </header>
      <div
        className="h-[7px] transition-colors duration-500"
        style={{ backgroundColor: activeWorkspace.color }}
      />
    </div>
  )
}
