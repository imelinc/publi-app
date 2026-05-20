import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase/server'

interface BestTimeBody {
  clientId: string | null
  networks: string[]
}

interface Recommendation {
  dayOfWeek: string
  time: string
  timezone: string
  reason: string
}

const DAYS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

/** Limpia backticks de markdown que Groq a veces agrega al JSON */
function extractJson(raw: string): string {
  return raw.replace(/^```(?:json)?\n?/i, '').replace(/```$/i, '').trim()
}

/** Genera un resumen legible del historial de publicaciones */
function buildHistorySummary(
  posts: Array<{ published_at: string | null; scheduled_at: string | null }>
): string {
  if (!posts.length) return ''

  const freq: Record<string, number> = {}
  const hours: number[] = []

  for (const post of posts) {
    const raw = post.published_at ?? post.scheduled_at
    if (!raw) continue
    const d = new Date(raw)
    const day = DAYS_ES[d.getUTCDay()]
    freq[day] = (freq[day] ?? 0) + 1
    hours.push(d.getUTCHours())
  }

  const topDays = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([day, n]) => `${day} (${n} posts)`)
    .join(', ')

  const avgHour =
    hours.length > 0 ? Math.round(hours.reduce((a, b) => a + b, 0) / hours.length) : null

  let summary = `Historial de publicación del cliente (${posts.length} posts): días más frecuentes: ${topDays}.`
  if (avgHour !== null) summary += ` Hora promedio de publicación: ${avgHour}:00 UTC.`

  return summary
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { clientId, networks } = body as BestTimeBody

    let clientExtra = ''
    let historySummary = ''

    if (clientId) {
      const { data: client } = await supabase
        .from('clients')
        .select('name')
        .eq('id', clientId)
        .eq('user_id', user.id)
        .single()

      if (client) {
        const { data: igAccount } = await supabase
          .from('instagram_accounts')
          .select('id')
          .eq('client_id', clientId)
          .maybeSingle()

        const connectedNetworks = igAccount ? 'instagram' : 'ninguna'
        clientExtra = ` Cliente activo: ${client.name}, redes: ${connectedNetworks}.`

        // Historial real de publicaciones del cliente
        const { data: publishedPosts } = await supabase
          .from('posts')
          .select('published_at, scheduled_at')
          .eq('client_id', clientId)
          .eq('status', 'published')
          .not('published_at', 'is', null)
          .order('published_at', { ascending: false })
          .limit(20)

        if (publishedPosts && publishedPosts.length > 0) {
          historySummary = buildHistorySummary(publishedPosts)
        }
      }
    }

    let systemPrompt =
      'Sos Copi, asistente de publi para Community Managers. Respondés en español rioplatense, conciso y creativo.'
    systemPrompt += clientExtra
    systemPrompt +=
      ' Para horarios: priorizás entre las 18 y 21hs como pico histórico de engagement en Argentina.'

    const historyContext = historySummary
      ? `\n\nDatos reales del cliente: ${historySummary}`
      : '\n\nNo hay historial previo de publicaciones; basate en datos generales de engagement para audiencias argentinas.'

    const userPrompt = `Sugerí el mejor horario para publicar en ${(networks ?? ['instagram']).join(', ')} para una audiencia argentina.${historyContext}
Respondé SOLO con JSON válido sin backticks: {"recommendation": {"dayOfWeek": "...", "time": "19:00", "timezone": "America/Buenos_Aires", "reason": "..."}}`

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    })

    const raw = completion.choices[0]?.message?.content ?? ''
    const parsed: { recommendation: Recommendation } = JSON.parse(extractJson(raw))

    return Response.json({ recommendation: parsed.recommendation }, { status: 200 })
  } catch (err) {
    const message = err instanceof SyntaxError ? 'Respuesta inválida del modelo' : 'Error interno'
    return Response.json({ error: message }, { status: 500 })
  }
}
