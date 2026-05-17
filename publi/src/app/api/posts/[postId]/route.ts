import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ postId: string }>
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { postId } = await params

  const { data: post, error: findErr } = await supabase
    .from('posts')
    .select('id, client_id')
    .eq('id', postId)
    .single()

  if (findErr || !post) {
    return Response.json({ error: 'Post no encontrado' }, { status: 404 })
  }

  const { error: ownerErr } = await supabase
    .from('clients')
    .select('id')
    .eq('id', post.client_id)
    .eq('user_id', user.id)
    .single()

  if (ownerErr) {
    return Response.json({ error: 'Post no encontrado' }, { status: 404 })
  }

  const { error: deleteErr } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)

  if (deleteErr) {
    return Response.json({ error: deleteErr.message }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}
