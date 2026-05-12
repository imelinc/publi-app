'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WORKSPACES, Workspace } from '@/lib/mock-data'
import { useAppStore, getPostsByWorkspace } from '@/store/use-app-store'
import { ClientCard } from '@/components/dashboard/ClientCard'
import { ClientModal } from '@/components/dashboard/ClientModal'
import { useToast } from '@/components/ui/use-toast'
import { Plus } from 'lucide-react'

export default function ClientesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([...WORKSPACES])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)

  const router = useRouter()
  const posts = useAppStore((s) => s.posts)
  const setActiveWorkspace = useAppStore((s) => s.setActiveWorkspace)
  const { toast } = useToast()

  function handleEdit(workspace: Workspace) {
    setEditingWorkspace(workspace)
    setModalOpen(true)
  }

  function handleDelete(id: string) {
    setWorkspaces((prev) => prev.filter((ws) => ws.id !== id))
    toast({ title: 'Cliente eliminado' })
  }

  function handleViewWorkspace(workspace: Workspace) {
    setActiveWorkspace(workspace.id)
    router.push('/dashboard')
  }

  function handleSave(data: Omit<Workspace, 'id' | 'clientSince'>) {
    if (editingWorkspace) {
      setWorkspaces((prev) =>
        prev.map((ws) => (ws.id === editingWorkspace.id ? { ...ws, ...data } : ws))
      )
    } else {
      const newWorkspace: Workspace = {
        id: crypto.randomUUID(),
        ...data,
        clientSince: new Date().toISOString().split('T')[0],
      }
      setWorkspaces((prev) => [...prev, newWorkspace])
    }
    setModalOpen(false)
    setEditingWorkspace(null)
    toast({ title: 'Cliente guardado' })
  }

  function handleModalClose() {
    setModalOpen(false)
    setEditingWorkspace(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500">Gestioná los workspaces de tus clientes</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 bg-[#0095b6] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#007a96] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workspaces.map((workspace) => (
          <ClientCard
            key={workspace.id}
            workspace={workspace}
            posts={getPostsByWorkspace(posts, workspace.id)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewWorkspace={handleViewWorkspace}
          />
        ))}
      </div>

      <ClientModal
        open={modalOpen}
        onClose={handleModalClose}
        workspace={editingWorkspace}
        onSave={handleSave}
      />
    </div>
  )
}