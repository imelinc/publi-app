'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore, getScheduledPosts, getDraftPosts, getPostsByWorkspace } from '@/store/use-app-store'
import { WORKSPACES, POSTS, ACTIVITY_FEED } from '@/lib/mock-data'
import { MiniCalendar } from '@/components/dashboard/MiniCalendar'
import { CheckCircle2, FileText, UserPlus, TrendingUp, TrendingDown } from 'lucide-react'

const DAYS_ES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)

  if (d.toDateString() === tomorrow.toDateString()) {
    return `Mañana, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return `${DAYS_ES[d.getDay()].replace(/^\w/, (c) => c.toUpperCase())} ${d.getDate()}, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function formatRelative(timestamp: string): string {
  const now = new Date()
  const d = new Date(timestamp)
  const diffMs = now.getTime() - d.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) return 'hace un momento'
  if (diffHours < 24) return `hace ${diffHours}h`
  if (diffDays === 1) return 'ayer'
  if (diffDays < 7) return `hace ${diffDays} días`
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} semanas`
  return `hace ${Math.floor(diffDays / 30)} meses`
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
  const { posts, activeWorkspaceId } = useAppStore()

  const activeWorkspace = WORKSPACES.find((w) => w.id === activeWorkspaceId)
  const postsForWorkspace = getPostsByWorkspace(posts, activeWorkspaceId)
  const scheduledPosts = getScheduledPosts(postsForWorkspace)
  const draftPosts = getDraftPosts(postsForWorkspace)
  const publishedPosts = postsForWorkspace.filter((p) => p.status === 'published')

  const thisWeekCount = postsForWorkspace.filter((p) => {
    const dateStr = p.scheduledAt ?? p.createdAt
    return isInLast7Days(dateStr) || isInLast7Days(p.createdAt)
  }).length

  const lastWeekCount = postsForWorkspace.filter((p) => {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Buen día, Nacho 👋</h1>
        <p className="text-sm text-gray-500 mt-1">
          {activeWorkspace?.name ?? 'Todos'} · {todayFormatted}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Publicaciones esta semana
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{thisWeekCount}</p>
          <div className="flex items-center gap-1 text-xs mt-1">
            {weekDiff > 0 ? (
              <>
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-green-600">↑ +{weekDiff} vs semana pasada</span>
              </>
            ) : weekDiff < 0 ? (
              <>
                <TrendingDown className="w-3 h-3 text-red-500" />
                <span className="text-red-600">↓ {weekDiff} vs semana pasada</span>
              </>
            ) : (
              <span className="text-gray-400">Igual que la semana pasada</span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Programadas
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{scheduledPosts.length}</p>
          <div className="flex items-center gap-1 text-xs mt-1">
            <span className="text-gray-400">{futureScheduled} pendientes</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Borradores
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{draftPosts.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Publicadas
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{publishedPosts.length}</p>
          <div className="flex items-center gap-1 text-xs mt-1">
            {publishedDiff > 0 ? (
              <>
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-green-600">↑ +{publishedDiff} vs semana pasada</span>
              </>
            ) : publishedDiff < 0 ? (
              <>
                <TrendingDown className="w-3 h-3 text-red-500" />
                <span className="text-red-600">↓ {publishedDiff} vs semana pasada</span>
              </>
            ) : (
              <span className="text-gray-400">Igual que la semana pasada</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <MiniCalendar posts={postsForWorkspace} />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Próximas</h3>
            <button
              onClick={() => router.push('/calendario')}
              className="text-sm text-[#0095b6] border-0 bg-transparent hover:text-[#0095b6] cursor-pointer"
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
              {upcomingPosts.map((post) => {
                const ws = WORKSPACES.find((w) => w.id === post.workspaceId)
                return (
                  <div
                    key={post.id}
                    className="flex gap-3 items-start py-3 border-b border-gray-50 last:border-0"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-semibold flex-shrink-0"
                      style={{ backgroundColor: ws?.color ?? '#0095b6' }}
                    >
                      {ws?.initials ?? '??'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                        {post.title}
                      </p>
                      <div className="flex gap-1 items-center mt-1">
                        {post.networks.map((net) => (
                          <span key={net} className="flex gap-0.5 items-center text-xs text-gray-400">
                            <img
                              src={`/icons/${net}.svg`}
                              alt={net}
                              width={12}
                              height={12}
                            />
                            {net.charAt(0).toUpperCase() + net.slice(1)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 text-right">
                      {post.scheduledAt ? formatDateShort(post.scheduledAt) : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Actividad reciente</h3>
        {ACTIVITY_FEED.slice(0, 6).map((activity) => {
          const ws = WORKSPACES.find((w) => w.id === activity.workspaceId)
          const iconMap = {
            post_published: <CheckCircle2 className="w-4 h-4 text-green-500" />,
            draft_saved: <FileText className="w-4 h-4 text-[#0095b6]" />,
            client_added: <UserPlus className="w-4 h-4 text-[#ffb703]" />,
          }

          return (
            <div
              key={activity.id}
              className="flex gap-3 items-start py-3 border-b border-gray-50 last:border-0"
            >
              <div className="flex-shrink-0 mt-0.5">{iconMap[activity.type]}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900">{ws?.name ?? ''}</p>
                <p className="text-xs text-gray-500 mt-0.5">{activity.text}</p>
              </div>
              <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                {formatRelative(activity.timestamp)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}