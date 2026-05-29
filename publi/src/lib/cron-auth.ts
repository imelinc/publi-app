import { NextRequest } from 'next/server'

/**
 * Autoriza requests a endpoints de cron.
 *
 * En producción, Vercel Cron invoca con el header `x-vercel-cron: 1` (no manda
 * Authorization de forma confiable en el tier Hobby). En dev/preview o para
 * disparar el cron a mano, se acepta `Authorization: Bearer ${CRON_SECRET}`.
 */
export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  const secret = process.env.CRON_SECRET
  const hasSecret =
    !!secret && request.headers.get('authorization') === `Bearer ${secret}`
  return isVercelCron || hasSecret
}
