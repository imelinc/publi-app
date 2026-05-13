// ============================================
// publi — Tipos globales de TypeScript
// ============================================

export type Network = 'instagram'

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed'

export type Plan = 'free' | 'pro'

export interface Client {
  id: string
  name: string
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

export interface Post {
  id: string
  clientId: string
  clientName: string
  clientColor: string
  title: string
  description: string
  networks: Network[]
  status: PostStatus
  scheduledAt: string | null
  publishedAt: string | null
  mediaUrls: string[]
  hashtags: string[]
  instagramPostId: string | null
  engagement: {
    likes: number
    comments: number
    views: number
    reach: number
  }
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  workspaceName: string
  language: 'es' | 'en'
  timezone: string
  createdAt: string
}

export interface Notification {
  id: string
  type: 'post_published' | 'post_failed' | 'post_scheduled'
  title: string
  body: string
  read: boolean
  createdAt: string
  metadata: {
    postId: string | null
    clientId: string | null
  }
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
