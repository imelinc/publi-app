'use client'

import { useEffect, useState } from 'react'
import { Loader2, Check, X, Plus } from 'lucide-react'
import { ALL_NETWORKS, NETWORK_META } from '@/lib/networks'
import { useAppStore } from '@/store/use-app-store'
import { useToast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Network, SocialAccount } from '@/types'

interface NetworksManagerProps {
  clientId: string
}

/**
 * Lista las 6 redes sociales con su estado actual de conexión para un cliente.
 * Permite conectar (ingresando un username) o desconectar cada red individualmente.
 *
 * Reusable: se usa tanto en ManageNetworksDialog como en el paso 3 de ClientModal.
 */
export function NetworksManager({ clientId }: NetworksManagerProps) {
  const { toast } = useToast()
  const { fetchSocialAccounts, addSocialAccount, removeSocialAccount } = useAppStore()

  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<Network | null>(null)
  const [drafts, setDrafts] = useState<Partial<Record<Network, string>>>({})
  const [passwords, setPasswords] = useState<Partial<Record<Network, string>>>({})

  // Cargar cuentas al montar
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchSocialAccounts(clientId)
      .then((data) => {
        if (!cancelled) setAccounts(data)
      })
      .catch((err) => {
        if (!cancelled) {
          toast({
            title: 'Error al cargar cuentas',
            description: err instanceof Error ? err.message : undefined,
          })
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [clientId, fetchSocialAccounts, toast])

  async function handleConnect(network: Network) {
    const username = (drafts[network] ?? '').trim()
    const password = (passwords[network] ?? '').trim()
    if (!username) {
      toast({ title: 'Escribí un nombre de usuario antes de conectar' })
      return
    }
    if (!password) {
      toast({ title: 'Escribí la contraseña antes de conectar' })
      return
    }

    setBusy(network)
    try {
      const account = await addSocialAccount(clientId, network, username, password)
      setAccounts((prev) => [...prev, account])
      setDrafts((prev) => ({ ...prev, [network]: '' }))
      setPasswords((prev) => ({ ...prev, [network]: '' }))
      toast({ title: `${NETWORK_META[network].label} conectada` })
    } catch (err) {
      toast({
        title: 'No se pudo conectar',
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setBusy(null)
    }
  }

  async function handleDisconnect(account: SocialAccount) {
    setBusy(account.network)
    try {
      await removeSocialAccount(clientId, account.id, account.network)
      setAccounts((prev) => prev.filter((a) => a.id !== account.id))
      toast({ title: `${NETWORK_META[account.network].label} desconectada` })
    } catch (err) {
      toast({
        title: 'No se pudo desconectar',
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-400">
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col divide-y divide-gray-100">
      {ALL_NETWORKS.map((network) => {
        const meta = NETWORK_META[network]
        const account = accounts.find((a) => a.network === network)
        const isBusy = busy === network
        const draft = drafts[network] ?? ''
        const password = passwords[network] ?? ''

        return (
          <div key={network} className="flex items-start gap-3 py-3">
            {/* Ícono */}
            <img
              src={meta.iconColor}
              alt={meta.label}
              width={28}
              height={28}
              className="shrink-0 mt-1"
            />

            {/* Info + inputs */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800">{meta.label}</div>
              {account ? (
                <div className="flex items-center gap-1 text-xs text-gray-500 truncate mt-0.5">
                  <Check className="size-3 text-green-500 shrink-0" />
                  <span className="truncate">@{account.username}</span>
                </div>
              ) : (
                <div className="mt-2 flex flex-col gap-1.5">
                  <Input
                    value={draft}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [network]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isBusy) handleConnect(network)
                    }}
                    placeholder={network === 'instagram' ? '@minegocio' : '@usuario'}
                    className="h-8 text-xs"
                    disabled={isBusy}
                    autoComplete="off"
                  />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPasswords((prev) => ({ ...prev, [network]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isBusy) handleConnect(network)
                    }}
                    placeholder="Contraseña"
                    className="h-8 text-xs"
                    disabled={isBusy}
                    autoComplete="new-password"
                  />
                </div>
              )}
            </div>

            {/* Acción */}
            <div className="shrink-0 mt-1">
              {account ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDisconnect(account)}
                  disabled={isBusy}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  {isBusy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <>
                      <X className="size-3.5 mr-1" />
                      Desconectar
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleConnect(network)}
                  disabled={isBusy || !draft.trim() || !password.trim()}
                  className="bg-[#0095b6] hover:bg-[#007a96] text-white h-8"
                >
                  {isBusy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="size-3.5 mr-0.5" />
                      Conectar
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
