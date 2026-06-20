'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore, getScheduledPosts, getDraftPosts, getPostsByClient } from '@/store/use-app-store'
import { MiniCalendar } from '@/components/dashboard/MiniCalendar'
import { CheckCircle2, FileText, TrendingUp, TrendingDown, X, Sparkles, Crown, CalendarDays, Send, PenLine } from 'lucide-react'
import { NETWORK_META } from '@/lib/networks'

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)

  const DAYS_ES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

  if (d.toDateString() === tomorrow.toDateString()) {
    return `Mañana, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return `${DAYS_ES[d.getDay()].replace(/^\w/, (c) => c.toUpperCase())} ${d.getDate()}, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function isInLast7Days(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 7)
  return d >= sevenDaysAgo && d <= now
}

function isInPrevious7Days(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 7)
  const fourteenDaysAgo = new Date(now)
  fourteenDaysAgo.setDate(now.getDate() - 14)
  return d >= fourteenDaysAgo && d < sevenDaysAgo
}

export default function DashboardPage() {
  const router = useRouter()
  const { posts, events, activeWorkspaceId, clients, userProfile } = useAppStore()
  const [upgradedClientName, setUpgradedClientName] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const upgraded = params.get('upgrade_success')
    if (upgraded) {
      setUpgradedClientName(upgraded)
      router.replace('/dashboard')
    }
  }, [router])

  const activeClient = clients.find((c) => c.id === activeWorkspaceId) ?? clients[0] ?? null
  const postsForClient = getPostsByClient(posts, activeWorkspaceId)
  const eventsForClient = events.filter((e) => e.clientId === activeWorkspaceId)
  const scheduledPosts = getScheduledPosts(postsForClient)
  const draftPosts = getDraftPosts(postsForClient)
  const publishedPosts = postsForClient.filter((p) => p.status === 'published')

  const thisWeekCount = postsForClient.filter((p) => {
    const dateStr = p.scheduledAt ?? p.createdAt
    return isInLast7Days(dateStr) || isInLast7Days(p.createdAt)
  }).length

  const lastWeekCount = postsForClient.filter((p) => {
    const dateStr = p.scheduledAt ?? p.createdAt
    return isInPrevious7Days(dateStr) || isInPrevious7Days(p.createdAt)
  }).length

  const weekDiff = thisWeekCount - lastWeekCount

  const now = new Date()
  const upcomingPosts = scheduledPosts
    .filter((p) => p.scheduledAt !== null && new Date(p.scheduledAt) >= now)
    .sort((a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? ''))
    .slice(0, 5)

  const publishedThisWeek = publishedPosts.filter((p) =>
    isInLast7Days(p.scheduledAt ?? p.createdAt)
  ).length
  const publishedLastWeek = publishedPosts.filter((p) =>
    isInPrevious7Days(p.scheduledAt ?? p.createdAt)
  ).length
  const publishedDiff = publishedThisWeek - publishedLastWeek

  const todayFormatted = useMemo(() => {
    const d = new Date()
    return d.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }, [])

  const futureScheduled = scheduledPosts.filter(
    (p) => p.scheduledAt !== null && new Date(p.scheduledAt) > now
  ).length

  // publishedAt ahora vive en post_publications: tomamos el más temprano
  // (cuándo se publicó por primera vez en cualquier red) o caemos a createdAt.
  const getPublishedAt = (p: typeof posts[number]): string => {
    const dates = (p.publications ?? [])
      .map((pub) => pub.publishedAt)
      .filter((d): d is string => d !== null)
    if (dates.length === 0) return p.createdAt
    return dates.reduce((a, b) => (a < b ? a : b))
  }

  const recentPublished = postsForClient
    .filter((p) => p.status === 'published')
    .sort((a, b) => getPublishedAt(b).localeCompare(getPublishedAt(a)))
    .slice(0, 4)

  const recentDrafts = postsForClient
    .filter((p) => p.status === 'draft')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4)

  const activityItems = [
    ...recentPublished.map((p) => ({
      id: p.id,
      clientName: p.clientName,
      text: `Post "${p.title}" publicado exitosamente.`,
      timestamp: getPublishedAt(p),
      type: 'post_published' as const,
    })),
    ...recentDrafts.map((p) => ({
      id: `draft-${p.id}`,
      clientName: p.clientName,
      text: `Borrador "${p.title}" guardado.`,
      timestamp: p.createdAt,
      type: 'draft_saved' as const,
    })),
  ]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 6)

  function formatRelative(timestamp: string): string {
    const n = new Date()
    const d = new Date(timestamp)
    const diffMs = n.getTime() - d.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return 'hace un momento'
    if (diffHours < 24) return `hace ${diffHours}h`
    if (diffDays === 1) return 'ayer'
    if (diffDays < 7) return `hace ${diffDays} días`
    if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} semanas`
    return `hace ${Math.floor(diffDays / 30)} meses`
  }

  const kpiCards = [
    {
      label: 'Publicaciones esta semana',
      value: thisWeekCount,
      icon: CalendarDays,
      iconColor: '#0095b6',
      iconBg: '#0095b614',
      diff: weekDiff,
      diffLabel: 'vs semana pasada',
    },
    {
      label: 'Programadas',
      value: scheduledPosts.length,
      icon: Send,
      iconColor: '#8b5cf6',
      iconBg: '#8b5cf614',
      subtext: `${futureScheduled} pendientes`,
    },
    {
      label: 'Borradores',
      value: draftPosts.length,
      icon: PenLine,
      iconColor: '#f59e0b',
      iconBg: '#f59e0b14',
    },
    {
      label: 'Publicadas',
      value: publishedPosts.length,
      icon: CheckCircle2,
      iconColor: '#10b981',
      iconBg: '#10b98114',
      diff: publishedDiff,
      diffLabel: 'vs semana pasada',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Buen día,{' '}
          <span className="gradient-text">
            {userProfile?.name?.split(' ')[0] ?? '…'}
          </span>{' '}
          👋
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {activeClient?.name ?? 'Todos'} · {todayFormatted}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mt-4">
        {kpiCards.map((kpi) => {
          const KpiIcon = kpi.icon
          return (
            <div key={kpi.label} className="premium-card p-5 relative overflow-hidden">
              {/* Decorative icon */}
              <div
                className="absolute -right-2 -top-2 w-16 h-16 rounded-full flex items-center justify-center opacity-[0.07]"
              >
                <KpiIcon className="w-12 h-12" style={{ color: kpi.iconColor }} />
              </div>

              <div className="flex items-center gap-2.5 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: kpi.iconBg }}
                >
                  <KpiIcon className="w-4 h-4" style={{ color: kpi.iconColor }} />
                </div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  {kpi.label}
                </p>
              </div>

              <p className="text-3xl font-bold text-gray-900 mt-1">{kpi.value}</p>

              <div className="flex items-center gap-1 text-xs mt-1.5 min-h-[18px]">
                {kpi.diff !== undefined && kpi.diff > 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-600">↑ +{kpi.diff} {kpi.diffLabel}</span>
                  </>
                ) : kpi.diff !== undefined && kpi.diff < 0 ? (
                  <>
                    <TrendingDown className="w-3 h-3 text-red-500" />
                    <span className="text-red-500">↓ {kpi.diff} {kpi.diffLabel}</span>
                  </>
                ) : kpi.diff !== undefined ? (
                  <span className="text-gray-400">Igual que la semana pasada</span>
                ) : kpi.subtext ? (
                  <span className="text-gray-400">{kpi.subtext}</span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      {/* Calendar + Upcoming */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <MiniCalendar posts={postsForClient} events={eventsForClient} />
        </div>

        <div className="premium-card p-5">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Próximas</h3>
            <button
              onClick={() => router.push('/calendario')}
              className="text-sm text-primary border-0 bg-transparent hover:text-primary/80 cursor-pointer transition-colors"
            >
              Ver calendario
            </button>
          </div>

          {upcomingPosts.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No hay publicaciones programadas
            </p>
          ) : (
            <div className="mt-3">
              {upcomingPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex gap-3 items-start py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-semibold flex-shrink-0"
                    style={{ backgroundColor: post.clientColor }}
                  >
                    {post.clientName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {post.title}
                    </p>
                    <div className="flex gap-1 items-center mt-1">
                      {post.networks.map((net) => {
                        const meta = NETWORK_META[net]
                        return (
                          <span key={net} className="flex gap-0.5 items-center text-xs text-gray-400">
                            <img src={meta.icon} alt={meta.label} width={12} height={12} />
                            {meta.label}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 text-right">
                    {post.scheduledAt ? formatDateShort(post.scheduledAt) : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="premium-card p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Actividad reciente</h3>
        {activityItems.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Sin actividad reciente</p>
        ) : (
          activityItems.map((activity) => {
            const iconMap = {
              post_published: (
                <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
              ),
              draft_saved: (
                <div className="w-7 h-7 rounded-full bg-primary-light/40 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                </div>
              ),
            }

            return (
              <div
                key={activity.id}
                className="flex gap-3 items-start py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="mt-0.5">{iconMap[activity.type]}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900">{activity.clientName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{activity.text}</p>
                </div>
                <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                  {formatRelative(activity.timestamp)}
                </span>
              </div>
            )
          })
        )}
      </div>

      {upgradedClientName && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-gray-100 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Top gradient line */}
            <div className="h-1.5 bg-gradient-to-r from-primary to-accent absolute top-0 inset-x-0" />
            
            {/* Close button */}
            <button
              onClick={() => setUpgradedClientName(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-50 rounded-full transition-all cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4 pt-2">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary-light/60 flex items-center justify-center animate-bounce">
                  <Crown className="w-9 h-9 text-primary" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-accent animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900 leading-snug">
                  ¡Felicitaciones! 🎉
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  El cliente <strong className="text-gray-900 font-semibold">{upgradedClientName}</strong> ahora es <strong className="text-primary font-bold">Pro</strong>.
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Ya tienen acceso a todas las funcionalidades premium de publi: Asistente de IA (Copi chat, sugerencia de copys y hashtags), Editor de fotos profesional, Generación de imágenes y sugerencias inteligentes de horarios óptimos.
                </p>
              </div>

              <button
                onClick={() => setUpgradedClientName(null)}
                className="w-full mt-4 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md cursor-pointer"
              >
                ¡Excelente, a trabajar!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
