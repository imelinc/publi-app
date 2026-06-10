'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  const router = useRouter()
  const searchParams = useSearchParams()

  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<Network | null>(null)
  const [drafts, setDrafts] = useState<Partial<Record<Network, string>>>({})
  const [passwords, setPasswords] = useState<Partial<Record<Network, string>>>({})

  // Resultado del OAuth de Facebook (el callback redirige a /clientes con query params)
  useEffect(() => {
    const connected = searchParams.get('fb_connected')
    const error = searchParams.get('fb_error')
    const noPages = searchParams.get('fb_no_pages')

    if (!connected && !error && !noPages) return

    if (connected === '1') {
      toast({ title: 'Facebook conectado' })
      fetchSocialAccounts(clientId).then(setAccounts).catch(() => {})
    } else if (noPages === '1') {
      toast({
        title: 'No se pudo conectar Facebook',
        description: 'No encontramos páginas de Facebook que administres.',
      })
    } else if (error) {
      const messages: Record<string, string> = {
        not_configured: 'La integración con Facebook no está configurada (falta la app de Meta).',
        token: 'No pudimos conectar con Facebook. Probá de nuevo.',
      }
      toast({
        title: 'No se pudo conectar Facebook',
        description: messages[error] ?? messages.token,
      })
    }

    // Limpiar los query params
    const newParams = new URLSearchParams(window.location.search)
    newParams.delete('fb_connected')
    newParams.delete('fb_error')
    newParams.delete('fb_no_pages')
    const cleanSearch = newParams.toString()
    const cleanUrl = window.location.pathname + (cleanSearch ? `?${cleanSearch}` : '')
    router.replace(cleanUrl)
  }, [searchParams, router, toast, clientId, fetchSocialAccounts])

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
        // Instagram y Facebook usan OAuth real (no el form simulado de usuario+contraseña).
        const isInstagram = network === 'instagram'
        const isFacebook = network === 'facebook'
        const isOAuth = isInstagram || isFacebook

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
                <div className="flex items-center gap-2 text-xs text-gray-500 truncate mt-0.5">
                  <Check className="size-3 text-green-500 shrink-0" />
                  <span className="truncate">
                    {account.network === 'facebook' ? account.username : `@${account.username}`}
                  </span>
                  {account.isSimulated ? (
                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider">
                      Simulada
                    </span>
                  ) : (
                    <span className="bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider font-medium">
                      Conectada
                    </span>
                  )}
                </div>
              ) : isOAuth ? (
                <p className="text-xs text-gray-400 mt-1 leading-snug">
                  {isInstagram
                    ? 'Requiere una cuenta Business o Creator. Vas a iniciar sesión en Instagram para autorizar.'
                    : 'Requiere una página de Facebook. Vas a iniciar sesión en Facebook para autorizar.'}
                </p>
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
                    placeholder="@usuario"
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
              ) : isOAuth ? (
                <Button
                  size="sm"
                  onClick={() => {
                    window.location.href = isInstagram
                      ? `/api/instagram/connect?clientId=${clientId}`
                      : `/api/facebook/connect?clientId=${clientId}`
                  }}
                  className="bg-[#0095b6] hover:bg-[#007a96] text-white h-8"
                >
                  {isInstagram ? 'Conectar con Instagram' : 'Conectar con Facebook'}
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
