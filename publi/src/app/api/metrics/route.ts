import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId') || 'all'
  const period = searchParams.get('period') || '30d'
  const network = searchParams.get('network') || 'all'
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  // 1. Obtener los clientes del usuario para validar permisos y tener nombres/colores
  const { data: clients, error: clientsErr } = await supabase
    .from('clients')
    .select('id, name, color')
    .eq('user_id', user.id)

  if (clientsErr) {
    return Response.json({ error: clientsErr.message }, { status: 500 })
  }

  if (!clients || clients.length === 0) {
    return Response.json({
      summary: {
        totalPosts: 0,
        published: 0,
        scheduled: 0,
        drafts: 0,
        timesLoggedIn: 0,
        timeSpentCreating: 0,
        deltaVsPrevious: 0,
      },
      posts: [],
      topHashtags: [],
      postsByClient: [],
      postsByHour: [],
    })
  }

  const clientMap = new Map(clients.map(c => [c.id, c]))
  let targetClientIds = clients.map(c => c.id)

  if (clientId !== 'all') {
    if (!targetClientIds.includes(clientId)) {
      return Response.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }
    targetClientIds = [clientId]
  }

  // 2. Obtener datos de uso del perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('login_count, time_spent_creating')
    .eq('id', user.id)
    .single()

  const timesLoggedIn = profile?.login_count ?? 0
  const timeSpentCreating = profile?.time_spent_creating ?? 0

  // 3. Determinar los rangos de fechas (periodo actual y periodo anterior)
  const now = new Date()
  let startDate = new Date()
  let endDate = new Date(now)
  let prevStartDate = new Date()
  let prevEndDate = new Date()

  if (period === '7d') {
    startDate.setDate(now.getDate() - 7)
    const durationMs = now.getTime() - startDate.getTime()
    prevStartDate = new Date(startDate.getTime() - durationMs)
    prevEndDate = new Date(startDate)
  } else if (period === '30d') {
    startDate.setDate(now.getDate() - 30)
    const durationMs = now.getTime() - startDate.getTime()
    prevStartDate = new Date(startDate.getTime() - durationMs)
    prevEndDate = new Date(startDate)
  } else if (period === '3m' || period === '90d') {
    startDate.setDate(now.getDate() - 90)
    const durationMs = now.getTime() - startDate.getTime()
    prevStartDate = new Date(startDate.getTime() - durationMs)
    prevEndDate = new Date(startDate)
  } else if (period === 'custom' && from) {
    startDate = new Date(from)
    if (to) {
      endDate = new Date(to)
    }
    const durationMs = endDate.getTime() - startDate.getTime()
    prevStartDate = new Date(startDate.getTime() - durationMs)
    prevEndDate = new Date(startDate)
  } else {
    // Default 30d
    startDate.setDate(now.getDate() - 30)
    const durationMs = now.getTime() - startDate.getTime()
    prevStartDate = new Date(startDate.getTime() - durationMs)
    prevEndDate = new Date(startDate)
  }

  // 4. Buscar publicaciones
  const { data: rawPosts, error: postsErr } = await supabase
    .from('posts')
    .select('*, post_publications(*)')
    .in('client_id', targetClientIds)

  if (postsErr) {
    return Response.json({ error: postsErr.message }, { status: 500 })
  }

  // 5. Mapear y filtrar en memoria
  const mappedPosts = (rawPosts || []).map(p => {
    const client = clientMap.get(p.client_id)
    return {
      id: p.id,
      clientId: p.client_id,
      clientName: client?.name || '',
      clientColor: client?.color || '#0095b6',
      title: p.title || '',
      description: p.description || '',
      networks: p.networks || [],
      hashtags: p.hashtags || [],
      mediaUrls: p.media_urls || [],
      status: p.status || 'draft',
      scheduledAt: p.scheduled_at || null,
      publishedAt: p.published_at || null,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }
  })

  // Filtrar para el periodo actual
  const filteredPosts = mappedPosts.filter(p => {
    const dateToFilter = p.status === 'published' ? (p.publishedAt || p.createdAt) : p.createdAt
    const postDate = new Date(dateToFilter)
    const matchesNetwork = network === 'all' || p.networks.includes(network)
    const matchesDate = postDate >= startDate && postDate <= endDate
    return matchesNetwork && matchesDate
  })

  // Filtrar para el periodo anterior
  const previousPeriodPosts = mappedPosts.filter(p => {
    const dateToFilter = p.status === 'published' ? (p.publishedAt || p.createdAt) : p.createdAt
    const postDate = new Date(dateToFilter)
    const matchesNetwork = network === 'all' || p.networks.includes(network)
    const matchesDate = postDate >= prevStartDate && postDate < prevEndDate
    return matchesNetwork && matchesDate
  })

  // 6. Calcular estadísticas del periodo actual
  const totalPosts = filteredPosts.length
  const publishedCount = filteredPosts.filter(p => p.status === 'published').length
  const scheduledCount = filteredPosts.filter(p => p.status === 'scheduled').length
  const draftCount = filteredPosts.filter(p => p.status === 'draft').length
  const deltaVsPrevious = totalPosts - previousPeriodPosts.length

  // 7. Calcular hashtags más populares
  const hashtagsMap: Record<string, { count: number; original: string }> = {}
  filteredPosts.forEach(p => {
    const hashtagsSet = new Set<string>()

    // A. Agregar desde la columna hashtags
    if (Array.isArray(p.hashtags)) {
      p.hashtags.forEach(tag => {
        const clean = tag.trim().replace(/^#/, '')
        if (clean) hashtagsSet.add(clean)
      })
    }

    // B. Extraer desde el título y la descripción (usando regex compatible con español)
    const extractFromText = (text: string) => {
      if (!text) return
      const matches = text.match(/#[\wáéíóúñÁÉÍÓÚÑ]+/g)
      if (matches) {
        matches.forEach(match => {
          const clean = match.replace(/^#/, '')
          if (clean) hashtagsSet.add(clean)
        })
      }
    }

    extractFromText(p.title)
    extractFromText(p.description)

    // Sumar al mapa global sin duplicar dentro de un mismo post
    hashtagsSet.forEach(tag => {
      // Normalizar en minúscula para agrupar, pero mantener capitalización
      // para la visualización más estética. Buscamos conservar la capitalización original más frecuente.
      const key = tag.toLowerCase()
      // Usamos una estructura temporal para contar y guardar el casing preferido
      if (!hashtagsMap[key]) {
        hashtagsMap[key] = { count: 0, original: tag }
      }
      hashtagsMap[key].count++
    })
  })

  const topHashtags = Object.values(hashtagsMap)
    .map(({ count, original }) => ({ hashtag: original, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // 8. Calcular publicaciones por cliente
  const clientCounts: Record<string, { name: string; color: string; count: number }> = {}
  filteredPosts.forEach(p => {
    if (!clientCounts[p.clientId]) {
      clientCounts[p.clientId] = {
        name: p.clientName,
        color: p.clientColor,
        count: 0,
      }
    }
    clientCounts[p.clientId].count++
  })
  const postsByClient = Object.values(clientCounts).sort((a, b) => b.count - a.count)

  // 9. Calcular horarios preferidos de programación (según scheduledAt o createdAt)
  const hoursMap = {
    morning: 0,   // 6:00 - 11:59
    afternoon: 0, // 12:00 - 17:59
    evening: 0,   // 18:00 - 23:59
    night: 0,     // 0:00 - 5:59
  }

  filteredPosts.forEach(p => {
    const postDate = new Date(p.scheduledAt || p.createdAt)
    const hour = postDate.getHours()
    if (hour >= 6 && hour < 12) {
      hoursMap.morning++
    } else if (hour >= 12 && hour < 18) {
      hoursMap.afternoon++
    } else if (hour >= 18 && hour < 24) {
      hoursMap.evening++
    } else {
      hoursMap.night++
    }
  })

  const postsByHour = [
    { label: 'Mañana (6-12h)', count: hoursMap.morning },
    { label: 'Mediodía/Tarde (12-18h)', count: hoursMap.afternoon },
    { label: 'Tarde/Noche (18-24h)', count: hoursMap.evening },
    { label: 'Madrugada (0-6h)', count: hoursMap.night },
  ]

  // 10. Devolver la respuesta
  return Response.json({
    summary: {
      totalPosts,
      published: publishedCount,
      scheduled: scheduledCount,
      drafts: draftCount,
      timesLoggedIn,
      timeSpentCreating,
      deltaVsPrevious,
    },
    posts: filteredPosts,
    topHashtags,
    postsByClient,
    postsByHour,
  })
}
