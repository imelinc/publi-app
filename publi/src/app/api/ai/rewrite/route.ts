import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase/server'

interface RewriteBody {
  text: string
  clientId: string | null
  tone: string | null
}

interface RewriteSuggestion {
  text: string
  label: string
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
    const { text, clientId, tone } = body as RewriteBody

    if (!text?.trim()) {
      return Response.json({ error: 'El campo text es requerido' }, { status: 400 })
    }

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
    systemPrompt += ' Cuando reescribís copy ofrecés 2 variantes. Nunca uses relleno.'

    const userPrompt = `Reescribí este copy para redes sociales: "${text}".${tone ? ` Tono preferido: ${tone}.` : ''} Respondé SOLO con JSON válido sin backticks: {"suggestions": [{"text": "...", "label": "Más formal"}, {"text": "...", "label": "Más dinámico"}]}`

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
    const parsed: { suggestions: RewriteSuggestion[] } = JSON.parse(extractJson(raw))

    return Response.json({ suggestions: parsed.suggestions }, { status: 200 })
  } catch (err) {
    const message = err instanceof SyntaxError ? 'Respuesta inválida del modelo' : 'Error interno'
    return Response.json({ error: message }, { status: 500 })
  }
}
