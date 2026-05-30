'use client'

import { useState, useEffect, useRef } from 'react'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart2,
  Sparkles,
  Settings,
  Plus,
  ChevronDown,
  LogOut,
  Check,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/use-app-store'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const navItems = [
  { label: 'Inicio', href: '/dashboard', Icon: LayoutDashboard },
  { label: 'Clientes', href: '/clientes', Icon: Users },
  { label: 'Publicaciones', href: '/publicaciones', Icon: FileText },
  { label: 'Calendario', href: '/calendario', Icon: Calendar },
  { label: 'Métricas', href: '/metricas', Icon: BarChart2 },
  { label: 'Copi IA', href: '/ai', Icon: Sparkles },
]

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId)
  const setActiveWorkspace = useAppStore((s) => s.setActiveWorkspace)
  const clients = useAppStore((s) => s.clients)
  const hasUnsavedChanges = useAppStore((s) => s.hasUnsavedChanges)
  const setHasUnsavedChanges = useAppStore((s) => s.setHasUnsavedChanges)
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  function safeNavigate(href: string) {
    if (hasUnsavedChanges && href !== pathname) {
      setPendingHref(href)
    } else {
      router.push(href)
    }
  }

  function confirmDiscardAndNavigate() {
    if (!pendingHref) return
    setHasUnsavedChanges(false)
    const href = pendingHref
    setPendingHref(null)
    router.push(href)
  }

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const userProfile = useAppStore((s) => s.userProfile)
  const activeClient = clients.find((c) => c.id === activeWorkspaceId) ?? clients[0] ?? null

  useEffect(() => {
    if (clients.length > 0 && !activeWorkspaceId) {
      setActiveWorkspace(clients[0].id)
    }
  }, [clients, activeWorkspaceId, setActiveWorkspace])

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [dropdownOpen])

  return (
    <aside className="fixed left-0 top-0 w-[280px] h-screen bg-white border-r border-gray-100 flex flex-col z-30">
      {/* ZONA TOP */}
      <div className="px-5 pt-6 pb-4">
        <span className="font-bold text-xl" style={{ color: '#0095b6' }}>
          publi
        </span>

        {/* Workspace selector */}
        <div className="relative mt-4" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {activeClient ? (
              <>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"
                  style={{
                    backgroundColor: activeClient.color,
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {activeClient.initials}
                </div>
                <span className="flex-1 text-sm font-medium text-gray-900 text-left truncate">
                  {activeClient.name}
                </span>
              </>
            ) : (
              <span className="flex-1 text-sm text-gray-400 text-left">Sin clientes</span>
            )}
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
          </button>

          {dropdownOpen && clients.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-50 py-1">
              {clients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveWorkspace(c.id)
                    setDropdownOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0"
                    style={{
                      backgroundColor: c.color,
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    {c.initials}
                  </div>
                  <span className="flex-1 text-sm text-gray-800 text-left truncate">
                    {c.name}
                  </span>
                  {c.id === activeWorkspaceId && (
                    <Check className="w-4 h-4 shrink-0" style={{ color: '#0095b6' }} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ZONA MIDDLE */}
      <div className="flex-1 px-4 pb-4 flex flex-col overflow-y-auto">
        <button
          onClick={() => safeNavigate('/nueva-publicacion')}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-white text-sm font-medium mb-3 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#0095b6' }}
        >
          <Plus className="w-4 h-4" />
          Nueva Publicación
        </button>

        <nav className="flex flex-col gap-0.5">
          {navItems.map(({ label, href, Icon }) => {
            const isActive = pathname.startsWith(href)
            return (
              <button
                key={href}
                onClick={() => safeNavigate(href)}
                className={cn(
                  'w-full flex items-center gap-3 py-2 px-3 rounded-lg text-sm text-left transition-colors',
                  isActive
                    ? 'font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
                style={
                  isActive
                    ? { backgroundColor: '#cceef5', color: '#0095b6' }
                    : undefined
                }
              >
                <Icon
                  className="w-[18px] h-[18px] shrink-0"
                  style={{ color: isActive ? '#0095b6' : undefined }}
                />
                {label}
              </button>
            )
          })}

          <div className="border-t border-gray-100 my-2" />

          {(() => {
            const isActive = pathname.startsWith('/configuracion')
            return (
              <button
                onClick={() => safeNavigate('/configuracion')}
                className={cn(
                  'w-full flex items-center gap-3 py-2 px-3 rounded-lg text-sm text-left transition-colors',
                  isActive
                    ? 'font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
                style={
                  isActive
                    ? { backgroundColor: '#cceef5', color: '#0095b6' }
                    : undefined
                }
              >
                <Settings
                  className="w-[18px] h-[18px] shrink-0"
                  style={{ color: isActive ? '#0095b6' : undefined }}
                />
                Configuración
              </button>
            )
          })()}
        </nav>
      </div>

      {/* ZONA BOTTOM */}
      <div className="px-4 pb-5 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3">
          {userProfile?.avatarUrl ? (
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.name}
              className="w-8 h-8 rounded-full shrink-0 object-cover"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
              style={{ backgroundColor: '#0095b6' }}
            >
              {userProfile?.initials ?? '…'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {userProfile?.name ?? '…'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {userProfile?.email ?? ''}
            </p>
          </div>
          <button
            onClick={async () => {
              const supabase = createClient()
              await supabase.auth.signOut()
              router.push('/login')
            }}
            className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AlertDialog
        open={!!pendingHref}
        onOpenChange={(open) => !open && setPendingHref(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Salir sin guardar?</AlertDialogTitle>
            <AlertDialogDescription>
              Tenés cambios sin guardar en esta pantalla. Si salís ahora,
              los vas a perder. ¿Querés salir igual o quedarte para guardar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver a la pantalla</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDiscardAndNavigate}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Salir sin guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  )
}
