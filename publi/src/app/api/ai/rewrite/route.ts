import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase/server'

interface RewriteBody {
  text: string
  clientId: string | null
  tone: string | null
  networks?: string[]
}

interface RewriteSuggestion {
  text: string
  label: string
}

export async function POST(req: NextRequest) {
  try {
    const { text, clientId, tone, networks }: RewriteBody = await req.json()

    let clientExtra = ''
    let targetNetworksDesc = ''

    if (networks && networks.length > 0) {
      targetNetworksDesc = networks.join(', ')
    }

    if (clientId) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: client } = await supabase
          .from('clients')
          .select('name, descriptions')
          .eq('id', clientId)
          .eq('user_id', user.id)
          .single()

        if (client) {
          const { data: accounts } = await supabase
            .from('social_accounts')
            .select('network')
            .eq('client_id', clientId)

          const connectedNetworks =
            accounts && accounts.length > 0
              ? accounts.map((a: { network: string }) => a.network).join(', ')
              : 'ninguna'
          
          if (!targetNetworksDesc) {
            targetNetworksDesc = connectedNetworks
          }

          clientExtra = ` Cliente activo: ${client.name}.`
          if (client.descriptions) {
            clientExtra += ` Descripción del cliente: ${client.descriptions}`
          }
        }
      }
    }

    if (!targetNetworksDesc) {
      targetNetworksDesc = 'redes sociales generales'
    }

    let systemPrompt =
      'Sos Copi, asistente de publi para Community Managers. Respondés en español rioplatense, conciso y creativo.'
    systemPrompt += clientExtra
    systemPrompt += ` El contenido a reescribir está destinado a las siguientes redes sociales: ${targetNetworksDesc}. Asegurate de adaptar el copy a los formatos, límites, estilos y público de estas plataformas (por ejemplo, Instagram requiere engagement y emojis; Twitter/X exige concisión y un estilo más directo; TikTok requiere ganchos dinámicos y lenguaje fresco; LinkedIn un tono corporativo pero empático; etc.).`
    systemPrompt += ' Cuando reescribís copy ofrecés 2 variantes. Nunca uses relleno.'

    const userPrompt = `Reescribí este copy para ${targetNetworksDesc}: "${text}".${tone ? ` Tono preferido: ${tone}.` : ''} Respondé SOLO con JSON válido sin backticks: {"suggestions": [{"text": "...", "label": "Más formal"}, {"text": "...", "label": "Más dinámico"}]}`

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
