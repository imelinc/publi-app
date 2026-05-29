import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import type {
  Network,
  PostStatus,
  PostPublication,
  PublicationStatus,
} from '@/types'
import { simulateEngagement } from '@/lib/simulation'
import { resolveBaseUrl } from '@/lib/url'
import { shouldEnqueueNow, enqueuePostPublish } from '@/lib/qstash'

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface PublicationRow {
  id: string
  post_id: string
  network: string
  description: string | null
  hashtags: string[] | null
  status: string
  external_post_id: string | null
  published_at: string | null
  error_message: string | null
  likes: number | null
  comments: number | null
  views: number | null
  reach: number | null
  metrics_updated_at: string | null
}

function mapPublication(row: PublicationRow): PostPublication {
  return {
    id: row.id,
    postId: row.post_id,
    network: row.network as Network,
    description: row.description,
    hashtags: row.hashtags,
    status: row.status as PublicationStatus,
    externalPostId: row.external_post_id,
    publishedAt: row.published_at,
    errorMessage: row.error_message,
    engagement: {
      likes: row.likes ?? 0,
      comments: row.comments ?? 0,
      views: row.views ?? 0,
      reach: row.reach ?? 0,
    },
    metricsUpdatedAt: row.metrics_updated_at,
  }
}

// ─── GET /api/posts ───────────────────────────────────────────────────────────

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: clients, error: cErr } = await supabase
    .from('clients')
    .select('id, name, color')
    .eq('user_id', user.id)

  if (cErr) return Response.json({ error: cErr.message }, { status: 500 })
  if (!clients || clients.length === 0) return Response.json({ data: [] })

  const clientMap = new Map(
    clients.map((c: { id: string; name: string; color: string }) => [c.id, c])
  )
  const clientIds = clients.map((c: { id: string }) => c.id)

  // Posts + sus publicaciones por red (JOIN embebido de Supabase)
  const { data: posts, error: pErr } = await supabase
    .from('posts')
    .select('*, post_publications(*)')
    .in('client_id', clientIds)
    .order('created_at', { ascending: false })

  if (pErr) return Response.json({ error: pErr.message }, { status: 500 })

  // Marcador de redes simuladas por cliente para inventar métricas
  const { data: socialAccounts } = await supabase
    .from('social_accounts')
    .select('client_id, network, is_simulated')
    .in('client_id', clientIds)

  const simulatedSet = new Set<string>() // key = `${client_id}|${network}`
  for (const acc of (socialAccounts ?? []) as {
    client_id: string
    network: string
    is_simulated: boolean
  }[]) {
    if (acc.is_simulated) simulatedSet.add(`${acc.client_id}|${acc.network}`)
  }

  const result = (posts ?? []).map((p: Record<string, unknown>) => {
    const client = clientMap.get(p.client_id as string) as
      | { name: string; color: string }
      | undefined

    const rawPubs = (p.post_publications as PublicationRow[] | null) ?? []
    const publications: PostPublication[] = rawPubs.map((row) => {
      const mapped = mapPublication(row)
      // Si la red está marcada como simulada y la publicación se "publicó",
      // sobrescribir métricas con números plausibles para la demo.
      const isSimulated = simulatedSet.has(
        `${p.client_id}|${mapped.network}`
      )
      if (isSimulated && mapped.status !== 'pending') {
        mapped.engagement = simulateEngagement(mapped.id)
      }
      return mapped
    })

    return {
      id: p.id,
      clientId: p.client_id,
      clientName: client?.name ?? '',
      clientColor: client?.color ?? '#0095b6',
      title: (p.title as string) ?? '',
      description: (p.description as string) ?? '',
      networks: (p.networks as Network[]) ?? [],
      hashtags: (p.hashtags as string[]) ?? [],
      mediaUrls: (p.media_urls as string[]) ?? [],
      status: (p.status as PostStatus) ?? 'draft',
      scheduledAt: (p.scheduled_at as string) ?? null,
      approvalToken: (p.approval_token as string) ?? null,
      approvedAt: (p.approved_at as string) ?? null,
      clientFeedback: (p.client_feedback as string) ?? null,
      publications,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }
  })

  return Response.json({ data: result })
}

