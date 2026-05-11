'use client'

import { useState, useMemo } from 'react'
import { useAppStore, getPostsByWorkspace } from '@/store/use-app-store'
import { WORKSPACES, POSTS } from '@/lib/mock-data'
import type { SocialNetwork, Post } from '@/lib/mock-data'
import { StatsChart } from '@/components/dashboard/StatsChart'
import { Filter, TrendingUp } from 'lucide-react'

const NETWORK_COLORS: Record<SocialNetwork, string> = {
  instagram: '#E1306C',
  facebook: '#1877F2',
  tiktok: '#111111',
  linkedin: '#0A66C2',
  twitter: '#1DA1F2',
  youtube: '#FF0000',
  threads: '#111111',
}

const NETWORK_LABELS: Record<SocialNetwork, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  twitter: 'Twitter',
  youtube: 'YouTube',
  threads: 'Threads',
}

function getEngagementRate(networkFilter: SocialNetwork | 'all'): number {
  const rates: Record<SocialNetwork, number> = {
    instagram: 4.2,
    facebook: 2.1,
    tiktok: 8.5,
    linkedin: 1.8,
    twitter: 3.4,
    youtube: 2.9,
    threads: 1.5,
  }
  if (networkFilter === 'all') {
    return Object.values(rates).reduce((a, b) => a + b, 0) / Object.keys(rates).length
  }
  return rates[networkFilter] ?? 0
}

function isInPeriod(dateStr: string, period: '7d' | '30d' | '3m'): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const start = new Date(now)
  start.setDate(now.getDate() - daysBack)
  return d >= start && d <= now
}

