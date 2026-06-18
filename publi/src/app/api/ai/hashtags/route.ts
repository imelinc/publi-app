import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase/server'

interface HashtagsBody {
  text: string
  clientId: string | null
  count: number
  networks?: string[]
}

export async function POST(req: NextRequest) {
  try {
    const { text, clientId, count, networks }: HashtagsBody = await req.json()

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
    systemPrompt += ` El contenido y los hashtags a generar están destinados a las siguientes redes sociales: ${targetNetworksDesc}. Recordá que la cantidad, tipo y efectividad de los hashtags varía por red (por ejemplo, Instagram y TikTok se benefician de más hashtags de nicho y tendencia; LinkedIn prefiere pocos hashtags y de corte profesional; Twitter/X prefiere pocos y muy específicos debido al límite de caracteres; etc.).`
    systemPrompt += ' Cuando reescribís copy ofrecés 2 variantes. Nunca uses relleno.'

    const userPrompt = `Generá ${count ?? 12} hashtags relevantes para este copy optimizados para las redes sociales (${targetNetworksDesc}): "${text}". Respondé SOLO con JSON válido sin backticks: {"hashtags": ["#tag1", "#tag2", ...]}`

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
    const parsed: { hashtags: string[] } = JSON.parse(raw)

    return Response.json({ hashtags: parsed.hashtags }, { status: 200 })
  } catch {
    return Response.json({ error: 'Error interno' }, { status: 500 })
  }
}
