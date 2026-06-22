import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, workspace_name, login_count, time_spent_creating, plan')
    .eq('id', user.id)
    .single()

  const meta = user.user_metadata ?? {}
  const name: string = profile?.name ?? meta.full_name ?? meta.name ?? user.email?.split('@')[0] ?? 'Usuario'
  const workspaceName: string = profile?.workspace_name ?? 'Mi workspace'
  const loginCount: number = profile?.login_count ?? 0
  const timeSpentCreating: number = profile?.time_spent_creating ?? 0
  const plan: string = profile?.plan ?? 'free'

  const words = name.trim().split(/\s+/)
  const initials = (
    (words[0]?.[0] ?? '') + (words.length > 1 ? (words[1]?.[0] ?? '') : '')
  ).toUpperCase()

  return Response.json({
    id: user.id,
    email: user.email ?? '',
    name,
    initials,
    avatarUrl: meta.avatar_url ?? null,
    workspaceName,
    loginCount,
    timeSpentCreating,
    plan,
  })
}

interface PatchBody {
  name?: string
  workspaceName?: string
  plan?: 'free' | 'pro'
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body: PatchBody = await request.json()
  const updates: Record<string, string> = {}

  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.workspaceName !== undefined) updates.workspace_name = body.workspaceName.trim()
  if (body.plan !== undefined && (body.plan === 'free' || body.plan === 'pro')) {
    updates.plan = body.plan
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'No se enviaron campos para actualizar' }, { status: 400 })
  }

  const { data: profile, error: upsertError } = await supabase
    .from('profiles')
    .upsert({ id: user.id, ...updates })
    .select('name, workspace_name, login_count, time_spent_creating, plan')
    .single()

  if (upsertError) {
    return Response.json({ error: upsertError.message }, { status: 500 })
  }

  const meta = user.user_metadata ?? {}
  const name: string = profile?.name ?? meta.full_name ?? meta.name ?? user.email?.split('@')[0] ?? 'Usuario'
  const workspaceName: string = profile?.workspace_name ?? 'Mi workspace'
  const loginCount: number = profile?.login_count ?? 0
  const timeSpentCreating: number = profile?.time_spent_creating ?? 0
  const plan: string = profile?.plan ?? 'free'

  const words = name.trim().split(/\s+/)
  const initials = (
    (words[0]?.[0] ?? '') + (words.length > 1 ? (words[1]?.[0] ?? '') : '')
  ).toUpperCase()

  return Response.json({
    id: user.id,
    email: user.email ?? '',
    name,
    initials,
    avatarUrl: meta.avatar_url ?? null,
    workspaceName,
    loginCount,
    timeSpentCreating,
    plan,
  })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { error: deleteError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id)

  if (deleteError) {
    return Response.json({ error: deleteError.message }, { status: 500 })
  }

  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.id)
  if (authDeleteError) {
    return Response.json({ error: authDeleteError.message }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}
