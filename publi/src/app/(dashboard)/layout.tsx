'use client'

import { useEffect } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { TopBar } from '@/components/dashboard/TopBar'
import { Toaster } from '@/components/ui/toaster'
import { useAppStore } from '@/store/use-app-store'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const fetchClients = useAppStore((s) => s.fetchClients)
  const fetchPosts = useAppStore((s) => s.fetchPosts)
  const fetchEvents = useAppStore((s) => s.fetchEvents)

  useEffect(() => {
    fetchClients().catch(() => {})
    fetchPosts().catch(() => {})
    fetchEvents().catch(() => {})
  }, [fetchClients, fetchPosts, fetchEvents])

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
