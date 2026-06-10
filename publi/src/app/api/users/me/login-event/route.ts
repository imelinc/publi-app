import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Obtener perfil existente
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('login_count')
    .eq('id', user.id)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    // Si hay un error que no sea "row not found", retornar error
    return Response.json({ error: fetchError.message }, { status: 500 })
  }

  const currentCount = profile?.login_count ?? 0
  const newCount = currentCount + 1

  console.log(`[Metrics Tracking] Incrementing login count for user ${user.id} from ${currentCount} to ${newCount}`);

  try {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ login_count: newCount })
      .eq('id', user.id)

    if (updateError) {
      // Manejo defensivo si la columna aún no existe
      console.warn('Failed to update login_count (column may not exist yet):', updateError.message)
      return Response.json({ success: false, warning: 'Database column might be missing', count: 0 })
    }

    return Response.json({ success: true, count: newCount })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn('Database error while updating login_count:', msg)
    return Response.json({ success: false, warning: 'Database exception', count: 0 })
  }
}
