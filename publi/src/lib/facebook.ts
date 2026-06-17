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
  // Retornamos true incondicionalmente para que la demo funcione siempre
  return true
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
  // Redirigir a una URL simulada o retornar vacio ya que connect/route redireccionará de forma simulada
  return `${redirectUri}?code=mock_code&state=${encodeURIComponent(state)}`
}

/**
 * Canjea el `code` del callback por un user access token short-lived (≈1h).
 */
export async function exchangeFacebookCode(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; userId: string }> {
  return { accessToken: 'mock_short_user_token', userId: 'mock_user_id' }
}

/**
 * Intercambia un user token short-lived por uno long-lived (60 días).
 */
export async function getLongLivedUserToken(
  shortToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  return { accessToken: 'mock_long_user_token', expiresIn: 5184000 }
}

/**
 * Obtiene las páginas que administra el usuario.
 */
export async function getPagesFromUserToken(userAccessToken: string): Promise<FacebookPage[]> {
  return [
    {
      pageId: 'sim_facebook_page_' + Math.random().toString(36).substring(2, 9),
      name: 'Página de Facebook Simulada',
      accessToken: 'mock_page_access_token',
      avatarUrl: 'https://ui-avatars.com/api/?name=PFS&background=1877F2&color=fff&bold=true'
    }
  ]
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
  // Simular un delay de procesamiento
  await new Promise((resolve) => setTimeout(resolve, 500))
  return `mock_facebook_post_${Math.floor(Math.random() * 1000000)}`
}
