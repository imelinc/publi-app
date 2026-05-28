import { NextRequest } from 'next/server'

/**
 * Calcula el base URL del deploy actual, en orden de prioridad:
 *  1. `NEXT_PUBLIC_APP_URL` — útil cuando se configura un dominio custom.
 *  2. Headers de la request (`origin` o `host`) — siempre coincide con el
 *     dominio desde el que se accedió (Vercel preview, prod, localhost…).
 *  3. `VERCEL_URL` — fallback para entornos serverless sin headers.
 *  4. `http://localhost:3000` — último recurso en dev.
 *
 * Se usa tanto para armar el link de aprobación que recibe el cliente final
 * como para indicarle a QStash a qué URL debe hacer el callback al publicar.
 */
export function resolveBaseUrl(request: NextRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL

  const origin = request.headers.get('origin')
  if (origin) return origin

  const host = request.headers.get('host')
  if (host) {
    const proto = request.headers.get('x-forwarded-proto') ??
      (host.startsWith('localhost') ? 'http' : 'https')
    return `${proto}://${host}`
  }

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`

  return 'http://localhost:3000'
}
