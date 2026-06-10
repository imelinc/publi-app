import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { resolveBaseUrl } from '@/lib/url'
import {
  isFacebookConfigured,
  buildFacebookAuthorizeUrl,
  resolveFacebookRedirectUri,
} from '@/lib/facebook'

/**
 * GET /api/facebook/connect?clientId=...
 *
 * Inicia el OAuth de Facebook. Se dispara con una navegación full-page desde
 * el frontend (window.location.href), no con fetch, porque termina en un 302
 * hacia Facebook.
 */
export async function GET(request: NextRequest) {
  const baseUrl = resolveBaseUrl(request)
  const clientesUrl = `${baseUrl}/clientes`

  // App no configurada (falta la app de Meta / env vars).
  if (!isFacebookConfigured()) {
    return Response.redirect(`${clientesUrl}?fb_error=not_configured`, 302)
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.redirect(`${baseUrl}/login`, 302)
  }

  const clientId = request.nextUrl.searchParams.get('clientId')
  if (!clientId) {
    return Response.redirect(`${clientesUrl}?fb_error=token`, 302)
  }

  // Ownership del cliente
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('user_id', user.id)
    .single()
  if (clientErr || !client) {
    return Response.redirect(`${clientesUrl}?fb_error=token`, 302)
  }

  // CSRF: nonce en cookie httpOnly + en el state. Se compara en el callback.
  const nonce = randomBytes(16).toString('hex')
  const state = `${clientId}:${nonce}`
  const redirectUri = resolveFacebookRedirectUri(baseUrl)
  const authorizeUrl = buildFacebookAuthorizeUrl(redirectUri, state)

  const res = new Response(null, {
    status: 302,
    headers: { Location: authorizeUrl },
  })
  res.headers.append(
    'Set-Cookie',
    `fb_oauth_state=${nonce}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${
      baseUrl.startsWith('https') ? '; Secure' : ''
    }`
  )
  return res
}
