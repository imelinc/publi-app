/**
 * Integración con la "Facebook Graph API" (v21.0).
 * Cubre la CONEXIÓN de cuenta (OAuth de Facebook Pages) + manejo de tokens
 * y la publicación real de posts (imágenes individuales, carruseles o solo texto).
 *
 * Docs: https://developers.facebook.com/docs/graph-api/
 *
 * Requiere una app de Meta con permisos para leer páginas y publicar en ellas.
 * Env vars requeridas:
 *  - FACEBOOK_APP_ID: App ID de Meta Developers
 *  - FACEBOOK_APP_SECRET: App Secret de Meta (solo servidor)
 *  - FACEBOOK_REDIRECT_URI: Opcional, fija la URL de redirección
 */

const GRAPH_BASE = 'https://graph.facebook.com/v21.0'
const AUTHORIZE_URL = 'https://www.facebook.com/v21.0/dialog/oauth'
const TOKEN_URL = 'https://graph.facebook.com/v21.0/oauth/access_token'

// Permisos necesarios: leer páginas + publicar en ellas
const SCOPES = ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts']

export interface FacebookPage {
  pageId: string        // id de la página
  name: string          // nombre de la página
  accessToken: string   // page access token (no expira)
  avatarUrl: string | null
}

export interface PublishToFacebookArgs {
  pageId: string
  pageAccessToken: string   // page access token (guardado en social_accounts)
  caption: string
  imageUrls: string[]       // puede estar vacío (Facebook sí acepta posts de solo texto)
}

interface RawFacebookPageItem {
  id: string
  name: string
  access_token: string
  picture?: {
    data?: {
      url?: string
    }
  }
}

/** ¿Están las env vars necesarias para operar con Facebook? */
export function isFacebookConfigured(): boolean {
  return Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET)
}

/**
 * Resuelve el redirect_uri del OAuth. DEBE ser idéntico en /connect y /callback
 * y matchear EXACTO lo registrado en la app de Meta. Si `FACEBOOK_REDIRECT_URI`
 * está seteada, gana (útil para fijar un dominio estable); si no, se deriva del
 * baseUrl de la request.
 */
export function resolveFacebookRedirectUri(baseUrl: string): string {
  return process.env.FACEBOOK_REDIRECT_URI ?? `${baseUrl}/api/facebook/callback`
}

/** Arma la URL de autorización a la que se redirige al usuario. */
export function buildFacebookAuthorizeUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(','),
    state,
  })
  return `${AUTHORIZE_URL}?${params.toString()}`
}

/**
 * Canjea el `code` del callback por un user access token short-lived (≈1h).
 */
export async function exchangeFacebookCode(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; userId: string }> {
  const body = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    client_secret: process.env.FACEBOOK_APP_SECRET!,
    redirect_uri: redirectUri,
    code,
  })

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const json = await res.json()
  if (!res.ok || !json?.access_token) {
    throw new Error(`exchangeFacebookCode falló: ${JSON.stringify(json)}`)
  }
  return { accessToken: json.access_token, userId: '' }
}

/**
 * Intercambia un user token short-lived por uno long-lived (60 días).
 */
export async function getLongLivedUserToken(
  shortToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: process.env.FACEBOOK_APP_ID!,
    client_secret: process.env.FACEBOOK_APP_SECRET!,
    fb_exchange_token: shortToken,
  })
  const res = await fetch(`${GRAPH_BASE}/oauth/access_token?${params.toString()}`)
  const json = await res.json()
  if (!res.ok || !json?.access_token) {
    throw new Error(`getLongLivedUserToken falló: ${JSON.stringify(json)}`)
  }
  return { accessToken: json.access_token, expiresIn: Number(json.expires_in ?? 0) }
}

/**
 * Obtiene las páginas que administra el usuario.
 */
export async function getPagesFromUserToken(userAccessToken: string): Promise<FacebookPage[]> {
  const params = new URLSearchParams({
    fields: 'id,name,access_token,picture{url}',
    access_token: userAccessToken,
  })
  const res = await fetch(`${GRAPH_BASE}/me/accounts?${params.toString()}`)
  const json = await res.json()
  if (!res.ok) {
    throw new Error(`getPagesFromUserToken falló: ${JSON.stringify(json)}`)
  }
  if (!json?.data || !Array.isArray(json.data)) {
    return []
  }
  return (json.data as RawFacebookPageItem[]).map((item) => ({
    pageId: String(item.id ?? ''),
    name: String(item.name ?? ''),
    accessToken: String(item.access_token ?? ''),
    avatarUrl: item.picture?.data?.url ?? null,
  }))
}

/**
 * Helper para hacer requests POST a la API de Facebook y retornar el ID del objeto creado.
 */
async function fbPost(path: string, params: Record<string, string>): Promise<string> {
  const res = await fetch(`${GRAPH_BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  })
  const json = await res.json()
  if (!res.ok || !json?.id) {
    throw new Error(`Facebook API falló: ${JSON.stringify(json)}`)
  }
  return String(json.id)
}

/**
 * Publica contenido en una página de Facebook (foto simple, carrusel o solo texto).
 */
export async function publishToFacebook({
  pageId,
  pageAccessToken,
  caption,
  imageUrls,
}: PublishToFacebookArgs): Promise<string> {
  const images = (imageUrls ?? []).filter(Boolean)

  // Foto simple
  if (images.length === 1) {
    return fbPost(`${pageId}/photos`, {
      url: images[0],
      caption,
      access_token: pageAccessToken,
      published: 'true',
    })
  }

  // Carrusel (2 o más imágenes)
  if (images.length >= 2) {
    const photoIds: string[] = []
    for (const url of images) {
      const photoId = await fbPost(`${pageId}/photos`, {
        url,
        published: 'false',
        access_token: pageAccessToken,
      })
      photoIds.push(photoId)
    }

    return fbPost(`${pageId}/feed`, {
      message: caption,
      attached_media: JSON.stringify(photoIds.map((id) => ({ media_fbid: id }))),
      access_token: pageAccessToken,
    })
  }

  // Solo texto
  return fbPost(`${pageId}/feed`, {
    message: caption,
    access_token: pageAccessToken,
  })
}
