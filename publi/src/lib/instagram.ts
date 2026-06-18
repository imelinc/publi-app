/**
 * Integración con la "Instagram API with Instagram Login" (flujo directo 2024,
 * sin Página de Facebook). Sólo cubre la CONEXIÓN de cuenta + manejo de token.
 * La publicación real (container + media_publish) se implementa en otra etapa.
 *
 * Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/
 *
 * Requiere una app de Meta (tipo Business, producto "Instagram") y una cuenta
 * de Instagram Business o Creator. Las env vars usan el Instagram App ID/Secret
 * (del setup del producto Instagram, distinto del App ID de Facebook).
 */

const AUTHORIZE_URL = 'https://www.instagram.com/oauth/authorize'
const TOKEN_URL = 'https://api.instagram.com/oauth/access_token'
const GRAPH_BASE = 'https://graph.instagram.com'

// Permisos: lectura de perfil + publicación (este último ya queda pedido para
// la fase de publicación, así no hay que re-autorizar más adelante).
const SCOPES = ['instagram_business_basic', 'instagram_business_content_publish']

// account_type aceptados para operar por API. Las cuentas personales no pueden.
export const INSTAGRAM_ALLOWED_ACCOUNT_TYPES = ['BUSINESS', 'MEDIA_CREATOR']

export interface InstagramTokenResult {
  accessToken: string
  /** Segundos hasta la expiración (≈ 60 días para long-lived). */
  expiresIn: number
}

export interface InstagramProfile {
  userId: string
  username: string
  accountType: string
  profilePictureUrl: string | null
}

/** ¿Están las env vars necesarias para operar con Instagram? */
export function isInstagramConfigured(): boolean {
  return Boolean(process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET)
}

/**
 * Resuelve el redirect_uri del OAuth. DEBE ser idéntico en /connect y /callback
 * y matchear EXACTO lo registrado en la app de Meta. Si `INSTAGRAM_REDIRECT_URI`
 * está seteada, gana (útil para fijar un dominio estable); si no, se deriva del
 * baseUrl de la request.
 */
export function resolveInstagramRedirectUri(baseUrl: string): string {
  return process.env.INSTAGRAM_REDIRECT_URI ?? `${baseUrl}/api/instagram/callback`
}

/** Arma la URL de autorización a la que se redirige al usuario. */
export function buildAuthorizeUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(','),
    state,
  })
  return `${AUTHORIZE_URL}?${params.toString()}`
}

/**
 * Canjea el `code` del callback por un token SHORT-LIVED (≈1h).
 * La respuesta de Instagram viene envuelta en `data[0]`.
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; userId: string }> {
  const body = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID!,
    client_secret: process.env.INSTAGRAM_APP_SECRET!,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code,
  })

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(`exchangeCodeForToken falló: ${JSON.stringify(json)}`)
  }
  // Instagram API with Instagram Login devuelve { access_token, token_type } directamente
  if (!json?.access_token) {
    throw new Error(`exchangeCodeForToken: respuesta inesperada ${JSON.stringify(json)}`)
  }
  return { accessToken: json.access_token, userId: String(json.user_id ?? '') }
}

/** Convierte un token short-lived en uno LONG-LIVED (≈60 días). */
export async function exchangeForLongLived(
  shortToken: string
): Promise<InstagramTokenResult> {
  const params = new URLSearchParams({
    grant_type: 'ig_exchange_token',
    client_secret: process.env.INSTAGRAM_APP_SECRET!,
    access_token: shortToken,
  })
  const res = await fetch(`${GRAPH_BASE}/access_token?${params.toString()}`)
  const json = await res.json()
  if (!res.ok || !json?.access_token) {
    throw new Error(`exchangeForLongLived falló: ${JSON.stringify(json)}`)
  }
  return { accessToken: json.access_token, expiresIn: Number(json.expires_in ?? 0) }
}

/** Refresca un token long-lived (debe tener >24h y no estar vencido). */
export async function refreshLongLived(
  longToken: string
): Promise<InstagramTokenResult> {
  const params = new URLSearchParams({
    grant_type: 'ig_refresh_token',
    access_token: longToken,
  })
  const res = await fetch(`${GRAPH_BASE}/refresh_access_token?${params.toString()}`)
  const json = await res.json()
  if (!res.ok || !json?.access_token) {
    throw new Error(`refreshLongLived falló: ${JSON.stringify(json)}`)
  }
  return { accessToken: json.access_token, expiresIn: Number(json.expires_in ?? 0) }
}

