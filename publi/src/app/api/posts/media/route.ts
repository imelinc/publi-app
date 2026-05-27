import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/**
 * Sube una imagen al bucket `post-media` de Supabase Storage.
 * Devuelve la URL pública.
 *
 * Body: FormData con `file` (File)
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Form data inválido' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return Response.json({ error: 'No se envió ningún archivo' }, { status: 400 })
  }

  if (!ALLOWED_MIME.includes(file.type)) {
    return Response.json(
      { error: 'Formato no soportado. Usá JPG, PNG, WEBP o GIF.' },
      { status: 400 }
    )
  }

  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: 'La imagen es demasiado pesada (máximo 10 MB).' },
      { status: 400 }
    )
  }

  // Nombre único bajo carpeta del user para mantener orden y permitir RLS por owner
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('post-media')
    .upload(path, file, {
      contentType: file.type,
      cacheControl: '31536000', // 1 año
      upsert: false,
    })

  if (uploadError) {
    console.error('[POST /api/posts/media] upload failed:', uploadError)
    return Response.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('post-media')
    .getPublicUrl(path)

  return Response.json({ url: publicUrl, path }, { status: 201 })
}
