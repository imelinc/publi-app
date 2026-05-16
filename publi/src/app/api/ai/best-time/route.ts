import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'
import { WORKSPACES } from '@/lib/mock-data'

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

export async function POST(req: NextRequest) {
  try {
    const { clientId, networks }: BestTimeBody = await req.json()

    const workspace = clientId
      ? WORKSPACES.find((w) => w.id === clientId) ?? null
      : null

    let systemPrompt =
      'Sos Copi, asistente de publi para Community Managers. Respondés en español rioplatense, conciso y creativo.'

    if (workspace) {
      systemPrompt += ` Cliente activo: ${workspace.name}, redes: ${workspace.networks.join(', ')}.`
    }

    systemPrompt += ' Cuando reescribís copy ofrecés 2 variantes. Nunca uses relleno.'

    const userPrompt = `Sugerí el mejor horario para publicar en ${networks.join(', ')} para una audiencia argentina. Respondé SOLO con JSON válido sin backticks: {"recommendation": {"dayOfWeek": "...", "time": "19:00", "timezone": "America/Buenos_Aires", "reason": "..."}}`

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
    const parsed: { recommendation: Recommendation } = JSON.parse(raw)

    return Response.json({ recommendation: parsed.recommendation }, { status: 200 })
  } catch {
    return Response.json({ error: 'Error interno' }, { status: 500 })
  }
}
