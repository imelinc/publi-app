'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '@/store/use-app-store'
import type { Network, Post } from '@/types'
import { StatsChart } from '@/components/dashboard/StatsChart'
import { TrendingUp, Clock, LogIn, ArrowRight, RefreshCw, BarChart2, Hash, Calendar, ChevronDown } from 'lucide-react'
import { NETWORK_META, ALL_NETWORKS } from '@/lib/networks'

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remMinutes = minutes % 60
  return remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours}h`
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

interface MetricsResponse {
  summary: {
    totalPosts: number
    published: number
    scheduled: number
    drafts: number
    timesLoggedIn: number
    timeSpentCreating: number
    deltaVsPrevious: number
  }
  posts: Post[]
  topHashtags: Array<{ hashtag: string; count: number }>
  postsByClient: Array<{ name: string; color: string; count: number }>
  postsByHour: Array<{ label: string; count: number }>
}

export default function MetricasPage() {
  const { activeWorkspaceId, clients } = useAppStore()
  const [clientFilter, setClientFilter] = useState<string>(activeWorkspaceId || 'all')
  const [periodFilter, setPeriodFilter] = useState<'7d' | '30d' | '3m'>('30d')
  const [networkFilter, setNetworkFilter] = useState<Network | 'all'>('all')
  const [data, setData] = useState<MetricsResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const allNetworks: Network[] = ALL_NETWORKS

  const fetchMetrics = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        clientId: clientFilter,
        period: periodFilter,
        network: networkFilter,
      })
      const res = await fetch(`/api/metrics?${queryParams.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (err) {
      console.error('Error fetching metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [clientFilter, periodFilter, networkFilter])

  const networkCounts = useMemo(() => {
    if (!data?.posts) return {}
    const counts: Record<string, number> = {}
    for (const net of allNetworks) {
      counts[net] = data.posts.filter((p) => p.networks.includes(net)).length
    }
    return counts
  }, [data?.posts])

  const maxNetworkCount = Math.max(...Object.values(networkCounts), 1)

  const sortedPosts = useMemo(() => {
    if (!data?.posts) return []
    return [...data.posts]
      .sort((a, b) => {
        const dateA = a.scheduledAt ?? a.createdAt
        const dateB = b.scheduledAt ?? b.createdAt
        return dateB.localeCompare(dateA)
      })
      .slice(0, 10)
  }, [data?.posts])

  const maxHourCount = Math.max(...(data?.postsByHour?.map((h) => h.count) || []), 1)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight gradient-text">Estadísticas</h1>
          <p className="text-xs text-gray-500 mt-1">Resumen de publicaciones y actividad real de tu workspace</p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <div className="relative">
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="h-10 rounded-xl border border-gray-200 bg-white pl-4 pr-10 text-xs font-semibold text-gray-750 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer shadow-sm hover:border-gray-300 appearance-none"
            >
              <option value="all">Todos los clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>

          <div className="relative">
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as '7d' | '30d' | '3m')}
              className="h-10 rounded-xl border border-gray-200 bg-white pl-4 pr-10 text-xs font-semibold text-gray-755 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer shadow-sm hover:border-gray-300 appearance-none"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="3m">Últimos 3 meses</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>

          <div className="relative">
            <select
              value={networkFilter}
              onChange={(e) => setNetworkFilter(e.target.value as Network | 'all')}
              className="h-10 rounded-xl border border-gray-200 bg-white pl-4 pr-10 text-xs font-semibold text-gray-755 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer shadow-sm hover:border-gray-300 appearance-none"
            >
              <option value="all">Todas las redes</option>
              {allNetworks.map((net) => (
                <option key={net} value={net}>
                  {NETWORK_META[net].label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>

          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="h-10 w-10 rounded-xl border border-gray-200 bg-white text-gray-550 hover:text-gray-900 disabled:opacity-50 cursor-pointer shadow-sm hover:border-gray-305 flex items-center justify-center transition-all hover:bg-gray-50 active:scale-95"
            title="Refrescar"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center h-80 bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-xs">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cargando estadísticas del workspace...</p>
        </div>
      ) : (
        <>
          {/* Tarjetas de Estadísticas Principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="premium-card p-5 relative overflow-hidden group border border-gray-100/50">
              <div className="absolute top-4 right-4 p-2 bg-primary/10 text-primary rounded-xl transition duration-300 group-hover:scale-105 shadow-sm">
                <BarChart2 className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Publicaciones</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1 tracking-tight">{data?.summary.totalPosts ?? 0}</p>
              <div className="flex items-center gap-1 mt-3">
                {data && data.summary.deltaVsPrevious !== 0 ? (
                  data.summary.deltaVsPrevious > 0 ? (
                    <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200/60">
                      <TrendingUp className="w-3 h-3" />
                      <span>+{data.summary.deltaVsPrevious} vs anterior</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200/60">
                      <TrendingUp className="w-3 h-3 rotate-180" />
                      <span>{data.summary.deltaVsPrevious} vs anterior</span>
                    </div>
                  )
                ) : (
                  <span className="text-[10px] font-bold text-gray-450 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-150">Sin cambios</span>
                )}
              </div>
            </div>

            <div className="premium-card p-5 relative overflow-hidden group border border-gray-100/50">
              <div className="absolute top-4 right-4 p-2 bg-green-50 text-green-600 rounded-xl transition duration-300 group-hover:scale-105 shadow-sm">
                <TrendingUp className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Publicadas</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1 tracking-tight">{data?.summary.published ?? 0}</p>
              <p className="text-[10px] font-bold text-green-600/80 bg-green-50/50 border border-green-100/80 px-2 py-0.5 rounded-full mt-3 inline-block">En redes sociales</p>
            </div>

            <div className="premium-card p-5 relative overflow-hidden group border border-gray-100/50">
              <div className="absolute top-4 right-4 p-2 bg-blue-50 text-blue-600 rounded-xl transition duration-300 group-hover:scale-105 shadow-sm">
                <Calendar className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Programadas</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1 tracking-tight">{data?.summary.scheduled ?? 0}</p>
              <p className="text-[10px] font-bold text-blue-600/80 bg-blue-50/50 border border-blue-100/80 px-2 py-0.5 rounded-full mt-3 inline-block">Pendientes</p>
            </div>

            <div className="premium-card p-5 relative overflow-hidden group border border-gray-100/50">
              <div className="absolute top-4 right-4 p-2 bg-slate-100 text-slate-600 rounded-xl transition duration-300 group-hover:scale-105 shadow-sm">
                <Calendar className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Borradores</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1 tracking-tight">{data?.summary.drafts ?? 0}</p>
              <p className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded-full mt-3 inline-block">Locales</p>
            </div>

            <div className="premium-card p-5 relative overflow-hidden group border border-gray-100/50">
              <div className="absolute top-4 right-4 p-2 bg-amber-50 text-amber-600 rounded-xl transition duration-300 group-hover:scale-105 shadow-sm">
                <LogIn className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Inicios de sesión</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1 tracking-tight">{data?.summary.timesLoggedIn ?? 0}</p>
              <p className="text-[10px] font-bold text-amber-600/80 bg-amber-50/50 border border-amber-100/80 px-2 py-0.5 rounded-full mt-3 inline-block">Sesiones</p>
            </div>

            <div className="premium-card p-5 relative overflow-hidden group border border-gray-100/50">
              <div className="absolute top-4 right-4 p-2 bg-purple-50 text-purple-600 rounded-xl transition duration-300 group-hover:scale-105 shadow-sm">
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tiempo en la app</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1 tracking-tight">{formatDuration(data?.summary.timeSpentCreating ?? 0)}</p>
              <p className="text-[10px] font-bold text-purple-600/80 bg-purple-50/50 border border-purple-100/80 px-2 py-0.5 rounded-full mt-3 inline-block">Tiempo total</p>
            </div>
          </div>

          {/* Gráficos Principales */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 premium-card p-6 border border-gray-100/50">
              <h3 className="font-bold text-xs text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-wider">
                <BarChart2 className="w-4 h-4 text-primary" />
                Publicaciones en el tiempo
              </h3>
              {data?.posts && data.posts.length > 0 ? (
                <StatsChart posts={data.posts} period={periodFilter} />
              ) : (
                <div className="flex items-center justify-center h-80 text-xs font-bold text-gray-400 bg-gray-50/30 rounded-2xl border border-dashed border-gray-200">
                  No hay publicaciones para el gráfico en este período
                </div>
              )}
            </div>

            <div className="lg:col-span-2 premium-card p-6 border border-gray-100/50 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-xs text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-wider">
                  <BarChart2 className="w-4 h-4 text-amber-500" />
                  Distribución por red
                </h3>
                <div className="space-y-4">
                  {allNetworks.map((net) => {
                    const count = networkCounts[net] ?? 0
                    const pct = (count / maxNetworkCount) * 100
                    return (
                      <div key={net} className="flex items-center gap-3">
                        <div className="w-24 flex items-center gap-2">
                          <img
                            src={NETWORK_META[net].iconColor}
                            alt={NETWORK_META[net].label}
                            width={14}
                            height={14}
                            className="shrink-0"
                          />
                          <span className="text-xs font-bold text-gray-700">{NETWORK_META[net].label}</span>
                        </div>
                        <div
                          className="flex-1 h-3 rounded-full relative bg-gray-100/80 overflow-hidden"
                        >
                          <div
                            className="h-full rounded-full flex items-center justify-end pr-2 text-[8px] text-white font-extrabold transition-all duration-500 shadow-inner"
                            style={{
                              width: `${Math.max(pct, 8)}%`,
                              backgroundColor: NETWORK_META[net].color,
                            }}
                          >
                            {count > 0 && count}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {clientFilter === 'all' && data?.postsByClient && data.postsByClient.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="font-bold text-xs text-gray-900 mb-4 uppercase tracking-wider">Publicaciones por cliente</h3>
                  <div className="space-y-3.5">
                    {data.postsByClient.slice(0, 4).map((c) => {
                      const maxClientCount = Math.max(...data.postsByClient.map(x => x.count), 1)
                      const pct = (c.count / maxClientCount) * 100
                      return (
                        <div key={c.name} className="flex items-center gap-3">
                          <div className="w-24 truncate text-xs font-bold text-gray-700">{c.name}</div>
                          <div className="flex-1 h-3 rounded-full relative bg-gray-100/80 overflow-hidden">
                            <div
                              className="h-full rounded-full flex items-center justify-end pr-2 text-[8px] text-white font-extrabold transition-all duration-500 shadow-inner"
                              style={{
                                width: `${Math.max(pct, 8)}%`,
                                backgroundColor: c.color,
                              }}
                            >
                              {c.count > 0 && c.count}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hashtags e Insights Horarios */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="premium-card p-6 border border-gray-100/50">
              <h3 className="font-bold text-xs text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-wider">
                <Hash className="w-4 h-4 text-primary" />
                Hashtags más populares
              </h3>
              {data?.topHashtags && data.topHashtags.length > 0 ? (
                <div className="space-y-3">
                  {data.topHashtags.map((h, index) => (
                    <div
                      key={h.hashtag}
                      className="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-gray-100 hover:border-gray-200 transition duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-extrabold">
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-gray-800 group-hover:text-primary transition">
                          #{h.hashtag}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 bg-white text-gray-500 rounded-full border border-gray-100 shadow-xs">
                        {h.count} {h.count === 1 ? 'uso' : 'usos'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-xs font-bold text-gray-405 bg-gray-50/30 rounded-2xl border border-dashed border-gray-200">
                  No se encontraron hashtags en las publicaciones de este período
                </div>
              )}
            </div>

            <div className="premium-card p-6 border border-gray-100/50">
              <h3 className="font-bold text-xs text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-wider">
                <Clock className="w-4 h-4 text-primary" />
                Horarios de publicación preferidos
              </h3>
              {data?.postsByHour && data.postsByHour.some((h) => h.count > 0) ? (
                <div className="space-y-4">
                  {data.postsByHour.map((h) => {
                    const pct = (h.count / maxHourCount) * 100
                    return (
                      <div key={h.label} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
                          <span>{h.label}</span>
                          <span className="text-gray-900 font-bold text-[11px]">{h.count} {h.count === 1 ? 'post' : 'posts'}</span>
                        </div>
                        <div className="h-2 rounded-full relative bg-gray-100/80 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-primary to-primary-light"
                            style={{
                              width: `${pct}%`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-xs font-bold text-gray-405 bg-gray-50/30 rounded-2xl border border-dashed border-gray-200">
                  No hay datos suficientes para calcular los horarios de publicación
                </div>
              )}
            </div>
          </div>

          {/* Tabla de Publicaciones Recientes */}
          <div className="premium-card p-6 border border-gray-100/50">
            <h3 className="font-bold text-xs text-gray-900 mb-6 uppercase tracking-wider">Listado de publicaciones ({data?.posts.length ?? 0})</h3>
            {sortedPosts.length === 0 ? (
              <p className="text-xs font-bold text-gray-400 text-center py-8 uppercase tracking-wide">No hay publicaciones en este período</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="w-[20%] text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3">Red</th>
                      <th className="w-[35%] text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3">Título</th>
                      <th className="w-[15%] text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3">Estado</th>
                      <th className="w-[18%] text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3">Fecha</th>
                      <th className="w-[12%] text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3">Cliente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPosts.map((post) => {
                      const statusMap: Record<string, { bg: string; label: string }> = {
                        published: { bg: 'bg-green-50 text-green-700 border-green-200/60', label: 'Publicada' },
                        scheduled: { bg: 'bg-blue-50 text-blue-700 border-blue-200/60', label: 'Programada' },
                        draft: { bg: 'bg-gray-50 text-gray-650 border-gray-200/60', label: 'Borrador' },
                      }
                      const st = statusMap[post.status] ?? statusMap.draft
                      return (
                        <tr key={post.id} className="border-b border-gray-100/50 last:border-0 hover:bg-slate-50/50 transition-colors duration-150">
                          <td className="py-3.5 pr-2">
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {post.networks.map((net) => (
                                <div key={net} className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-gray-100/60" title={NETWORK_META[net].label}>
                                  <img
                                    src={NETWORK_META[net].icon}
                                    alt={NETWORK_META[net].label}
                                    width={12}
                                    height={12}
                                    className="opacity-90"
                                  />
                                  <span className="text-[10px] text-gray-600 font-bold">
                                    {NETWORK_META[net].label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 text-xs text-gray-800 truncate pr-4 font-bold">{post.title || '(Sin título)'}</td>
                          <td className="py-3.5">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${st.bg}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="py-3.5 text-xs font-semibold text-gray-500 whitespace-nowrap">
                            {formatDateShort(post.scheduledAt ?? post.createdAt)}
                          </td>
                          <td className="py-3.5 text-right">
                            <span
                              className="inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold text-white shadow-xs"
                              style={{ backgroundColor: post.clientColor }}
                            >
                              {post.clientName}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
