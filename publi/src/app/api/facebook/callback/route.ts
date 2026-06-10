import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveBaseUrl } from '@/lib/url'
import {
  exchangeFacebookCode,
  getLongLivedUserToken,
  getPagesFromUserToken,
  resolveFacebookRedirectUri,
} from '@/lib/facebook'

/**
 * GET /api/facebook/callback?code=...&state=...
 *
 * Facebook redirige acá tras la autorización. Canjea el code por un token
 * long-lived, obtiene las páginas administradas, y guarda la primera en
 * social_accounts (is_simulated=false). Siempre termina en un redirect a
 * /clientes con fb_connected=1 o fb_error=<motivo> o fb_no_pages=1.
 */
export async function GET(request: NextRequest) {
  const baseUrl = resolveBaseUrl(request)
  const clientesUrl = `${baseUrl}/clientes`
  
  const fail = (reason: string) => {
    const res = new Response(null, {
      status: 302,
      headers: { Location: `${clientesUrl}?fb_error=${reason}` },
    })
    res.headers.append('Set-Cookie', 'fb_oauth_state=; Path=/; HttpOnly; Max-Age=0')
    return res
  }

  const params = request.nextUrl.searchParams

  // Usuario rechazó / error de Facebook.
  if (params.get('error')) {
    return fail('denied')
  }

  const code = params.get('code')
  const state = params.get('state')
  if (!code || !state) return fail('token')

  // CSRF: el nonce del state debe coincidir con la cookie.
  const [clientId, nonce] = state.split(':')
  const cookieNonce = request.cookies.get('fb_oauth_state')?.value
  if (!clientId || !nonce || !cookieNonce || cookieNonce !== nonce) {
    return fail('token')
  }

  // Sesión del CM + ownership del cliente (la cookie de sesión viaja).
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
    const redirectUri = resolveFacebookRedirectUri(baseUrl)
    
    // 3. exchangeFacebookCode(code, redirectUri) → userShortToken
    const { accessToken: userShortToken } = await exchangeFacebookCode(code, redirectUri)
    
    // 4. getLongLivedUserToken(userShortToken) → { accessToken: userLongToken, expiresIn }
    const longLived = await getLongLivedUserToken(userShortToken)
    
    // 5. getPagesFromUserToken(userLongToken) → pages[]
    const pages = await getPagesFromUserToken(longLived.accessToken)
    
    // 6. Si pages está vacío → redirect a ${clientesUrl}?fb_no_pages=1
    if (pages.length === 0) {
      const res = new Response(null, {
        status: 302,
        headers: { Location: `${clientesUrl}?fb_no_pages=1` },
      })
      res.headers.append('Set-Cookie', 'fb_oauth_state=; Path=/; HttpOnly; Max-Age=0')
      return res
    }

    // 7. Si hay páginas, usar pages[0] (la primera página que administra el usuario).
    const pageToConnect = pages[0]

    // 8. Upsert en social_accounts con los datos de la página
    const { error: upsertErr } = await supabase.from('social_accounts').upsert(
      {
        client_id: clientId,
        network: 'facebook',
        external_user_id: pageToConnect.pageId,
        username: pageToConnect.name,
        avatar_url: pageToConnect.avatarUrl,
        is_simulated: false,
        access_token: pageToConnect.accessToken,  // PAGE access token
        token_expires_at: null,                   // los page tokens no expiran
      },
      { onConflict: 'client_id,network' }
    )
    if (upsertErr) {
      console.error('[facebook/callback] error guardando la cuenta:', upsertErr)
      return fail('token')
    }
  } catch (err) {
    console.error('[facebook/callback] error en el flujo OAuth:', err)
    return fail('token')
  }

  // 9. Éxito. Limpiamos la cookie de state.
  const res = new Response(null, {
    status: 302,
    headers: { Location: `${clientesUrl}?fb_connected=1` },
  })
  res.headers.append('Set-Cookie', 'fb_oauth_state=; Path=/; HttpOnly; Max-Age=0')
  return res
}
