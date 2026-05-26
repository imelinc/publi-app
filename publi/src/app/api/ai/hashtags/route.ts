import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase/server'

interface HashtagsBody {
  text: string
  clientId: string | null
  count: number
}

export async function POST(req: NextRequest) {
  try {
    const { text, clientId, count }: HashtagsBody = await req.json()

    let clientExtra = ''

    if (clientId) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: client } = await supabase
          .from('clients')
          .select('name')
          .eq('id', clientId)
          .eq('user_id', user.id)
          .single()

        if (client) {
          const { data: accounts } = await supabase
            .from('social_accounts')
            .select('network')
            .eq('client_id', clientId)

          const networks =
            accounts && accounts.length > 0
              ? accounts.map((a: { network: string }) => a.network).join(', ')
              : 'ninguna'
          clientExtra = ` Cliente activo: ${client.name}, redes: ${networks}.`
        }
      }
    }

    let systemPrompt =
      'Sos Copi, asistente de publi para Community Managers. Respondés en español rioplatense, conciso y creativo.'
    systemPrompt += clientExtra
    systemPrompt += ' Cuando reescribís copy ofrecés 2 variantes. Nunca uses relleno.'

    const userPrompt = `Generá ${count ?? 12} hashtags relevantes para este copy: "${text}". Respondé SOLO con JSON válido sin backticks: {"hashtags": ["#tag1", "#tag2", ...]}`

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
