import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { seconds } = await request.json()
  if (typeof seconds !== 'number' || seconds <= 0) {
    return Response.json({ error: 'Invalid seconds value' }, { status: 400 })
  }

  // Obtener perfil existente
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('time_spent_creating')
    .eq('id', user.id)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    return Response.json({ error: fetchError.message }, { status: 500 })
  }

  const currentTime = profile?.time_spent_creating ?? 0
  const newTime = currentTime + seconds

  console.log(`[Metrics Tracking] Incrementing creation time for user ${user.id} by ${seconds} seconds (total: ${newTime}s)`);

  try {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ time_spent_creating: newTime })
      .eq('id', user.id)

    if (updateError) {
      // Manejo defensivo si la columna aún no existe
      console.warn('Failed to update time_spent_creating (column may not exist yet):', updateError.message)
      return Response.json({ success: false, warning: 'Database column might be missing', timeSpent: 0 })
    }

    return Response.json({ success: true, timeSpent: newTime })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn('Database error while updating time_spent_creating:', msg)
    return Response.json({ success: false, warning: 'Database exception', timeSpent: 0 })
  }
}
