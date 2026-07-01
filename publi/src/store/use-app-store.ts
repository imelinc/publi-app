import { create } from 'zustand'
import type {
  Client,
  Post,
  CalendarEvent,
  Plan,
  Network,
  PostStatus,
  EventType,
  SocialAccount,
  UserProfile,
  Notification,
} from '@/types'

export type { UserProfile }

interface AppState {
  activeWorkspaceId: string
  setActiveWorkspace: (id: string) => void

  // ─── Navigation guard ──────────────────────────────────────────────────────────
  /** Si está en true, otros componentes (ej. Sidebar) deben confirmar antes de navegar */
  hasUnsavedChanges: boolean
  setHasUnsavedChanges: (v: boolean) => void

  // ─── User profile ──────────────────────────────────────────────────────────────
  userProfile: UserProfile | null
  fetchUserProfile: () => Promise<void>

  clients: Client[]
  clientsLoading: boolean
  fetchClients: () => Promise<void>
  addClient: (data: { name: string; description?: string; color: string }) => Promise<Client>
  updateClient: (id: string, data: { name?: string; description?: string; color?: string }) => Promise<void>
  deleteClient: (id: string) => Promise<void>

  // ─── Social accounts (cuentas de redes sociales por cliente) ────────────────
  fetchSocialAccounts: (clientId: string) => Promise<SocialAccount[]>
  addSocialAccount: (
    clientId: string,
    network: Network,
    username: string,
    password: string
  ) => Promise<SocialAccount>
  removeSocialAccount: (
    clientId: string,
    accountId: string,
    network: Network
  ) => Promise<void>

  posts: Post[]
  postsLoading: boolean
  fetchPosts: () => Promise<void>
  addPost: (data: {
    clientId: string
    title: string
    description: string
    networks: Network[]
    status: PostStatus
    scheduledAt: string | null
    mediaUrls: string[]
    hashtags: string[]
    contentFormat?: 'feed' | 'story'
    customDescriptions?: Record<Network, string> | null
  }) => Promise<Post>
  updatePost: (id: string, updates: Partial<Post>) => void
  updatePostRemote: (
    id: string,
    updates: {
      title?: string
      description?: string
      hashtags?: string[]
      mediaUrls?: string[]
      networks?: Network[]
      status?: 'draft' | 'scheduled' | 'published'
      scheduledAt?: string | null
      contentFormat?: 'feed' | 'story'
      customDescriptions?: Record<Network, string> | null
    }
  ) => Promise<Post>
  deletePost: (id: string) => Promise<void>
  requestApproval: (postId: string) => Promise<{ approvalUrl: string }>
  publishPostNow: (
    postId: string
  ) => Promise<{
    status: 'published' | 'failed'
    results: { network: string; status: string; error?: string }[]
  }>
  uploadMedia: (file: File) => Promise<string>

  events: CalendarEvent[]
  eventsLoading: boolean
  fetchEvents: () => Promise<void>
  addEvent: (event: {
    clientId: string
    title: string
    description: string
    type: EventType
    color: string
    date: string
    endAt?: string | null
    isAllDay?: boolean
  }) => Promise<void>
  deleteEvent: (id: string) => Promise<void>

  // ─── Notifications ──────────────────────────────────────────────────────────
  notifications: Notification[]
  notificationsLoading: boolean
  unreadCount: number
  fetchNotifications: () => Promise<void>
  markAllRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  activeWorkspaceId: '',
  setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

  hasUnsavedChanges: false,
  setHasUnsavedChanges: (v) => set({ hasUnsavedChanges: v }),

  // ─── User profile ──────────────────────────────────────────────────────────────

  userProfile: null,

  fetchUserProfile: async () => {
    const res = await fetch('/api/users/me')
    if (!res.ok) return
    const json = await res.json()
    set({ userProfile: json as UserProfile })
  },

  // ─── Clients ──────────────────────────────────────────────────────────────────

  clients: [],
  clientsLoading: false,

