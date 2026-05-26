import { createClient } from '@supabase/supabase-js'

/**
 * Cliente de Supabase con service role key.
 * ⚠️ Bypasa Row Level Security — usar SOLO en API routes del servidor.
 * NUNCA exponer en código del cliente (browser).
 *
 * Usar cuando el request no tiene sesión de usuario (ej: endpoint público
 * de aprobación donde el cliente final accede con un token en la URL).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
