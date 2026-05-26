import type { SupabaseClient, User } from '@supabase/supabase-js'
import type {
  UserProfile,
} from '@/types'

export interface ProfileRow {
  id: string
  name: string
  workspace_name: string
  notif_post_published: boolean
  created_at: string
}

export interface PatchProfileBody {
  name?: string
  workspaceName?: string
  notifPostPublished?: boolean
}

function defaultName(user: User): string {
  const meta = user.user_metadata?.full_name
  if (typeof meta === 'string' && meta.trim()) return meta.trim()
  const email = user.email ?? ''
  const local = email.split('@')[0]
  return local || 'Usuario'
}

function computeInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  return (
    (words[0]?.[0] ?? '') + (words.length > 1 ? (words[1]?.[0] ?? '') : '')
  ).toUpperCase()
}

export function mapProfileToResponse(
  user: User,
  row: ProfileRow
): UserProfile {
  const avatarMeta = user.user_metadata?.avatar_url
  return {
    id: user.id,
    name: row.name,
    initials: computeInitials(row.name),
    email: user.email ?? '',
    avatarUrl: typeof avatarMeta === 'string' && avatarMeta ? avatarMeta : null,
    workspaceName: row.workspace_name,
    notifPostPublished: row.notif_post_published,
    createdAt: row.created_at,
  }
}

export function mapPatchBodyToDb(
  body: PatchProfileBody
): Partial<Pick<ProfileRow, 'name' | 'workspace_name' | 'notif_post_published'>> {
  const update: ReturnType<typeof mapPatchBodyToDb> = {}

  if (body.name !== undefined) {
    const trimmed = body.name.trim()
    if (trimmed) update.name = trimmed
  }
  if (body.workspaceName !== undefined) {
    update.workspace_name = body.workspaceName.trim() || 'Mi workspace'
  }
  if (body.notifPostPublished !== undefined) {
    update.notif_post_published = body.notifPostPublished
  }

  return update
}

export async function ensureProfile(
  supabase: SupabaseClient,
  user: User
): Promise<{ row: ProfileRow | null; error: string | null }> {
  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (selectError) {
    return { row: null, error: selectError.message }
  }

  if (existing) {
    return { row: existing as ProfileRow, error: null }
  }

  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      name: defaultName(user),
    })
    .select()
    .single()

  if (insertError) {
    return { row: null, error: insertError.message }
  }

  return { row: inserted as ProfileRow, error: null }
}

export async function getProfileResponse(
  supabase: SupabaseClient,
  user: User
): Promise<{ profile: UserProfile | null; error: string | null }> {
  const { row, error } = await ensureProfile(supabase, user)
  if (error || !row) {
    return { profile: null, error: error ?? 'Perfil no encontrado' }
  }
  return { profile: mapProfileToResponse(user, row), error: null }
}
