// ============================================
// publi — Tipos globales de TypeScript
// ============================================

export type Network =
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'x'
  | 'linkedin'
  | 'youtube'

export type PostStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'failed'

export type PublicationStatus =
  | 'pending'
  | 'published'
  | 'failed'
  | 'simulated'

export type Plan = 'free' | 'pro'

export interface Client {
  id: string
  name: string
  description: string
  color: string
  initials: string
  plan: Plan
  connectedNetworks: Network[]
  stats: {
    scheduled: number
    drafts: number
    published: number
  }
  createdAt: string
}

export interface SocialAccount {
  id: string
  clientId: string
  network: Network
  externalUserId: string
  username: string
  avatarUrl: string | null
  isSimulated: boolean
  tokenExpiresAt: string | null
  connectedAt: string
}

export interface PostPublication {
  id: string
  postId: string
  network: Network
  // Overrides (null = usa los del post base)
  description: string | null
  hashtags: string[] | null
  // Resultado
  status: PublicationStatus
  externalPostId: string | null
  publishedAt: string | null
  errorMessage: string | null
  // Métricas por red
  engagement: {
    likes: number
    comments: number
    views: number
    reach: number
  }
  metricsUpdatedAt: string | null
}

export interface Post {
  id: string
  clientId: string
  clientName: string
  clientColor: string
  title: string
  description: string
  networks: Network[]
  hashtags: string[]
  mediaUrls: string[]
  contentFormat: 'feed' | 'story'
  status: PostStatus
  scheduledAt: string | null
  publishedAt: string | null
  // Aprobación
  approvalToken: string | null
  approvedAt: string | null
  clientFeedback: string | null
  // Publicaciones por red
  publications: PostPublication[]
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  id: string
  name: string
  initials: string
  email: string
  avatarUrl: string | null
  // Campos del perfil extendido (tabla profiles — opcionales si aún no existe la fila)
  workspaceName?: string
  notifPostPublished?: boolean
  createdAt?: string
  loginCount?: number
  timeSpentCreating?: number
}

export type NotificationType =
  | 'post_published'
  | 'post_failed'
  | 'post_scheduled'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string
  read: boolean
  postId: string | null
  clientId: string | null
  createdAt: string
}

export interface AiSuggestion {
  text: string
  label: string
}

export interface WaitlistEntry {
  fullName: string
  email: string
  clientCount: '1-3' | '4-10' | '11-20' | '20+'
  currentTools: string | null
}

export type EventType = 'event' | 'deadline'

export interface CalendarEvent {
  id: string
  clientId: string
  title: string
  description: string
  type: EventType
  color: string
  /** Fecha del evento en formato ISO. Si `isAllDay=false`, también lleva la hora de inicio. */
  date: string
  /** Fecha y hora de fin (ISO). Null si `isAllDay=true` o si es un evento puntual sin duración. */
  endAt: string | null
  /** Si true, el evento abarca todo el día y no se respeta la hora. */
  isAllDay: boolean
}
