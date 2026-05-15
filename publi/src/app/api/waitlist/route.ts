import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const { fullName, email, clientCount, currentTools } = body as {
    fullName?: string
    email?: string
    clientCount?: string
    currentTools?: string
  }

  if (!fullName?.trim() || !email?.trim()) {
    return NextResponse.json(
      { error: 'fullName y email son requeridos' },
      { status: 400 }
    )
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase.from('waitlist').insert({
    full_name: fullName.trim(),
    email: email.trim().toLowerCase(),
    client_count: clientCount ?? null,
    current_tools: currentTools?.trim() ?? null,
  })

  if (error) {
    // Unique constraint violation en email
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Este email ya está en la lista' },
        { status: 409 }
      )
    }
    console.error('[waitlist] insert error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }

  const { count } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true })

  return NextResponse.json(
    {
      message: '¡Te anotaste! Te avisamos cuando tu acceso esté listo.',
      position: count ?? 1,
    },
    { status: 201 }
  )
}
