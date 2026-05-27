import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import type { Network, PostStatus } from '@/types'

interface RouteParams {
  params: Promise<{ postId: string }>
}

// ─── Utilidad: mapear row de DB → Post ───────────────────────────────────────

function mapPost(
  p: Record<string, unknown>,
  clientName: string,
  clientColor: string
) {
  return {
    id: p.id,
    clientId: p.client_id,
    clientName,
    clientColor,
    title: (p.title as string) ?? '',
    description: (p.description as string) ?? '',
    networks: (p.networks as Network[]) ?? [],
    status: (p.status as PostStatus) ?? 'draft',
    scheduledAt: (p.scheduled_at as string) ?? null,
    publishedAt: (p.published_at as string) ?? null,
    mediaUrls: (p.media_urls as string[]) ?? [],
    hashtags: (p.hashtags as string[]) ?? [],
    instagramPostId: (p.instagram_post_id as string) ?? null,
    engagement: {
      likes: (p.likes as number) ?? 0,
      comments: (p.comments as number) ?? 0,
      views: (p.views as number) ?? 0,
      reach: (p.reach as number) ?? 0,
    },
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }
}

// ─── GET /api/posts/:postId ───────────────────────────────────────────────────

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { postId } = await params

  const { data: post, error: pErr } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single()

  if (pErr || !post) {
    return Response.json({ error: 'Post no encontrado' }, { status: 404 })
  }

  // Verificar que pertenece al usuario via client
  const { data: client, error: cErr } = await supabase
    .from('clients')
    .select('id, name, color')
    .eq('id', post.client_id)
    .eq('user_id', user.id)
    .single()

  if (cErr || !client) {
    return Response.json({ error: 'Post no encontrado' }, { status: 404 })
  }

  return Response.json({ data: mapPost(post, client.name, client.color) })
}

// ─── PATCH /api/posts/:postId ─────────────────────────────────────────────────

interface UpdatePostBody {
  title?: string
  description?: string
  hashtags?: string[]
  mediaUrls?: string[]
  networks?: Network[]
  status?: 'draft' | 'scheduled' | 'published'
  scheduledAt?: string | null
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { postId } = await params

  // Buscar post
  const { data: post, error: pErr } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single()

  if (pErr || !post) {
    return Response.json({ error: 'Post no encontrado' }, { status: 404 })
  }

  // Verificar ownership
  const { data: client, error: cErr } = await supabase
    .from('clients')
    .select('id, name, color')
    .eq('id', post.client_id)
    .eq('user_id', user.id)
    .single()

  if (cErr || !client) {
    return Response.json({ error: 'Post no encontrado' }, { status: 404 })
  }

  // Solo se pueden editar posts en draft, scheduled, pending_approval o approved
  // (no se pueden editar published o failed)
  const editable = ['draft', 'scheduled', 'pending_approval', 'approved']
  if (!editable.includes(post.status as string)) {
    return Response.json(
      { error: 'Esta publicación ya no se puede editar' },
      { status: 409 }
    )
  }

  let body: UpdatePostBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Body inválido' }, { status: 400 })
  }

  // Validar status si se envía
  if (body.status && !['draft', 'scheduled', 'published'].includes(body.status)) {
    return Response.json(
      { error: 'El estado debe ser "draft", "scheduled" o "published"' },
      { status: 400 }
    )
  }

  // Si se cambia a scheduled, scheduledAt es obligatorio
  if (body.status === 'scheduled' && body.scheduledAt === undefined && !post.scheduled_at) {
    return Response.json(
      { error: 'scheduledAt es requerido para publicaciones programadas' },
      { status: 400 }
    )
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.title !== undefined) updates.title = body.title
  if (body.description !== undefined) updates.description = body.description
  if (body.hashtags !== undefined) updates.hashtags = body.hashtags
  if (body.mediaUrls !== undefined) updates.media_urls = body.mediaUrls
  if (body.networks !== undefined) updates.networks = body.networks
  if (body.status !== undefined) updates.status = body.status
  if (body.scheduledAt !== undefined) updates.scheduled_at = body.scheduledAt
  // Si pasa a 'published' y no se pasó scheduled_at, marcar como publicado ahora
  if (body.status === 'published' && body.scheduledAt === undefined && !post.scheduled_at) {
    updates.scheduled_at = new Date().toISOString()
  }

  const { data: updated, error: updateErr } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', postId)
    .select()
    .single()

  if (updateErr) {
    return Response.json({ error: updateErr.message }, { status: 500 })
  }

  return Response.json({ data: mapPost(updated, client.name, client.color) })
}

// ─── DELETE /api/posts/:postId ────────────────────────────────────────────────

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { postId } = await params

  const { data: post, error: findErr } = await supabase
    .from('posts')
    .select('id, client_id')
    .eq('id', postId)
    .single()

  if (findErr || !post) {
    return Response.json({ error: 'Post no encontrado' }, { status: 404 })
  }

  const { error: ownerErr } = await supabase
    .from('clients')
    .select('id')
    .eq('id', post.client_id)
    .eq('user_id', user.id)
    .single()

  if (ownerErr) {
    return Response.json({ error: 'Post no encontrado' }, { status: 404 })
  }

  const { error: deleteErr } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)

  if (deleteErr) {
    return Response.json({ error: deleteErr.message }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}
