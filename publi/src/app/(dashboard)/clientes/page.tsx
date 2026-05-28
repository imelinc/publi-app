'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/use-app-store'
import { ClientCard } from '@/components/dashboard/ClientCard'
import { ClientModal } from '@/components/dashboard/ClientModal'
import { ManageNetworksDialog } from '@/components/dashboard/ManageNetworksDialog'
import { useToast } from '@/components/ui/use-toast'
import { Plus } from 'lucide-react'
import type { Client, Plan } from '@/types'

function ClientCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
      <div className="flex gap-3 items-center">
        <div className="w-12 h-12 rounded-full bg-gray-200" />
        <div className="flex flex-col gap-2">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-12 bg-gray-200 rounded-full" />
        </div>
      </div>
      <div className="mt-3">
        <div className="h-3 w-28 bg-gray-200 rounded" />
        <div className="flex gap-2 mt-2">
          <div className="h-6 w-20 bg-gray-200 rounded-full" />
        </div>
      </div>
      <div className="flex gap-4 mt-4 pt-4 border-t border-gray-50">
        <div className="h-8 w-12 bg-gray-200 rounded" />
        <div className="h-8 w-12 bg-gray-200 rounded" />
        <div className="h-8 w-12 bg-gray-200 rounded" />
      </div>
      <div className="mt-4 h-9 w-full bg-gray-200 rounded-lg" />
    </div>
  )
}

export default function ClientesPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [networksClient, setNetworksClient] = useState<Client | null>(null)

  const router = useRouter()
  const clients = useAppStore((s) => s.clients)
  const clientsLoading = useAppStore((s) => s.clientsLoading)
  const fetchClients = useAppStore((s) => s.fetchClients)
  const addClient = useAppStore((s) => s.addClient)
  const updateClient = useAppStore((s) => s.updateClient)
  const deleteClient = useAppStore((s) => s.deleteClient)
  const setActiveWorkspace = useAppStore((s) => s.setActiveWorkspace)
  const { toast } = useToast()

  useEffect(() => {
    fetchClients().catch(() => {
      toast({
        title: 'Error al cargar clientes',
        description: 'No se pudieron obtener los clientes. Intentá de nuevo.',
      })
    })
  }, [fetchClients, toast])

  // Resultado del OAuth de Instagram (el callback redirige acá con query params).
  // Se maneja a nivel página porque el flujo saca al usuario de la app: cuando
  // vuelve, el dialog de "Gestionar redes" ya está cerrado.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const connected = params.get('ig_connected')
    const igError = params.get('ig_error')
    if (!connected && !igError) return

    if (connected) {
      toast({ title: 'Instagram conectado' })
      fetchClients().catch(() => {})
    } else if (igError) {
      const messages: Record<string, string> = {
        denied: 'Cancelaste la autorización de Instagram.',
        not_business:
          'Esa cuenta no es Business ni Creator. Convertila en Instagram (Configuración → Cuenta → Cambiar a cuenta profesional) y reintentá.',
        not_configured:
          'La integración con Instagram no está configurada (falta la app de Meta).',
        token: 'No pudimos conectar con Instagram. Probá de nuevo.',
      }
      toast({
        title: 'No se pudo conectar Instagram',
        description: messages[igError] ?? messages.token,
      })
    }
    // Limpiar los query params de la URL.
    router.replace('/clientes')
  }, [router, toast, fetchClients])

  function handleEdit(client: Client) {
    setEditingClient(client)
    setModalOpen(true)
  }

  async function handleDelete(id: string) {
    try {
      await deleteClient(id)
      toast({ title: 'Cliente eliminado' })
    } catch {
      toast({
        title: 'Error al eliminar',
        description: 'No se pudo eliminar el cliente. Intentá de nuevo.',
      })
    }
  }

  function handleViewWorkspace(client: Client) {
    setActiveWorkspace(client.id)
    router.push('/dashboard')
  }

  function handleManageNetworks(client: Client) {
    setNetworksClient(client)
  }

  async function handleNetworksDialogClose() {
    setNetworksClient(null)
    // Refrescar clientes para que las cards muestren las redes actualizadas
    try {
      await fetchClients()
    } catch {
      // silent
    }
  }

  async function handleSave(data: { name: string; color: string; plan: Plan }): Promise<Client> {
    try {
      if (editingClient) {
        await updateClient(editingClient.id, data)
        toast({ title: 'Cliente actualizado' })
        return { ...editingClient, ...data, initials: editingClient.initials }
      } else {
        const created = await addClient(data)
        toast({ title: 'Cliente creado — ahora conectá sus redes' })
        return created
      }
    } catch (err) {
      toast({
        title: 'Error al guardar',
        description: 'No se pudo guardar el cliente. Intentá de nuevo.',
      })
      throw err
    }
  }

  async function handleModalClose() {
    setModalOpen(false)
    setEditingClient(null)
    // Refrescar para que las cards reflejen redes conectadas en el paso 3
    try {
      await fetchClients()
    } catch {
      // silent
    }
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

      {clientsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ClientCardSkeleton />
          <ClientCardSkeleton />
          <ClientCardSkeleton />
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">No tenés clientes todavía.</p>
          <p className="text-sm text-gray-400 mt-1">
            Creá tu primer cliente para empezar a gestionar sus redes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewWorkspace={handleViewWorkspace}
              onManageNetworks={handleManageNetworks}
            />
          ))}
        </div>
      )}

      <ClientModal
        open={modalOpen}
        onClose={handleModalClose}
        client={editingClient}
        onSave={handleSave}
      />

      <ManageNetworksDialog
        open={networksClient !== null}
        onClose={handleNetworksDialogClose}
        clientId={networksClient?.id ?? null}
        clientName={networksClient?.name}
      />
    </div>
  )
}
