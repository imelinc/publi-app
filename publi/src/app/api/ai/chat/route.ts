import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'
import { WORKSPACES, POSTS } from '@/lib/mock-data'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatBody {
  message: string
  clientId: string | null
  history: ChatMessage[]
}

export async function POST(req: NextRequest) {
  try {
    const { message, clientId, history }: ChatBody = await req.json()

    const workspace = clientId
      ? WORKSPACES.find((w) => w.id === clientId) ?? null
      : null

    let systemPrompt = `Sos Copi, el asistente de IA de publi — una plataforma de gestión de redes sociales para Community Managers freelance.
Tu rol es ayudar al CM con:

- Ideas y estrategia de contenido
- Redacción de copy para posts de Instagram, TikTok, LinkedIn, Facebook y otras redes
- Sugerencias de hashtags (balanceá alto alcance, medio y nicho)
- Recomendaciones de horarios de publicación (pico histórico en Argentina: 18-21hs)
- Análisis de métricas y rendimiento
- Estrategia de contenido mensual

Siempre respondés en español rioplatense, de forma concisa, directa y accionable.
No usás relleno ni frases vacías. Sos creativo, profesional y levemente divertido.
Nunca inventás métricas. Si no tenés datos, lo decís.`

    if (workspace) {
      const clientPosts = POSTS.filter((p) => p.workspaceId === workspace.id)
      const recentPostsSummary = clientPosts
        .slice(0, 3)
        .map((p) => `"${p.title}" (${p.status})`)
        .join(', ')

      systemPrompt += `

CLIENTE ACTIVO: ${workspace.name}
Redes conectadas: ${workspace.networks.join(', ')}
Plan: ${workspace.plan}
Posts recientes: ${recentPostsSummary || 'ninguno'}`
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1000,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message },
      ],
    })

    const reply = completion.choices[0]?.message?.content ?? ''

    return Response.json({ reply }, { status: 200 })
  } catch {
    return Response.json({ error: 'Error interno' }, { status: 500 })
  }
}