  fetchClients: async () => {
    set({ clientsLoading: true })
    try {
      const res = await fetch('/api/clients')
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Error al cargar clientes')
      }
      const json = await res.json()
      set({ clients: json.data })
    } finally {
      set({ clientsLoading: false })
    }
  },

  addClient: async (data) => {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error(json.error || 'Error al crear cliente')
    }
    const json = await res.json()
    const client: Client = json.data
    set((state) => ({ clients: [client, ...state.clients] }))
    return client
  },

  updateClient: async (id, data) => {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error(json.error || 'Error al actualizar cliente')
    }
    const json = await res.json()
    set((state) => ({
      clients: state.clients.map((c) =>
        c.id === id ? { ...c, ...json.data } : c
      ),
    }))
  },

  deleteClient: async (id) => {
    const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error(json.error || 'Error al eliminar cliente')
    }
    set((state) => ({ clients: state.clients.filter((c) => c.id !== id) }))
  },

  // ─── Social accounts ──────────────────────────────────────────────────────────

  fetchSocialAccounts: async (clientId) => {
    const res = await fetch(`/api/clients/${clientId}/social-accounts`)
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error(json.error || 'Error al cargar cuentas conectadas')
    }
    const json = await res.json()
    return json.data as SocialAccount[]
  },

  addSocialAccount: async (clientId, network, username, password) => {
    const res = await fetch(`/api/clients/${clientId}/social-accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ network, username, password }),
    })
    const json = await res.json()
    if (!res.ok) {
      throw new Error(json.error || 'Error al conectar la red')
    }
    const account: SocialAccount = json.data
    // Optimistic update: agregar la red a connectedNetworks del cliente
    set((state) => ({
      clients: state.clients.map((c) =>
        c.id === clientId
          ? {
              ...c,
              connectedNetworks: c.connectedNetworks.includes(network)
                ? c.connectedNetworks
                : [...c.connectedNetworks, network],
            }
          : c
      ),
    }))
    return account
  },

  removeSocialAccount: async (clientId, accountId, network) => {
    const res = await fetch(
      `/api/clients/${clientId}/social-accounts/${accountId}`,
      { method: 'DELETE' }
    )
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error(json.error || 'Error al desconectar la red')
    }
    // Sacar la red de connectedNetworks
    set((state) => ({
      clients: state.clients.map((c) =>
        c.id === clientId
          ? {
              ...c,
              connectedNetworks: c.connectedNetworks.filter((n) => n !== network),
            }
          : c
      ),
    }))
  },

  // ─── Posts ────────────────────────────────────────────────────────────────────

  posts: [],
  postsLoading: false,

  fetchPosts: async () => {
    set({ postsLoading: true })
    try {
      const res = await fetch('/api/posts')
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Error al cargar publicaciones')
      }
      const json = await res.json()
      set({ posts: json.data })
    } finally {
      set({ postsLoading: false })
    }
  },

  addPost: async (data) => {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error(json.error || 'Error al crear publicación')
    }
    const json = await res.json()
    const post: Post = json.data
    set((state) => ({ posts: [post, ...state.posts] }))
    return post
  },

  updatePost: (id, updates) =>
    set((state) => ({
      posts: state.posts.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  updatePostRemote: async (id, updates) => {
    const res = await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Error al actualizar publicación')
    const updated: Post = json.data
    set((state) => ({
      posts: state.posts.map((p) => (p.id === id ? { ...p, ...updated } : p)),
    }))
    return updated
  },

  uploadMedia: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/posts/media', { method: 'POST', body: formData })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Error al subir la imagen')
    return json.url as string
  },

  deletePost: async (id) => {
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error(json.error || 'Error al eliminar publicación')
    }
    set((state) => ({ posts: state.posts.filter((p) => p.id !== id) }))
  },

  publishPostNow: async (postId) => {
    const res = await fetch(`/api/posts/${postId}/publish`, { method: 'POST' })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.error || 'Error al publicar')
    // Reflejar el nuevo estado del post en el store (el realtime/refetch lo
    // confirma, pero actualizamos local para feedback inmediato).
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, status: json.status } : p
      ),
    }))
    return json as {
      status: 'published' | 'failed'
      results: { network: string; status: string; error?: string }[]
    }
  },

  requestApproval: async (postId) => {
    const res = await fetch(`/api/posts/${postId}/request-approval`, {
      method: 'POST',
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Error al generar link de aprobación')
    // Actualizar el post en el estado local
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, status: 'pending_approval' } : p
      ),
    }))
    return { approvalUrl: json.data.approvalUrl }
  },

  // ─── Calendar Events ──────────────────────────────────────────────────────────

  events: [],
  eventsLoading: false,

  fetchEvents: async () => {
    set({ eventsLoading: true })
    try {
      const res = await fetch('/api/calendar/events')
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Error al cargar eventos')
      }
      const json = await res.json()
      set({ events: json.data })
    } finally {
      set({ eventsLoading: false })
    }
  },

  addEvent: async (event) => {
    try {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      })
      const json = await res.json()
      const saved: CalendarEvent = json.data
      set((state) => ({ events: [...state.events, saved] }))
    } catch {
      const fallback: CalendarEvent = {
        ...event,
        id: crypto.randomUUID(),
        endAt: event.endAt ?? null,
        isAllDay: event.isAllDay ?? true,
      }
      set((state) => ({ events: [...state.events, fallback] }))
    }
  },

  deleteEvent: async (id) => {
    const res = await fetch(`/api/calendar/events/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error(json.error || 'Error al eliminar evento')
    }
    set((state) => ({ events: state.events.filter((e) => e.id !== id) }))
  },

  // ─── Notifications ──────────────────────────────────────────────────────────

  notifications: [],
  notificationsLoading: false,
  unreadCount: 0,

  fetchNotifications: async () => {
    set({ notificationsLoading: true })
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const json = await res.json()
      const notifs = (json.data ?? []) as Notification[]
      set({
        notifications: notifs,
        unreadCount: notifs.filter((n) => !n.read).length,
      })
    } finally {
      set({ notificationsLoading: false })
    }
  },

  markAllRead: async () => {
    // Optimistic update.
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }))
    await fetch('/api/notifications', { method: 'PATCH' }).catch(() => {})
  },

  deleteNotification: async (id) => {
    // Optimistic update.
    set((state) => {
      const updated = state.notifications.filter((n) => n.id !== id)
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      }
    })
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' }).catch(() => {})
  },
}))

// ─── Utility functions ────────────────────────────────────────────────────────

export function getPostsByClient(posts: Post[], clientId: string): Post[] {
  return posts.filter((p) => p.clientId === clientId)
}

export function getScheduledPosts(posts: Post[]): Post[] {
  return posts.filter((p) => p.status === 'scheduled')
}

export function getDraftPosts(posts: Post[]): Post[] {
  return posts.filter((p) => p.status === 'draft')
}

export function getPostsForDate(posts: Post[], date: Date): Post[] {
  if (!posts || !Array.isArray(posts)) return []
  const dateStr = date.toISOString().split('T')[0]
  return posts.filter((p) => {
    if (!p) return false
    const postDate = p.scheduledAt ?? p.publishedAt
    return typeof postDate === 'string' && postDate.startsWith(dateStr)
  })
}
