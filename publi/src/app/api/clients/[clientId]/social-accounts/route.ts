import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import type { Network } from '@/types'

interface RouteParams {
  params: Promise<{ clientId: string }>
}

const VALID_NETWORKS: Network[] = [
  'instagram',
  'facebook',
  'tiktok',
  'x',
  'linkedin',
  'youtube',
]

// Regex oficial de Instagram para handles:
// 1-30 chars, alfanuméricos + . + _, no empieza con punto, no tiene ..
const INSTAGRAM_HANDLE_REGEX = /^(?!\.)(?!.*\.\.)[a-zA-Z0-9._]{1,30}$/

function normalizeUsername(raw: string): string {
  // Sacar @ inicial si lo hay y trim
  return raw.trim().replace(/^@/, '')
}

function buildAvatarUrl(username: string, clientColor: string): string {
  const bg = clientColor.replace(/^#/, '')
  const name = encodeURIComponent(username)
  return `https://ui-avatars.com/api/?name=${name}&background=${bg}&color=fff&bold=true`
}

// ─── GET ──────────────────────────────────────────────────────────────────────
/**
 * Lista las cuentas conectadas del cliente.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { clientId } = await params

  // Verificar ownership del cliente
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('user_id', user.id)
    .single()

  if (clientErr || !client) {
    return Response.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  const { data: accounts, error: accErr } = await supabase
    .from('social_accounts')
    .select('id, client_id, network, external_user_id, username, avatar_url, is_simulated, token_expires_at, connected_at')
    .eq('client_id', clientId)
    .order('connected_at', { ascending: true })

  if (accErr) {
    return Response.json({ error: accErr.message }, { status: 500 })
  }

  // Mapear a camelCase para el frontend
  const result = (accounts ?? []).map((a) => ({
    id: a.id,
    clientId: a.client_id,
    network: a.network,
    externalUserId: a.external_user_id,
    username: a.username,
    avatarUrl: a.avatar_url,
    isSimulated: a.is_simulated,
    tokenExpiresAt: a.token_expires_at,
    connectedAt: a.connected_at,
  }))

  return Response.json({ data: result })
}

// ─── POST ─────────────────────────────────────────────────────────────────────
/**
 * Crea una conexión simulada de red social.
 * Body: { network, username }
 */
interface CreateBody {
  network: Network
  username: string
  password: string
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { clientId } = await params
  const body: CreateBody = await request.json()

  // Validar network
  if (!body.network || !VALID_NETWORKS.includes(body.network)) {
    return Response.json({ error: 'Red social inválida' }, { status: 400 })
  }

  // Verificar ownership del cliente y obtener su color
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('id, color')
    .eq('id', clientId)
    .eq('user_id', user.id)
    .single()

  if (clientErr || !client) {
    return Response.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  // Normalizar y validar username
  const username = normalizeUsername(body.username ?? '')
  if (!username) {
    return Response.json({ error: 'El nombre de usuario es obligatorio' }, { status: 400 })
  }

  if (body.network === 'instagram' && !INSTAGRAM_HANDLE_REGEX.test(username)) {
    return Response.json(
      {
        error:
          'Usuario de Instagram inválido. Solo letras, números, puntos y guiones bajos (1-30 caracteres).',
      },
      { status: 400 }
    )
  }

  // Validar contraseña: obligatoria en todas las redes para consistencia del flujo.
  // Para redes simuladas no tiene significado funcional, pero se exige igual.
  // Para Instagram (cuando se implemente OAuth real) se intercambiará por un token aquí mismo
  // y se descartará. En NINGÚN caso la guardamos en la DB.
  const password = (body.password ?? '').toString()
  if (!password.trim()) {
    return Response.json({ error: 'La contraseña es obligatoria' }, { status: 400 })
  }
  // `password` queda en scope local del request y se descarta al finalizar la función.

  // Generar datos simulados
  const externalUserId = `sim_${body.network}_${randomBytes(3).toString('hex')}`
  const avatarUrl = buildAvatarUrl(username, client.color)

  // Insertar (puede fallar por UNIQUE constraint si ya hay una cuenta de esa red)
  const { data: account, error: insertErr } = await supabase
    .from('social_accounts')
    .insert({
      client_id: clientId,
      network: body.network,
      external_user_id: externalUserId,
      username,
      avatar_url: avatarUrl,
      is_simulated: true,
      access_token: null,
      token_expires_at: null,
    })
    .select('id, client_id, network, external_user_id, username, avatar_url, is_simulated, token_expires_at, connected_at')
    .single()

  if (insertErr) {
    // Código 23505 = unique_violation en Postgres
    if (insertErr.code === '23505') {
      return Response.json(
        { error: `Este cliente ya tiene una cuenta de ${body.network} conectada` },
        { status: 409 }
      )
    }
    return Response.json({ error: insertErr.message }, { status: 500 })
  }

  // Verificación post-insert SOLO para Instagram (defensive check)
  if (body.network === 'instagram') {
    const { data: confirm } = await supabase
      .from('social_accounts')
      .select('username')
      .eq('id', account.id)
      .single()

    if (!confirm || confirm.username !== username) {
      // Rollback manual: borrar la fila creada
      await supabase.from('social_accounts').delete().eq('id', account.id)
      return Response.json(
        { error: 'No se pudo confirmar la persistencia del usuario de Instagram' },
        { status: 500 }
      )
    }
  }

  return Response.json(
    {
      data: {
        id: account.id,
        clientId: account.client_id,
        network: account.network,
        externalUserId: account.external_user_id,
        username: account.username,
        avatarUrl: account.avatar_url,
        isSimulated: account.is_simulated,
        tokenExpiresAt: account.token_expires_at,
        connectedAt: account.connected_at,
      },
    },
    { status: 201 }
  )
}