function isInPreviousPeriod(dateStr: string, period: '7d' | '30d' | '3m'): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const startPrev = new Date(now)
  startPrev.setDate(now.getDate() - daysBack * 2)
  const endPrev = new Date(now)
  endPrev.setDate(now.getDate() - daysBack)
  return d >= startPrev && d < endPrev
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export default function MetricasPage() {
  const { posts, activeWorkspaceId } = useAppStore()
  const [clientFilter, setClientFilter] = useState<string>(activeWorkspaceId)
  const [periodFilter, setPeriodFilter] = useState<'7d' | '30d' | '3m'>('30d')
  const [networkFilter, setNetworkFilter] = useState<SocialNetwork | 'all'>('all')

  const filteredPosts = useMemo(() => {
    let result = clientFilter !== 'all'
      ? getPostsByWorkspace(posts, clientFilter)
      : posts

    result = result.filter((p) => {
      const dateStr = p.scheduledAt ?? p.createdAt
      return isInPeriod(dateStr, periodFilter) || isInPeriod(p.createdAt, periodFilter)
    })

    if (networkFilter !== 'all') {
      result = result.filter((p) => p.networks.includes(networkFilter))
    }

    return result
  }, [posts, clientFilter, periodFilter, networkFilter])

  const previousPeriodCount = useMemo(() => {
    let base = clientFilter !== 'all'
      ? getPostsByWorkspace(posts, clientFilter)
      : posts
    base = base.filter((p) => {
      const dateStr = p.scheduledAt ?? p.createdAt
      return isInPreviousPeriod(dateStr, periodFilter) || isInPreviousPeriod(p.createdAt, periodFilter)
    })
    if (networkFilter !== 'all') {
      base = base.filter((p) => p.networks.includes(networkFilter))
    }
    return base.length
  }, [posts, clientFilter, periodFilter, networkFilter])

  const totalDiff = filteredPosts.length - previousPeriodCount

  const allNetworks: SocialNetwork[] = ['instagram', 'facebook', 'tiktok', 'linkedin', 'twitter', 'youtube', 'threads']

  const networkCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const net of allNetworks) {
      counts[net] = filteredPosts.filter((p) => p.networks.includes(net)).length
    }
    return counts
  }, [filteredPosts])

  const maxNetworkCount = Math.max(...Object.values(networkCounts), 1)

  const engagementRate = getEngagementRate(networkFilter)

  const publishedCount = filteredPosts.filter((p) => p.status === 'published').length
  const scheduledCount = filteredPosts.filter((p) => p.status === 'scheduled').length

  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      const dateA = a.scheduledAt ?? a.createdAt
      const dateB = b.scheduledAt ?? b.createdAt
      return dateB.localeCompare(dateA)
    }).slice(0, 10)
  }, [filteredPosts])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Estadísticas</h1>
        <p className="text-sm text-gray-500 mt-1">Resumen de publicaciones y actividad</p>

        <div className="flex gap-3 mt-4">
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-[#0095b6] transition cursor-pointer"
          >
            <option value="all">Todos los clientes</option>
            {WORKSPACES.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>

          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as '7d' | '30d' | '3m')}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-[#0095b6] transition cursor-pointer"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="3m">Últimos 3 meses</option>
          </select>

          <select
            value={networkFilter}
            onChange={(e) => setNetworkFilter(e.target.value as SocialNetwork | 'all')}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-[#0095b6] transition cursor-pointer"
          >
            <option value="all">Todas</option>
            {allNetworks.map((net) => (
              <option key={net} value={net}>{NETWORK_LABELS[net]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Total de publicaciones
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{filteredPosts.length}</p>
          {totalDiff !== 0 && (
            <div className="flex items-center gap-1 text-xs mt-1">
              {totalDiff > 0 ? (
                <>
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-green-600">↑ +{totalDiff} vs periodo anterior</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />
                  <span className="text-red-600">↓ {totalDiff} vs periodo anterior</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Publicadas
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{publishedCount}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Programadas
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{scheduledCount}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Engagement promedio
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{engagementRate.toFixed(2)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Publicaciones por semana</h3>
          <StatsChart posts={filteredPosts} period={periodFilter} />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Distribución por red</h3>
          <div className="space-y-3">
            {allNetworks.map((net) => {
              const count = networkCounts[net]
              if (count === 0) return null
              const pct = (count / maxNetworkCount) * 100
              return (
                <div key={net} className="flex items-center gap-2">
                  <div className="w-20 flex items-center gap-1.5">
                    <img
                      src={`/icons/${net}-color.svg`}
                      alt={net}
                      width={14}
                      height={14}
                    />
                    <span className="text-xs font-medium text-gray-700">
                      {NETWORK_LABELS[net]}
                    </span>
                  </div>
                  <div className="flex-1 h-5 rounded-md relative" style={{ backgroundColor: `${NETWORK_COLORS[net]}15` }}>
                    <div
                      className="h-full rounded-md flex items-center justify-center text-xs text-white font-semibold"
                      style={{
                        width: `${Math.max(pct, 20)}%`,
                        backgroundColor: NETWORK_COLORS[net],
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
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Publicaciones</h3>
        {sortedPosts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No hay publicaciones</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide pb-3">Red</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide pb-3">Título</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide pb-3">Estado</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide pb-3">Fecha</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide pb-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {sortedPosts.map((post) => {
                  const statusMap: Record<string, { bg: string; text: string; label: string }> = {
                    published: { bg: 'bg-green-100', text: 'text-green-700', label: 'Publicada' },
                    scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Programada' },
                    draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Borrador' },
                  }
                  const st = statusMap[post.status] ?? statusMap.draft
                  const primaryNetwork = post.networks[0]

                  return (
                    <tr key={post.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={`/icons/${primaryNetwork}.svg`}
                            alt={primaryNetwork}
                            width={16}
                            height={16}
                          />
                          <span className="text-sm text-gray-700">
                            {primaryNetwork ? NETWORK_LABELS[primaryNetwork as SocialNetwork] : ''}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-sm text-gray-900 line-clamp-1 max-w-[200px]">
                        {post.title}
                      </td>
                      <td className="py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${st.bg} ${st.text}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-500">
                        {formatDateShort(post.scheduledAt ?? post.createdAt)}
                      </td>
                      <td className="py-3 text-right">
                        <button className="text-sm text-[#0095b6] border-0 bg-transparent cursor-pointer hover:underline">
                          Ver
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}