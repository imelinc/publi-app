import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import type { Network, Plan } from '@/types'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: rawClients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (clientsError) {
      console.error('[GET /api/clients] clients query failed:', clientsError)
      return Response.json({
        error: clientsError.message,
        code: clientsError.code,
        details: clientsError.details,
        hint: clientsError.hint,
        step: 'clients',
      }, { status: 500 })
    }

    const clients = rawClients ?? []
    const clientIds = clients.map((c: { id: string }) => c.id)

    const safeIds = clientIds.length > 0 ? clientIds : ['00000000-0000-0000-0000-000000000000']

    const { data: rawPostCounts, error: postsError } = await supabase
      .from('posts')
      .select('client_id, status')
      .in('client_id', safeIds)

    if (postsError) {
      console.error('[GET /api/clients] posts query failed:', postsError)
    }

    const postCounts = rawPostCounts ?? []

    const { data: rawSocialAccounts, error: saError } = await supabase
      .from('social_accounts')
      .select('client_id, network')
      .in('client_id', safeIds)

    if (saError) {
      console.error('[GET /api/clients] social_accounts query failed:', saError)
    }

    const socialAccounts = rawSocialAccounts ?? []

    // Agrupar redes por client_id: una cuenta por (cliente × red)
    const networksByClient = new Map<string, Network[]>()
    for (const acc of socialAccounts as { client_id: string; network: Network }[]) {
      const arr = networksByClient.get(acc.client_id) ?? []
      arr.push(acc.network)
      networksByClient.set(acc.client_id, arr)
    }

    const statsMap = new Map<string, { scheduled: number; drafts: number; published: number }>()
    for (const post of postCounts) {
      const typed = post as { client_id: string; status: string }
      if (!statsMap.has(typed.client_id)) {
        statsMap.set(typed.client_id, { scheduled: 0, drafts: 0, published: 0 })
      }
      const entry = statsMap.get(typed.client_id)!
      if (typed.status === 'scheduled') entry.scheduled++
      else if (typed.status === 'draft') entry.drafts++
      else if (typed.status === 'published') entry.published++
    }

    const result = clients.map((c: { id: string; name: string; color: string; plan: Plan; created_at: string }) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      plan: c.plan,
      createdAt: c.created_at,
      initials: c.name.slice(0, 2).toUpperCase(),
      connectedNetworks: networksByClient.get(c.id) ?? ([] as Network[]),
      stats: statsMap.get(c.id) ?? { scheduled: 0, drafts: 0, published: 0 },
    }))

    return Response.json({ data: result }, { status: 200 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[GET /api/clients] unexpected error:', err)
    return Response.json({ error: msg, step: 'exception' }, { status: 500 })
  }
}

interface CreateClientBody {
  name: string
  color: string
  networks?: Network[]
  plan?: Plan
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: CreateClientBody = await request.json()

  if (!body.name || body.name.trim() === '') {
    return Response.json({ error: 'El nombre es obligatorio' }, { status: 400 })
  }

  const { data: client, error: insertError } = await supabase
    .from('clients')
    .insert({
      user_id: user.id,
      name: body.name.trim(),
      color: body.color,
      plan: body.plan ?? 'free',
    })
    .select()
    .single()

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 })
  }

  const result = {
    id: client.id,
    name: client.name,
    color: client.color,
    plan: client.plan,
    createdAt: client.created_at,
    initials: client.name.slice(0, 2).toUpperCase(),
    connectedNetworks: [] as Network[],
    stats: { scheduled: 0, drafts: 0, published: 0 },
  }

  return Response.json({ data: result }, { status: 201 })
}
