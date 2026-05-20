import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import type { Network, PostStatus } from '@/types'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')
  const status = searchParams.get('status') as PostStatus | null
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
  const offset = (page - 1) * limit

  // Obtener clientes del usuario (aplicar filtro por clientId si viene)
  let clientQuery = supabase
    .from('clients')
    .select('id, name, color')
    .eq('user_id', user.id)

  if (clientId && clientId !== 'all') {
    clientQuery = clientQuery.eq('id', clientId)
  }

  const { data: clients, error: cErr } = await clientQuery

  if (cErr) return Response.json({ error: cErr.message }, { status: 500 })
  if (!clients || clients.length === 0) {
    return Response.json({ data: [], total: 0, page, limit })
  }

  const clientMap = new Map(
    clients.map((c: { id: string; name: string; color: string }) => [c.id, c])
  )
  const clientIds = clients.map((c: { id: string }) => c.id)

  // Construir query de posts con filtros
  let postsQuery = supabase
    .from('posts')
    .select('*', { count: 'exact' })
    .in('client_id', clientIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    postsQuery = postsQuery.eq('status', status)
  }

  if (from) {
    postsQuery = postsQuery.gte('scheduled_at', from)
  }

  if (to) {
    postsQuery = postsQuery.lte('scheduled_at', to)
  }

  const { data: posts, error: pErr, count } = await postsQuery

  if (pErr) return Response.json({ error: pErr.message }, { status: 500 })

  const result = (posts ?? []).map((p: Record<string, unknown>) => {
    const client = clientMap.get(p.client_id as string) as
      | { name: string; color: string }
      | undefined
    return {
      id: p.id,
      clientId: p.client_id,
      clientName: client?.name ?? '',
      clientColor: client?.color ?? '#0095b6',
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
  })

  return Response.json({ data: result, total: count ?? 0, page, limit })
}


interface CreatePostBody {
  clientId: string
  title: string
  description: string
  networks: Network[]
  status: PostStatus
  scheduledAt: string | null
  mediaUrls: string[]
  hashtags: string[]
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: CreatePostBody = await request.json()

  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('id, name, color')
    .eq('id', body.clientId)
    .eq('user_id', user.id)
    .single()

  if (clientErr || !client) {
    return Response.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  const { data: post, error: insertErr } = await supabase
    .from('posts')
    .insert({
      client_id: body.clientId,
      title: body.title,
      description: body.description,
      networks: body.networks,
      status: body.status,
      scheduled_at: body.scheduledAt,
      media_urls: body.mediaUrls,
      hashtags: body.hashtags,
    })
    .select()
    .single()

  if (insertErr) {
    return Response.json({ error: insertErr.message }, { status: 500 })
  }

  const result = {
    id: post.id,
    clientId: post.client_id,
    clientName: client.name,
    clientColor: client.color,
    title: post.title ?? '',
    description: post.description ?? '',
    networks: post.networks ?? [],
    status: post.status ?? 'draft',
    scheduledAt: post.scheduled_at ?? null,
    publishedAt: post.published_at ?? null,
    mediaUrls: post.media_urls ?? [],
    hashtags: post.hashtags ?? [],
    instagramPostId: post.instagram_post_id ?? null,
    engagement: { likes: 0, comments: 0, views: 0, reach: 0 },
    createdAt: post.created_at,
    updatedAt: post.updated_at,
  }

  return Response.json({ data: result }, { status: 201 })
}