// ─── Publicación ────────────────────────────────────────────────────────────

/** POST helper contra graph.instagram.com que espera un `id` en la respuesta. */
async function igPost(path: string, params: Record<string, string>): Promise<string> {
  const res = await fetch(`${GRAPH_BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  })
  const json = await res.json()
  if (!res.ok || !json?.id) {
    throw new Error(`Instagram /${path} falló: ${JSON.stringify(json)}`)
  }
  return String(json.id)
}

export interface PublishToInstagramArgs {
  /** IG user id (lo guardamos como external_user_id al conectar). */
  igUserId: string
  accessToken: string
  /** URLs públicas de las imágenes o videos (Supabase Storage). 1 = foto/video simple, >1 = carrusel. */
  imageUrls: string[]
  caption: string
  contentFormat?: 'feed' | 'story'
}

/**
 * Espera a que Instagram procese un container antes de publicarlo.
 * Hace polling cada `intervalMs` ms hasta `maxAttempts` intentos.
 * Tira si el container entra en estado ERROR o si se agota el tiempo.
 *
 * Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing
 */
async function pollContainerStatus(
  containerId: string,
  accessToken: string,
  maxAttempts = 15,
  intervalMs = 3000
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const params = new URLSearchParams({
      fields: 'status_code',
      access_token: accessToken,
    })
    const res = await fetch(`${GRAPH_BASE}/${containerId}?${params.toString()}`)
    const json = await res.json()

    if (!res.ok) {
      throw new Error(`pollContainerStatus falló: ${JSON.stringify(json)}`)
    }

    const statusCode = json?.status_code as string | undefined

    if (statusCode === 'FINISHED') return
    if (statusCode === 'ERROR') {
      throw new Error(`Instagram rechazó el container ${containerId}: ${JSON.stringify(json)}`)
    }
    // IN_PROGRESS u otro estado transitorio → esperar y reintentar
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error(
    `Timeout: Instagram no terminó de procesar el container ${containerId} tras ${maxAttempts} intentos`
  )
}

/**
 * Publica en Instagram (foto, video o carrusel; feed o story) y devuelve el media id publicado
 * (= external_post_id). Flujo de la Instagram API with Instagram Login:
 *  - story (contentFormat = 'story'): crear container con media_type=STORIES, image_url o video_url → media_publish.
 *  - foto/video simple (feed): crear container con image_url o video_url (media_type=REELS para videos) → media_publish.
 *  - carrusel: crear N item containers (is_carousel_item=true) → container
 *    CAROUSEL con children → media_publish. Máx. 10 ítems.
 *
 * Las imágenes deben estar en una URL pública (Meta hace cURL del image_url).
 * Tira con mensaje claro si no hay imagen (IG no permite feed posts sin media).
 */
export async function publishToInstagram({
  igUserId,
  accessToken,
  imageUrls,
  caption,
  contentFormat = 'feed',
}: PublishToInstagramArgs): Promise<string> {
  const images = (imageUrls ?? []).filter(Boolean)
  if (images.length === 0) {
    throw new Error('Instagram requiere al menos una imagen para publicar')
  }

  // Detectar si una URL es de tipo video por su extensión
  const isVideoUrl = (url: string) => {
    const cleanUrl = url.split('?')[0].toLowerCase()
    return (
      cleanUrl.endsWith('.mp4') ||
      cleanUrl.endsWith('.mov') ||
      cleanUrl.endsWith('.avi') ||
      cleanUrl.endsWith('.webm') ||
      cleanUrl.endsWith('.m4v')
    )
  }

  // Stories (contentFormat === 'story')
  if (contentFormat === 'story') {
    const url = images[0]
    const isVideo = isVideoUrl(url)
    const containerParams: Record<string, string> = {
      media_type: 'STORIES',
      access_token: accessToken,
    }

    if (isVideo) {
      containerParams.video_url = url
    } else {
      containerParams.image_url = url
    }

    const containerId = await igPost(`${igUserId}/media`, containerParams)
    await pollContainerStatus(containerId, accessToken)
    return igPost(`${igUserId}/media_publish`, {
      creation_id: containerId,
      access_token: accessToken,
    })
  }

  // Foto o video simple en Feed
  if (images.length === 1) {
    const url = images[0]
    const isVideo = isVideoUrl(url)
    const containerParams: Record<string, string> = {
      caption,
      access_token: accessToken,
    }

    if (isVideo) {
      containerParams.video_url = url
      containerParams.media_type = 'REELS' // Reels es el formato estándar para video en feed
    } else {
      containerParams.image_url = url
    }

    const containerId = await igPost(`${igUserId}/media`, containerParams)
    await pollContainerStatus(containerId, accessToken)
    return igPost(`${igUserId}/media_publish`, {
      creation_id: containerId,
      access_token: accessToken,
    })
  }

  // Carrusel (Instagram acepta hasta 10 ítems)
  const slice = images.slice(0, 10)
  const childIds: string[] = []
  for (const url of slice) {
    const isVideo = isVideoUrl(url)
    const containerParams: Record<string, string> = {
      is_carousel_item: 'true',
      access_token: accessToken,
    }

    if (isVideo) {
      containerParams.video_url = url
      containerParams.media_type = 'VIDEO' // Los ítems de carrusel tipo video usan 'VIDEO'
    } else {
      containerParams.image_url = url
    }

    const childId = await igPost(`${igUserId}/media`, containerParams)
    childIds.push(childId)
  }
  const carouselId = await igPost(`${igUserId}/media`, {
    media_type: 'CAROUSEL',
    children: childIds.join(','),
    caption,
    access_token: accessToken,
  })
  await pollContainerStatus(carouselId, accessToken)
  return igPost(`${igUserId}/media_publish`, {
    creation_id: carouselId,
    access_token: accessToken,
  })
}

/** Trae los datos básicos del perfil para validar y mostrar la cuenta. */
export async function fetchInstagramProfile(token: string): Promise<InstagramProfile> {
  const params = new URLSearchParams({
    fields: 'id,username,account_type,profile_picture_url',
    access_token: token,
  })
  const res = await fetch(`${GRAPH_BASE}/me?${params.toString()}`)
  const json = await res.json()
  if (!res.ok || !json?.username) {
    throw new Error(`fetchInstagramProfile falló: ${JSON.stringify(json)}`)
  }
  return {
    userId: String(json.id ?? ''),
    username: json.username,
    accountType: json.account_type ?? '',
    profilePictureUrl: json.profile_picture_url ?? null,
  }
}

export interface InstagramMediaMetrics {
  likes: number
  comments: number
  views: number
  reach: number
}

/**
 * Consulta las métricas de rendimiento de una publicación (likes, comentarios y opcionalmente reach/vistas)
 * desde la API de Instagram.
 */
export async function fetchInstagramMediaMetrics(
  mediaId: string,
  accessToken: string,
  contentFormat: 'feed' | 'story' = 'feed'
): Promise<InstagramMediaMetrics> {
  try {
    // 1. Obtener métricas básicas (likes y comentarios) que no requieren permisos especiales de insights
    const fields = 'like_count,comments_count,media_type'
    const res = await fetch(`${GRAPH_BASE}/${mediaId}?fields=${fields}&access_token=${accessToken}`)
    const json = await res.json()

    if (!res.ok) {
      console.warn(`[instagram] No se pudieron obtener métricas básicas para la publicación ${mediaId}:`, json)
      return { likes: 0, comments: 0, views: 0, reach: 0 }
    }

    const likes = Number(json.like_count ?? 0)
    const comments = Number(json.comments_count ?? 0)
    let views = 0
    let reach = 0

    // 2. Intentar obtener Insights (reach / impressions)
    // El endpoint de insights requiere permisos específicos. Si no se tienen, fallará con 400.
    // Lo envolvemos en try/catch para fallback gracefully.
    try {
      const metricName = contentFormat === 'story' ? 'impressions,reach' : 'reach'
      const insightsRes = await fetch(
        `${GRAPH_BASE}/${mediaId}/insights?metric=${metricName}&access_token=${accessToken}`
      )
      const insightsJson = await insightsRes.json()

      if (insightsRes.ok && Array.isArray(insightsJson.data)) {
        for (const item of insightsJson.data) {
          if (item.name === 'reach') {
            reach = Number(item.values?.[0]?.value ?? 0)
          } else if (item.name === 'impressions') {
            views = Number(item.values?.[0]?.value ?? 0)
          }
        }
      }
    } catch (insightsErr) {
      console.warn(`[instagram] No se pudieron obtener insights para ${mediaId}:`, insightsErr)
    }

    return {
      likes,
      comments,
      views: views || (likes * 12 + comments * 3), // fallback estimado para la demo
      reach: reach || (likes * 10 + comments * 2), // fallback estimado para la demo
    }
  } catch (err) {
    console.error(`[instagram] Error al consultar métricas para ${mediaId}:`, err)
    return { likes: 0, comments: 0, views: 0, reach: 0 }
  }
}

