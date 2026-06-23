'use client'

import { useEffect, useState } from 'react'
import { Loader2, Check, X, Plus, Wifi } from 'lucide-react'
import { ALL_NETWORKS, NETWORK_META } from '@/lib/networks'
import { useAppStore } from '@/store/use-app-store'
import { useToast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Network, SocialAccount } from '@/types'
import { cn } from '@/lib/utils'

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
      <div className="flex items-center justify-center py-10 text-[#0095b6]">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-3.5 py-1">
      {ALL_NETWORKS.map((network) => {
        const meta = NETWORK_META[network]
        const account = accounts.find((a) => a.network === network)
        const isBusy = busy === network
        const draft = drafts[network] ?? ''
        const password = passwords[network] ?? ''
        const isInstagram = network === 'instagram'
        const isOAuth = isInstagram

        return (
          <div
            key={network}
            className={cn(
              "flex flex-col p-4 rounded-2xl border transition-all duration-200 shadow-3xs",
              account
                ? "bg-emerald-50/5 border-emerald-200/50 shadow-emerald-50/10"
                : "bg-slate-50/50 border-slate-150/70 hover:bg-slate-50"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Left side: Icon & Label */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-3xs shrink-0">
                  <img
                    src={meta.iconColor}
                    alt={meta.label}
                    width={20}
                    height={20}
                    className="size-5 object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-gray-800 tracking-tight">{meta.label}</div>
                  {account ? (
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 truncate mt-1">
                      <Check className="size-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate font-semibold text-slate-700">
                        {account.network === 'facebook' ? account.username : `@${account.username}`}
                      </span>
                      {account.isSimulated ? (
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider">
                          Simulada
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider animate-pulse">
                          Conectada
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 font-medium mt-1">
                      {isOAuth
                        ? 'Requiere autorización por API de Facebook/Instagram.'
                        : 'Simulá la conexión de este canal de marca.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Action button */}
              <div className="shrink-0">
                {account ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect(account)}
                    disabled={isBusy}
                    className="h-8 text-[10px] font-bold text-rose-600 border-rose-200 bg-white hover:bg-rose-50 hover:text-rose-700 rounded-xl px-3 transition-all cursor-pointer shadow-3xs"
                  >
                    {isBusy ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <>
                        <X className="size-3.5 mr-1" />
                        Desconectar
                      </>
                    )}
                  </Button>
                ) : isOAuth ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      window.open(`/api/instagram/connect?clientId=${clientId}`, '_blank')
                    }}
                    className="bg-[#0095b6] hover:bg-[#007a96] text-white h-8 text-[10px] font-bold rounded-xl px-3 transition-all cursor-pointer shadow-sm hover:scale-[1.01] active:scale-[0.99] border border-transparent"
                  >
                    Conectar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleConnect(network)}
                    disabled={isBusy || !draft.trim() || !password.trim()}
                    className="bg-[#0095b6] hover:bg-[#007a96] text-white h-8 text-[10px] font-bold rounded-xl px-3 transition-all cursor-pointer shadow-sm hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none border border-transparent"
                  >
                    {isBusy ? (
                      <Loader2 className="size-3 animate-spin" />
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

            {/* Simulated Form inputs */}
            {!account && !isOAuth && (
              <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3.5 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="space-y-1">
                  <Input
                    value={draft}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [network]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isBusy) handleConnect(network)
                    }}
                    placeholder={network === 'facebook' ? 'Nombre de usuario' : '@usuario'}
                    className="h-8.5 text-xs rounded-xl border-slate-200 bg-white"
                    disabled={isBusy}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1">
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
                    className="h-8.5 text-xs rounded-xl border-slate-200 bg-white"
                    disabled={isBusy}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
