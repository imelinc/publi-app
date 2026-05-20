import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getProfileResponse,
  mapPatchBodyToDb,
  type PatchProfileBody,
} from '@/lib/profile'
import { NextRequest } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { profile, error: profileError } = await getProfileResponse(
    supabase,
    user
  )

  if (profileError || !profile) {
    return Response.json(
      { error: profileError ?? 'Error al cargar perfil' },
      { status: 500 }
    )
  }

  return Response.json(profile)
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: PatchProfileBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const dbUpdate = mapPatchBodyToDb(body)
  if (Object.keys(dbUpdate).length === 0) {
    return Response.json({ error: 'No hay campos para actualizar' }, { status: 400 })
  }

  const { error: ensureError } = await getProfileResponse(supabase, user)
  if (ensureError) {
    return Response.json({ error: ensureError }, { status: 500 })
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(dbUpdate)
    .eq('id', user.id)

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 })
  }

  const { profile, error: profileError } = await getProfileResponse(
    supabase,
    user
  )

  if (profileError || !profile) {
    return Response.json(
      { error: profileError ?? 'Error al cargar perfil' },
      { status: 500 }
    )
  }

  return Response.json(profile)
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)

  if (deleteError) {
    return Response.json({ error: deleteError.message }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}
