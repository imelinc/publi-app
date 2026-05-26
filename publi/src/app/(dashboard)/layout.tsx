'use client'

import { useEffect } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { TopBar } from '@/components/dashboard/TopBar'
import { Toaster } from '@/components/ui/toaster'
import { useAppStore } from '@/store/use-app-store'
import { createClient } from '@/lib/supabase/client'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const fetchClients = useAppStore((s) => s.fetchClients)
  const fetchPosts = useAppStore((s) => s.fetchPosts)
  const fetchEvents = useAppStore((s) => s.fetchEvents)
  const fetchUserProfile = useAppStore((s) => s.fetchUserProfile)

  useEffect(() => {
    fetchUserProfile().catch(() => {})
    fetchClients().catch(() => {})
    fetchPosts().catch(() => {})
    fetchEvents().catch(() => {})
  }, [fetchUserProfile, fetchClients, fetchPosts, fetchEvents])

  // Cuando la pestaña vuelve a tener foco, refrescamos posts y eventos.
  // Backup por si Realtime se cayó o el sistema operativo suspendió la conexión.
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        fetchPosts().catch(() => {})
        fetchEvents().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', onVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', onVisibilityChange)
    }
  }, [fetchPosts, fetchEvents])

  // ─── Supabase Realtime ────────────────────────────────────────────────────────
  // Suscribimos a INSERT/UPDATE/DELETE en posts y calendar_events.
  // RLS hace que solo recibamos cambios en filas que el usuario puede ver.
  // Estrategia: ante cualquier cambio, re-fetch del listado completo (simple
  // y robusto; el tamaño de datos es chico para un CM).
  useEffect(() => {
    const supabase = createClient()

    const postsChannel = supabase
      .channel('realtime-posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => {
          fetchPosts().catch(() => {})
        }
      )
      // post_publications también afectan al post (ej: cuando se publica una red)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_publications' },
        () => {
          fetchPosts().catch(() => {})
        }
      )
      .subscribe()

    const eventsChannel = supabase
      .channel('realtime-events')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calendar_events' },
        () => {
          fetchEvents().catch(() => {})
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(postsChannel)
      supabase.removeChannel(eventsChannel)
    }
  }, [fetchPosts, fetchEvents])

  return (
    <>
      <div className="flex">
        <Sidebar />
        <div className="ml-[280px] flex flex-col min-h-screen w-full bg-[#f5f0e8]">
          <TopBar />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
      <Toaster />
    </>
  )
}
