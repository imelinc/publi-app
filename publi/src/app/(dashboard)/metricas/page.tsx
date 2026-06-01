'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '@/store/use-app-store'
import type { Network, Post } from '@/types'
import { StatsChart } from '@/components/dashboard/StatsChart'
import { TrendingUp, Clock, LogIn, ArrowRight, RefreshCw, BarChart2, Hash, Calendar } from 'lucide-react'
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
          <h1 className="text-2xl font-semibold text-gray-900">Estadísticas</h1>
          <p className="text-sm text-gray-500 mt-1">Resumen de publicaciones y actividad real</p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-[#0095b6] transition cursor-pointer shadow-sm hover:border-gray-300"
          >
            <option value="all">Todos los clientes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as '7d' | '30d' | '3m')}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-[#0095b6] transition cursor-pointer shadow-sm hover:border-gray-300"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="3m">Últimos 3 meses</option>
          </select>

          <select
            value={networkFilter}
            onChange={(e) => setNetworkFilter(e.target.value as Network | 'all')}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-[#0095b6] transition cursor-pointer shadow-sm hover:border-gray-300"
          >
            <option value="all">Todas las redes</option>
            {allNetworks.map((net) => (
              <option key={net} value={net}>
                {NETWORK_META[net].label}
              </option>
            ))}
          </select>

          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-900 disabled:opacity-50 cursor-pointer shadow-sm hover:border-gray-300 flex items-center justify-center"
            title="Refrescar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center h-80 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <RefreshCw className="w-8 h-8 text-[#0095b6] animate-spin mb-2" />
          <p className="text-sm text-gray-500">Cargando métricas de la aplicación...</p>
        </div>
      ) : (
        <>
          {/* Tarjetas de Estadísticas Principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition duration-300">
              <div className="absolute top-0 right-0 p-3 opacity-10 text-gray-400 group-hover:scale-110 transition duration-300">
                <BarChart2 className="w-12 h-12" />
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Publicaciones</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{data?.summary.totalPosts ?? 0}</p>
              <div className="flex items-center gap-1 text-xs mt-2">
                {data && data.summary.deltaVsPrevious !== 0 ? (
                  data.summary.deltaVsPrevious > 0 ? (
                    <>
                      <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-green-600 font-medium">+{data.summary.deltaVsPrevious} vs periodo anterior</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-3.5 h-3.5 text-red-500 rotate-180" />
                      <span className="text-red-600 font-medium">{data.summary.deltaVsPrevious} vs periodo anterior</span>
                    </>
                  )
                ) : (
                  <span className="text-gray-400">Sin cambios vs periodo anterior</span>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition duration-300">
              <div className="absolute top-0 right-0 p-3 opacity-10 text-green-500 group-hover:scale-110 transition duration-300">
                <BarChart2 className="w-12 h-12" />
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Publicadas</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{data?.summary.published ?? 0}</p>
              <p className="text-xs text-gray-400 mt-2">En redes sociales</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition duration-300">
              <div className="absolute top-0 right-0 p-3 opacity-10 text-blue-500 group-hover:scale-110 transition duration-300">
                <Calendar className="w-12 h-12" />
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Programadas</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{data?.summary.scheduled ?? 0}</p>
              <p className="text-xs text-gray-400 mt-2">Pendientes de publicación</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition duration-300">
              <div className="absolute top-0 right-0 p-3 opacity-10 text-gray-500 group-hover:scale-110 transition duration-300">
                <Calendar className="w-12 h-12" />
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Borradores</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{data?.summary.drafts ?? 0}</p>
              <p className="text-xs text-gray-400 mt-2">Guardados localmente</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition duration-300">
              <div className="absolute top-0 right-0 p-3 opacity-10 text-[#ffb703] group-hover:scale-110 transition duration-300">
                <LogIn className="w-12 h-12" />
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Inicios de sesión</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{data?.summary.timesLoggedIn ?? 0}</p>
              <p className="text-xs text-gray-400 mt-2">Sesiones en la aplicación</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition duration-300">
              <div className="absolute top-0 right-0 p-3 opacity-10 text-[#0095b6] group-hover:scale-110 transition duration-300">
                <Clock className="w-12 h-12" />
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tiempo en la app</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{formatDuration(data?.summary.timeSpentCreating ?? 0)}</p>
              <p className="text-xs text-gray-400 mt-2">Tiempo total en la plataforma</p>
            </div>
          </div>

          {/* Gráficos Principales */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-[#0095b6]" />
                Publicaciones en el tiempo
              </h3>
              {data?.posts && data.posts.length > 0 ? (
                <StatsChart posts={data.posts} period={periodFilter} />
              ) : (
                <div className="flex items-center justify-center h-80 text-sm text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  No hay publicaciones para el gráfico en este período
                </div>
              )}
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[#ffb703]" />
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
                            width={16}
                            height={16}
                          />
                          <span className="text-sm font-medium text-gray-700">{NETWORK_META[net].label}</span>
                        </div>
                        <div
                          className="flex-1 h-6 rounded-md relative"
                          style={{ backgroundColor: `${NETWORK_META[net].color}15` }}
                        >
                          <div
                            className="h-full rounded-md flex items-center justify-center text-xs text-white font-semibold transition-all duration-500"
                            style={{
                              width: `${Math.max(pct, 12)}%`,
                              backgroundColor: NETWORK_META[net].color,
                            }}
                          >
                            {count}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {clientFilter === 'all' && data?.postsByClient && data.postsByClient.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-4">Publicaciones por cliente</h3>
                  <div className="space-y-3">
                    {data.postsByClient.slice(0, 4).map((c) => {
                      const maxClientCount = Math.max(...data.postsByClient.map(x => x.count), 1)
                      const pct = (c.count / maxClientCount) * 100
                      return (
                        <div key={c.name} className="flex items-center gap-3">
                          <div className="w-24 truncate text-sm font-medium text-gray-700">{c.name}</div>
                          <div className="flex-1 h-5 rounded-md relative bg-gray-50">
                            <div
                              className="h-full rounded-md flex items-center justify-center text-xs text-white font-medium transition-all duration-500"
                              style={{
                                width: `${Math.max(pct, 15)}%`,
                                backgroundColor: c.color,
                              }}
                            >
                              {c.count}
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
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Hash className="w-5 h-5 text-[#0095b6]" />
                Hashtags más populares
              </h3>
              {data?.topHashtags && data.topHashtags.length > 0 ? (
                <div className="space-y-3">
                  {data.topHashtags.map((h, index) => (
                    <div
                      key={h.hashtag}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#cceef5] text-[#0095b6] flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-sm font-semibold text-gray-800 group-hover:text-[#0095b6] transition">
                          #{h.hashtag}
                        </span>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-white text-gray-500 rounded-full border border-gray-100 shadow-sm">
                        {h.count} {h.count === 1 ? 'uso' : 'usos'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-sm text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  No se encontraron hashtags en las publicaciones de este período
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#0095b6]" />
                Horarios de publicación preferidos
              </h3>
              {data?.postsByHour && data.postsByHour.some((h) => h.count > 0) ? (
                <div className="space-y-4">
                  {data.postsByHour.map((h) => {
                    const pct = (h.count / maxHourCount) * 100
                    return (
                      <div key={h.label} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-medium text-gray-500">
                          <span>{h.label}</span>
                          <span className="text-gray-900 font-bold">{h.count} {h.count === 1 ? 'post' : 'posts'}</span>
                        </div>
                        <div className="h-3 rounded-full relative bg-gray-50 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#0095b6] to-[#cceef5]"
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
                <div className="flex items-center justify-center h-48 text-sm text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  No hay datos suficientes para calcular los horarios de publicación
                </div>
              )}
            </div>
          </div>

          {/* Tabla de Publicaciones Recientes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Listado de publicaciones ({data?.posts.length ?? 0})</h3>
            {sortedPosts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No hay publicaciones en este período</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="w-[15%] text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Red</th>
                      <th className="w-[35%] text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Título</th>
                      <th className="w-[15%] text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Estado</th>
                      <th className="w-[20%] text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Fecha</th>
                      <th className="w-[15%] text-right text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Cliente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPosts.map((post) => {
                      const statusMap: Record<string, { bg: string; label: string }> = {
                        published: { bg: 'bg-green-50 text-green-700 border-green-100', label: 'Publicada' },
                        scheduled: { bg: 'bg-blue-50 text-blue-700 border-blue-100', label: 'Programada' },
                        draft: { bg: 'bg-gray-50 text-gray-700 border-gray-100', label: 'Borrador' },
                      }
                      const st = statusMap[post.status] ?? statusMap.draft
                      return (
                        <tr key={post.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                          <td className="py-3 pr-2">
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {post.networks.map((net) => (
                                <div key={net} className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100" title={NETWORK_META[net].label}>
                                  <img
                                    src={NETWORK_META[net].icon}
                                    alt={NETWORK_META[net].label}
                                    width={14}
                                    height={14}
                                  />
                                  <span className="text-xs text-gray-600 font-medium">
                                    {NETWORK_META[net].label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 text-sm text-gray-900 truncate pr-4 font-medium">{post.title || '(Sin título)'}</td>
                          <td className="py-3">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${st.bg}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="py-3 text-sm text-gray-500 whitespace-nowrap">
                            {formatDateShort(post.scheduledAt ?? post.createdAt)}
                          </td>
                          <td className="py-3 text-right">
                            <span
                              className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
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
