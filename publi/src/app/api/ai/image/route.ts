import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prompt, clientId } = await request.json()
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return Response.json({ error: 'El prompt es requerido' }, { status: 400 })
    }

    if (!clientId) {
      return Response.json({ error: 'El ID del cliente es requerido' }, { status: 400 })
    }

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('plan')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single()

    if (clientError || !client) {
      return Response.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    if (client.plan === 'free') {
      return Response.json({ error: 'El plan gratuito no incluye acceso a la IA.' }, { status: 403 })
    }

    const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
    const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN

    if (!ACCOUNT_ID || !API_TOKEN) {
      return Response.json({ error: 'Faltan las credenciales de Cloudflare' }, { status: 500 })
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('Cloudflare AI Error:', response.status, errorText)
      return Response.json({ error: 'Error al generar la imagen desde la IA' }, { status: 500 })
    }

    // Cloudflare devuelve un JSON con la imagen en base64 en result.image cuando se llama por REST API
    const json = await response.json()
    if (!json.success || !json.result?.image) {
      console.error('Cloudflare AI Error:', json.errors || 'Respuesta de Cloudflare vacía o sin éxito')
      return Response.json({ error: 'Error al generar la imagen desde la IA' }, { status: 500 })
    }

    return Response.json({ 
      image: `data:image/png;base64,${json.result.image}` 
    })
  } catch (error) {
    console.error('API Error in image generation:', error)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
