import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const meta = user.user_metadata ?? {}
  const name: string =
    meta.full_name ?? meta.name ?? user.email?.split('@')[0] ?? 'Usuario'

  const words = name.trim().split(/\s+/)
  const initials = (
    (words[0]?.[0] ?? '') + (words.length > 1 ? (words[1]?.[0] ?? '') : '')
  ).toUpperCase()

  return NextResponse.json({
    id: user.id,
    email: user.email ?? '',
    name,
    initials,
    avatarUrl: meta.avatar_url ?? null,
  })
}