// ─── POST /api/posts ──────────────────────────────────────────────────────────

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

  // Validar ownership del cliente
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('id, name, color')
    .eq('id', body.clientId)
    .eq('user_id', user.id)
    .single()

  if (clientErr || !client) {
    return Response.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  // Insertar el post base
  const { data: post, error: insertErr } = await supabase
    .from('posts')
    .insert({
      client_id: body.clientId,
      user_id: user.id,
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

  // Crear una publication por cada red target. Marcar como 'simulated'
  // si la cuenta conectada para esa red está marcada como is_simulated.
  let publications: PostPublication[] = []
  if (body.networks && body.networks.length > 0) {
    const { data: accounts } = await supabase
      .from('social_accounts')
      .select('network, is_simulated')
      .eq('client_id', body.clientId)
      .in('network', body.networks)

    const simulatedByNetwork = new Map<string, boolean>(
      ((accounts ?? []) as { network: string; is_simulated: boolean }[]).map(
        (a) => [a.network, a.is_simulated]
      )
    )

    const rows = body.networks.map((network) => ({
      post_id: post.id,
      network,
      // Estado inicial:
      //  - si el post se está publicando ahora y la red es simulada → 'simulated'
      //  - en cualquier otro caso → 'pending' (se actualiza al publicar)
      status:
        body.status === 'published' && simulatedByNetwork.get(network)
          ? 'simulated'
          : 'pending',
      published_at:
        body.status === 'published' && simulatedByNetwork.get(network)
          ? new Date().toISOString()
          : null,
    }))

    const { data: insertedPubs, error: pubErr } = await supabase
      .from('post_publications')
      .insert(rows)
      .select()

    if (pubErr) {
      // Rollback manual: si fallan las publicaciones, borrar el post huérfano
      await supabase.from('posts').delete().eq('id', post.id)
      return Response.json({ error: pubErr.message }, { status: 500 })
    }

    publications = (insertedPubs as PublicationRow[]).map(mapPublication)
  }

  // Si se programó y la fecha entra en la ventana de QStash, encolar el job.
  // Ante cualquier falla hacemos rollback completo (post + publications) y 503,
  // así el CM puede reintentar sin quedar con un post "fantasma" sin programar.
  let qstashMessageId: string | null = null
  if (post.status === 'scheduled' && post.scheduled_at && shouldEnqueueNow(post.scheduled_at)) {
    try {
      qstashMessageId = await enqueuePostPublish(
        post.id,
        post.scheduled_at,
        resolveBaseUrl(request)
      )
      const { error: updErr } = await supabase
        .from('posts')
        .update({ qstash_message_id: qstashMessageId })
        .eq('id', post.id)
      if (updErr) throw new Error(updErr.message)
    } catch (err) {
      // Rollback: borrar solo el post; las post_publications caen por
      // ON DELETE CASCADE (FK post_publications.post_id). Un único delete evita
      // estados intermedios inconsistentes.
      await supabase.from('posts').delete().eq('id', post.id)
      console.error('Error encolando en QStash, rollback del post:', err)
      return Response.json(
        { error: 'No se pudo programar la publicación, intentá de nuevo' },
        { status: 503 }
      )
    }
  }

  const result = {
    id: post.id,
    clientId: post.client_id,
    clientName: client.name,
    clientColor: client.color,
    title: post.title ?? '',
    description: post.description ?? '',
    networks: post.networks ?? [],
    hashtags: post.hashtags ?? [],
    mediaUrls: post.media_urls ?? [],
    status: post.status ?? 'draft',
    scheduledAt: post.scheduled_at ?? null,
    approvalToken: post.approval_token ?? null,
    approvedAt: post.approved_at ?? null,
    clientFeedback: post.client_feedback ?? null,
    publications,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
  }

  return Response.json({ data: result }, { status: 201 })
}
