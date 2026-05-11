import { create } from 'zustand'
import {
  Post,
  CalendarEvent,
  POSTS,
  CALENDAR_EVENTS,
} from '@/lib/mock-data'

export type { Post, CalendarEvent } from '@/lib/mock-data'

interface AppState {
  activeWorkspaceId: string
  setActiveWorkspace: (id: string) => void

  posts: Post[]
  addPost: (post: Omit<Post, 'id' | 'createdAt'>) => void
  updatePost: (id: string, updates: Partial<Post>) => void
  deletePost: (id: string) => void

  events: CalendarEvent[]
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void
  deleteEvent: (id: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeWorkspaceId: 'ws-cafe-bruna',
  setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

  posts: POSTS,
  addPost: (post) =>
    set((state) => ({
      posts: [
        ...state.posts,
        {
          ...post,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        },
      ],
    })),
  updatePost: (id, updates) =>
    set((state) => ({
      posts: state.posts.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  deletePost: (id) =>
    set((state) => ({ posts: state.posts.filter((p) => p.id !== id) })),

  events: CALENDAR_EVENTS,
  addEvent: (event) =>
    set((state) => ({
      events: [
        ...state.events,
        { ...event, id: crypto.randomUUID() },
      ],
    })),
  deleteEvent: (id) =>
    set((state) => ({ events: state.events.filter((e) => e.id !== id) })),
}))

// ─── Utility functions ────────────────────────────────────────────────────────

export function getPostsByWorkspace(posts: Post[], workspaceId: string): Post[] {
  return posts.filter((p) => p.workspaceId === workspaceId)
}

export function getScheduledPosts(posts: Post[]): Post[] {
  return posts.filter((p) => p.status === 'scheduled')
}

export function getDraftPosts(posts: Post[]): Post[] {
  return posts.filter((p) => p.status === 'draft')
}

export function getPostsForDate(posts: Post[], date: Date): Post[] {
  const dateStr = date.toISOString().split('T')[0]
  return posts.filter(
    (p) => p.scheduledAt !== null && p.scheduledAt.startsWith(dateStr)
  )
}
