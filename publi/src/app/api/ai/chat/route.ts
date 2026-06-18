import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase/server'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatBody {
  message: string
  clientId: string | null
  history: ChatMessage[]
  network?: string
}

export async function POST(req: NextRequest) {
  try {
    const { message, clientId, history, network }: ChatBody = await req.json()

    let clientContext = ''
    let networkContext = ''

    if (network && network !== 'general') {
      networkContext = `

TRABAJO ACTUAL EN RED SOCIAL: ${network.toUpperCase()}
Asegurate de adaptar todo tu asesoramiento, copies, hashtags, formatos de posts (por ejemplo, hilos en X/Twitter, posts profesionales en LinkedIn, ganchos dinámicos en TikTok, etc.) y recomendaciones de horarios específicamente para el público, limitaciones técnicas y mejores prácticas de ${network.toUpperCase()}.`
    }

    if (clientId) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: client } = await supabase
          .from('clients')
          .select('id, name, plan, color, descriptions')
          .eq('id', clientId)
          .eq('user_id', user.id)
          .single()

        if (client) {
          const { data: accounts } = await supabase
            .from('social_accounts')
            .select('network')
            .eq('client_id', client.id)

          const connectedNetworks =
            accounts && accounts.length > 0
              ? accounts.map((a: { network: string }) => a.network).join(', ')
              : 'ninguna'

          const { data: recentPosts } = await supabase
            .from('posts')
            .select('title, status')
            .eq('client_id', client.id)
            .order('created_at', { ascending: false })
            .limit(3)

          const recentSummary = (recentPosts ?? [])
            .map((p: { title: string; status: string }) => `"${p.title}" (${p.status})`)
            .join(', ')

          clientContext = `

CLIENTE ACTIVO: ${client.name}
Redes conectadas: ${connectedNetworks}
Plan: ${client.plan}
Posts recientes: ${recentSummary || 'ninguno'}${client.descriptions ? `\nDescripción: ${client.descriptions}` : ''}`
        }
      }
    }

    const systemPrompt = `Sos Copi, el asistente de IA de publi — una plataforma de gestión de redes sociales para Community Managers freelance.
Tu rol es ayudar al CM con:

- Ideas y estrategia de contenido
- Redacción de copy para posts de Instagram, TikTok, LinkedIn, Facebook y otras redes
- Sugerencias de hashtags (balanceá alto alcance, medio y nicho)
- Recomendaciones de horarios de publicación (pico histórico en Argentina: 18-21hs)
- Análisis de métricas y rendimiento
- Estrategia de contenido mensual

Siempre respondés en español rioplatense, de forma concisa, directa y accionable.
No usás relleno ni frases vacías. Sos creativo, profesional y levemente divertido.
Nunca inventás métricas. Si no tenés datos, lo decís.${clientContext}${networkContext}`

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
