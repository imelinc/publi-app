import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'
import { WORKSPACES } from '@/lib/mock-data'

interface RewriteBody {
  text: string
  clientId: string | null
  tone: string | null
}

interface RewriteSuggestion {
  text: string
  label: string
}

export async function POST(req: NextRequest) {
  try {
    const { text, clientId, tone }: RewriteBody = await req.json()

    const workspace = clientId
      ? WORKSPACES.find((w) => w.id === clientId) ?? null
      : null

    let systemPrompt =
      'Sos Copi, asistente de publi para Community Managers. Respondés en español rioplatense, conciso y creativo.'

    if (workspace) {
      systemPrompt += ` Cliente activo: ${workspace.name}, redes: ${workspace.networks.join(', ')}.`
    }

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
    const parsed: { suggestions: RewriteSuggestion[] } = JSON.parse(raw)

    return Response.json({ suggestions: parsed.suggestions }, { status: 200 })
  } catch {
    return Response.json({ error: 'Error interno' }, { status: 500 })
  }
}
