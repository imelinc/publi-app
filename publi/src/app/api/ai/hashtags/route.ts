import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase/server'

interface HashtagsBody {
  text: string
  clientId: string | null
  count: number
}

interface HashtagsGrouoped {
  highReach: string[]
  mediumReach: string[]
  niche: string[]
}

interface HashtagsResponse {
  hashtags: string[]
  grouped: HashtagsGrouoped
}

/** Limpia backticks de markdown que Groq a veces agrega al JSON */
function extractJson(raw: string): string {
  return raw.replace(/^```(?:json)?\n?/i, '').replace(/```$/i, '').trim()
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { text, clientId, count } = body as HashtagsBody

    if (!text?.trim()) {
      return Response.json({ error: 'El campo text es requerido' }, { status: 400 })
    }

    const total = count ?? 12

    let clientExtra = ''

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

        const networks = igAccount ? 'instagram' : 'ninguna'
        clientExtra = ` Cliente activo: ${client.name}, redes: ${networks}.`
      }
    }

    let systemPrompt =
      'Sos Copi, asistente de publi para Community Managers. Respondés en español rioplatense, conciso y creativo.'
    systemPrompt += clientExtra
    systemPrompt +=
      ' Para hashtags: balanceá siempre entre hashtags de alto alcance (>500k posts), alcance medio (50k-500k) y nicho (<50k).'

    const userPrompt = `Generá ${total} hashtags relevantes para este copy de Instagram: "${text}".
Distribuí en: ~${Math.ceil(total * 0.3)} de alto alcance, ~${Math.ceil(total * 0.4)} de alcance medio, ~${Math.floor(total * 0.3)} de nicho.
Respondé SOLO con JSON válido sin backticks:
{
  "hashtags": ["#tag1", "#tag2", ...],
  "grouped": {
    "highReach": ["#tag1"],
    "mediumReach": ["#tag2"],
    "niche": ["#tag3"]
  }
}`

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
    const parsed: HashtagsResponse = JSON.parse(extractJson(raw))

    return Response.json(
      {
        hashtags: parsed.hashtags ?? [],
        grouped: parsed.grouped ?? { highReach: [], mediumReach: [], niche: [] },
      },
      { status: 200 }
    )
  } catch (err) {
    const message = err instanceof SyntaxError ? 'Respuesta inválida del modelo' : 'Error interno'
    return Response.json({ error: message }, { status: 500 })
  }
}
