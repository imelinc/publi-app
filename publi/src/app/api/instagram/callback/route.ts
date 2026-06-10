import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveBaseUrl } from '@/lib/url'
import {
  exchangeCodeForToken,
  exchangeForLongLived,
  fetchInstagramProfile,
  resolveInstagramRedirectUri,
  INSTAGRAM_ALLOWED_ACCOUNT_TYPES,
} from '@/lib/instagram'

/**
 * GET /api/instagram/callback?code=...&state=...
 *
 * Instagram redirige acá tras la autorización. Canjea el code por un token
 * long-lived, valida que la cuenta sea Business/Creator, y la guarda en
 * social_accounts (is_simulated=false). Siempre termina en un redirect a
 * /clientes con ig_connected=1 o ig_error=<motivo>.
 */
export async function GET(request: NextRequest) {
  const baseUrl = resolveBaseUrl(request)
  const clientesUrl = `${baseUrl}/clientes`
  const fail = (reason: string) => {
    const res = new Response(null, {
      status: 302,
      headers: { Location: `${clientesUrl}?ig_error=${reason}` },
    })
    res.headers.append('Set-Cookie', 'ig_oauth_state=; Path=/; HttpOnly; Max-Age=0')
    return res
  }

  const params = request.nextUrl.searchParams

  // Usuario rechazó / error de Instagram.
  if (params.get('error')) {
    return fail('denied')
  }

  const code = params.get('code')
  const state = params.get('state')
  if (!code || !state) return fail('token')

  // CSRF: el nonce del state debe coincidir con la cookie.
  const [clientId, nonce] = state.split(':')
  const cookieNonce = request.cookies.get('ig_oauth_state')?.value
  if (!clientId || !nonce || !cookieNonce || cookieNonce !== nonce) {
    return fail('token')
  }

  // Sesión del CM + ownership del cliente (la cookie de sesión viaja: es
  // navegación same-site de vuelta a nuestro dominio).
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.redirect(`${baseUrl}/login`, 302)
  }
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('user_id', user.id)
    .single()
  if (clientErr || !client) return fail('token')

  try {
    const redirectUri = resolveInstagramRedirectUri(baseUrl)
    const { accessToken: shortToken } = await exchangeCodeForToken(code, redirectUri)
    const longLived = await exchangeForLongLived(shortToken)
    const profile = await fetchInstagramProfile(longLived.accessToken)

    // Validar tipo de cuenta. Logueamos el valor real por si el enum difiere.
    if (!INSTAGRAM_ALLOWED_ACCOUNT_TYPES.includes(profile.accountType)) {
      console.warn(
        `[instagram/callback] account_type no permitido: "${profile.accountType}" (cliente ${clientId})`
      )
      return fail('not_business')
    }

    const expiresAt = new Date(Date.now() + longLived.expiresIn * 1000).toISOString()

    // Upsert: reconectar pisa la fila previa (simulada o real) por la UNIQUE
    // (client_id, network).
    const { error: upsertErr } = await supabase.from('social_accounts').upsert(
      {
        client_id: clientId,
        network: 'instagram',
        external_user_id: profile.userId,
        username: profile.username,
        avatar_url: profile.profilePictureUrl,
        is_simulated: false,
        access_token: longLived.accessToken,
        token_expires_at: expiresAt,
      },
      { onConflict: 'client_id,network' }
    )
    if (upsertErr) {
      console.error('[instagram/callback] error guardando la cuenta:', upsertErr)
      return fail('token')
    }
  } catch (err) {
    console.error('[instagram/callback] error en el flujo OAuth:', err)
    return fail('token')
  }

  // Éxito. Limpiamos la cookie de state.
  const res = new Response(null, {
    status: 302,
    headers: { Location: `${clientesUrl}?ig_connected=1` },
  })
  res.headers.append('Set-Cookie', 'ig_oauth_state=; Path=/; HttpOnly; Max-Age=0')
  return res
}
