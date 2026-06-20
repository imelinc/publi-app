import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import type { Network, PostStatus } from '@/types'
import { resolveBaseUrl } from '@/lib/url'
import { syncQStashForUpdate, cancelPostPublish } from '@/lib/qstash'
import { getDailyUsage } from '@/lib/instagram-rate-limit'
import { fetchInstagramMediaMetrics } from '@/lib/instagram'

interface RouteParams {
  params: Promise<{ postId: string }>
}

// ─── Utilidad: mapear row de DB → Post ───────────────────────────────────────

function mapPost(
  p: Record<string, unknown>,
  clientName: string,
  clientColor: string
) {
  const rawPubs = (p.post_publications as any[] | null) ?? []
  const publications = rawPubs.map((row) => ({
    id: row.id,
    postId: row.post_id,
    network: row.network as Network,
    description: row.description,
    hashtags: row.hashtags,
    status: row.status,
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
  }))

  return {
    id: p.id,
    clientId: p.client_id,
    clientName,
    clientColor,
    title: (p.title as string) ?? '',
    description: (p.description as string) ?? '',
    networks: (p.networks as Network[]) ?? [],
    contentFormat: (p.content_format as 'feed' | 'story') ?? 'feed',
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
    publications,
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
    .select('*, post_publications(*)')
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

  // Si el post está publicado, intentar refrescar las métricas de las publicaciones de Instagram reales en la DB (excluyendo Stories)
  if (post.status === 'published' && post.content_format !== 'story' && Array.isArray(post.post_publications)) {
    for (const pub of post.post_publications) {
      if (pub.status === 'published' && pub.external_post_id && pub.network === 'instagram') {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
        const needsUpdate = !pub.metrics_updated_at || pub.metrics_updated_at < fiveMinutesAgo

        if (needsUpdate) {
          const { data: acc } = await supabase
            .from('social_accounts')
            .select('access_token')
            .eq('client_id', post.client_id)
            .eq('network', 'instagram')
            .eq('is_simulated', false)
            .single()

          if (acc?.access_token) {
            try {
              const metrics = await fetchInstagramMediaMetrics(
                pub.external_post_id,
                acc.access_token,
                post.content_format as 'feed' | 'story'
              )

              await supabase
                .from('post_publications')
                .update({
                  likes: metrics.likes,
                  comments: metrics.comments,
                  views: metrics.views,
                  reach: metrics.reach,
                  metrics_updated_at: new Date().toISOString(),
                })
                .eq('id', pub.id)

              pub.likes = metrics.likes
              pub.comments = metrics.comments
              pub.views = metrics.views
              pub.reach = metrics.reach
              pub.metrics_updated_at = new Date().toISOString()
            } catch (err) {
              console.error(`Error actualizando métricas en GET /api/posts/${postId}:`, err)
            }
          }
        }
      }
    }
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
  contentFormat?: 'feed' | 'story'
  customDescriptions?: Record<Network, string> | null
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
  if (body.contentFormat !== undefined) updates.content_format = body.contentFormat
  // Si pasa a 'published' y no se pasó scheduled_at, marcar como publicado ahora
  if (body.status === 'published' && body.scheduledAt === undefined && !post.scheduled_at) {
    updates.scheduled_at = new Date().toISOString()
  }

  // Validar restricciones de Stories (máximo 1 multimedia)
  const finalContentFormat = body.contentFormat ?? post.content_format ?? 'feed'
  const finalMediaUrls = body.mediaUrls ?? post.media_urls ?? []
  if (finalContentFormat === 'story' && finalMediaUrls.length > 1) {
    return Response.json(
      { error: 'Las Stories de Instagram solo permiten una imagen o un video.' },
      { status: 400 }
    )
  }

  // Validación de límite diario de Instagram (25 por 24hs por cliente)
  const oldStatus = post.status
  const newStatus = body.status ?? post.status
  const oldScheduledAt = post.scheduled_at
  const newScheduledAt = body.scheduledAt !== undefined ? body.scheduledAt : post.scheduled_at
  const targetsInstagram = (body.networks ?? post.networks ?? []).includes('instagram')

  const isTransitioningToQuota =
    (newStatus === 'scheduled' || newStatus === 'published') &&
    oldStatus !== 'scheduled' &&
    oldStatus !== 'published'

  const isRescheduling =
    (newStatus === 'scheduled' || newStatus === 'published') &&
    newScheduledAt !== oldScheduledAt

  if (targetsInstagram && (isTransitioningToQuota || isRescheduling)) {
    try {
      const usage = await getDailyUsage(post.client_id, supabase)
      if (usage.remaining <= 0) {
        return Response.json(
          {
            error: `Límite diario de publicaciones de Instagram alcanzado (25 cada 24hs). Próximo cupo disponible: ${usage.nextSlotAvailableAt}`,
            nextSlotAvailableAt: usage.nextSlotAvailableAt,
          },
          { status: 403 }
        )
      }
    } catch (err) {
      console.error('[PATCH /api/posts/:postId] Error al verificar límite diario:', err)
      return Response.json(
        { error: 'No se pudo verificar el límite diario de publicaciones' },
        { status: 500 }
      )
    }
  }

  // ─── Sincronizar la cola de QStash según la transición ──────────────────────
  // NOTA (deuda técnica MVP): si dos PATCH llegan simultáneos sobre el mismo
  // post, ambos leen el mismo oldState, cancelan el mismo qstash_message_id y
  // encolan dos jobs → posible publicación duplicada. Futuro: SELECT FOR UPDATE
  // o optimistic lock comparando updated_at antes de aplicar el sync de QStash.
  // Estado/fecha resultantes tras aplicar el body.
  try {
    const messageId = await syncQStashForUpdate(
      postId,
      {
        status: post.status as string,
        scheduled_at: post.scheduled_at as string | null,
        qstash_message_id: (post.qstash_message_id as string | null) ?? null,
      },
      newStatus,
      newScheduledAt,
      resolveBaseUrl(request)
    )
    // Persistimos el id resultante (string si quedó encolado, null si no).
    updates.qstash_message_id = messageId
  } catch (err) {
    // Falla de QStash → no aplicamos el UPDATE (rollback implícito) y 503.
    console.error('Error sincronizando QStash en PATCH, no se aplica el update:', err)
    return Response.json(
      { error: 'No se pudo actualizar la programación, intentá de nuevo' },
      { status: 503 }
    )
  }

  // ─── Sincronizar post_publications (redes y copys personalizados) ───
  if (body.networks !== undefined || body.customDescriptions !== undefined) {
    const finalNetworks = body.networks ?? (post.networks as Network[]) ?? []
    
    // Obtener publicaciones actuales
    const { data: currentPubs, error: fetchPubsErr } = await supabase
      .from('post_publications')
      .select('id, network')
      .eq('post_id', postId)
      
    if (fetchPubsErr) {
      return Response.json({ error: fetchPubsErr.message }, { status: 500 })
    }
    
    const currentPubsList = (currentPubs ?? []) as { id: string; network: string }[]
    
    const networksToDelete = currentPubsList
      .filter(p => !finalNetworks.includes(p.network as Network))
      .map(p => p.network)
      
    const networksToAdd = finalNetworks
      .filter(n => !currentPubsList.some(p => p.network === n))
      
    const networksToKeep = finalNetworks
      .filter(n => currentPubsList.some(p => p.network === n))
      
    // 1. Eliminar publicaciones de redes deseleccionadas
    if (networksToDelete.length > 0) {
      const { error: delPubsErr } = await supabase
        .from('post_publications')
        .delete()
        .eq('post_id', postId)
        .in('network', networksToDelete)
        
      if (delPubsErr) {
        return Response.json({ error: delPubsErr.message }, { status: 500 })
      }
    }
    
    // 2. Agregar publicaciones para redes nuevas
    if (networksToAdd.length > 0) {
      const newPubsRows = networksToAdd.map(network => ({
        post_id: postId,
        network,
        description: body.customDescriptions?.[network] || null,
        status: 'pending',
      }))
      
      const { error: addPubsErr } = await supabase
        .from('post_publications')
        .insert(newPubsRows)
        
      if (addPubsErr) {
        return Response.json({ error: addPubsErr.message }, { status: 500 })
      }
    }
    
    // 3. Actualizar descripciones en redes que se mantienen si se envió customDescriptions
    if (body.customDescriptions !== undefined) {
      for (const network of networksToKeep) {
        const newDesc = body.customDescriptions === null 
          ? null 
          : (body.customDescriptions[network] || null)
          
        const { error: updPubErr } = await supabase
          .from('post_publications')
          .update({ description: newDesc })
          .eq('post_id', postId)
          .eq('network', network)
          
        if (updPubErr) {
          return Response.json({ error: updPubErr.message }, { status: 500 })
        }
      }
    }
  }

  const { data: updated, error: updateErr } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', postId)
    .select('*, post_publications(*)')
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
    .select('id, client_id, qstash_message_id')
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

  // Cancelar el job de QStash si lo había. No bloqueamos el borrado por una
  // falla de cola: el callback huérfano va a responder 200 sin publicar nada
  // (el post ya no existe). Por eso logueamos y seguimos.
  if (post.qstash_message_id) {
    try {
      await cancelPostPublish(post.qstash_message_id as string)
    } catch (err) {
      console.error('No se pudo cancelar el job de QStash al borrar el post:', err)
    }
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
