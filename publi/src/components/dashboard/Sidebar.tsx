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
  Wand2,
  Lock,
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
  { label: 'Editor', href: '/editor', Icon: Wand2 },
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
    <aside className="fixed left-0 top-0 w-[280px] h-screen bg-[#0f1117] flex flex-col z-30">
      {/* ZONA TOP */}
      <div className="px-5 pt-6 pb-4">
        <span className="font-bold text-xl text-primary tracking-tight">
          publi
        </span>

        {/* Workspace selector */}
        <div className="relative mt-4" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.06] transition-all duration-200"
          >
            {activeClient ? (
              <>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ring-2 ring-white/10"
                  style={{
                    backgroundColor: activeClient.color,
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {activeClient.initials}
                </div>
                <span className="flex-1 text-sm font-medium text-white/90 text-left truncate">
                  {activeClient.name}
                </span>
              </>
            ) : (
              <span className="flex-1 text-sm text-white/40 text-left">Sin clientes</span>
            )}
            <ChevronDown className={cn(
              "w-4 h-4 text-white/40 shrink-0 transition-transform duration-200",
              dropdownOpen && "rotate-180"
            )} />
          </button>

          {dropdownOpen && clients.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#1a1d27] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/40 z-50 py-1.5 backdrop-blur-xl">
              {clients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveWorkspace(c.id)
                    setDropdownOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/[0.06] transition-colors rounded-lg mx-0"
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
                  <span className="flex-1 text-sm text-white/80 text-left truncate">
                    {c.name}
                  </span>
                  {c.id === activeWorkspaceId && (
                    <Check className="w-4 h-4 shrink-0 text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ZONA MIDDLE */}
      <div className="flex-1 px-3 pb-4 flex flex-col overflow-y-auto">
        <button
          onClick={() => safeNavigate('/nueva-publicacion')}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white text-sm font-medium mb-4 bg-gradient-to-r from-primary to-[#00b4d8] sidebar-glow-btn cursor-pointer"
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
                  'w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm text-left transition-all duration-200 relative group',
                  isActive
                    ? 'bg-white/[0.08] text-white font-medium'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
                )}
                <Icon
                  className={cn(
                    "w-[18px] h-[18px] shrink-0 transition-colors duration-200",
                    isActive ? 'text-primary' : 'text-white/40 group-hover:text-white/70'
                  )}
                />
                <span className="flex-1 truncate">{label}</span>
                {userProfile?.plan === 'free' && (href === '/ai' || href === '/editor') && (
                  <Lock className="w-3.5 h-3.5 text-white/25 shrink-0 ml-auto" />
                )}
              </button>
            )
          })}

          <div className="border-t border-white/[0.06] my-2.5" />

          {(() => {
            const isActive = pathname.startsWith('/configuracion')
            return (
              <button
                onClick={() => safeNavigate('/configuracion')}
                className={cn(
                  'w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm text-left transition-all duration-200 relative group',
                  isActive
                    ? 'bg-white/[0.08] text-white font-medium'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
                )}
                <Settings
                  className={cn(
                    "w-[18px] h-[18px] shrink-0 transition-colors duration-200",
                    isActive ? 'text-primary' : 'text-white/40 group-hover:text-white/70'
                  )}
                />
                Configuración
              </button>
            )
          })()}
        </nav>
      </div>

      {/* ZONA BOTTOM */}
      <div className="px-4 pb-5 pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-3">
          {userProfile?.avatarUrl ? (
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.name}
              className="w-8 h-8 rounded-full shrink-0 object-cover ring-2 ring-white/10"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 ring-2 ring-white/10"
              style={{ backgroundColor: '#0095b6' }}
            >
              {userProfile?.initials ?? '…'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/90 truncate">
              {userProfile?.name ?? '…'}
            </p>
            <p className="text-xs text-white/40 truncate">
              {userProfile?.email ?? ''}
            </p>
          </div>
          <button
            onClick={async () => {
              const supabase = createClient()
              await supabase.auth.signOut()
              router.push('/login')
            }}
            className="text-white/30 hover:text-white/60 cursor-pointer transition-colors"
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
