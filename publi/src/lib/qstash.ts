import { Client, Receiver } from '@upstash/qstash'

/**
 * Integración con Upstash QStash para el scheduling de publicaciones.
 *
 * QStash es event-driven: cuando se programa un post se encola un job HTTP
 * con `notBefore` = la fecha de publicación. Cuando llega ese momento, QStash
 * hace POST a `/api/qstash/publish/[postId]` y ahí se ejecuta la publicación
 * (hoy simulada, en el futuro real).
 *
 * Límite del plan free: el delay máximo es de 7 días. Por eso solo encolamos
 * lo que esté dentro de la ventana (`shouldEnqueueNow`); lo más lejano queda
 * sin encolar (qstash_message_id = NULL) y un cron diario lo barre cuando entra
 * en ventana.
 */

// Margen de seguridad bajo el límite duro de 7 días de QStash free.
const ENQUEUE_WINDOW_MS = 6.5 * 24 * 60 * 60 * 1000

let _client: Client | null = null

function getQStashClient(): Client {
  if (_client) return _client
  const token = process.env.QSTASH_TOKEN
  if (!token) {
    throw new Error('QSTASH_TOKEN no está configurado en las variables de entorno')
  }
  // baseUrl: respeta QSTASH_URL para apuntar al server local de desarrollo
  // (npx @upstash/qstash-cli dev). Sin esto, los jobs no llegarían en local.
  _client = new Client({
    token,
    ...(process.env.QSTASH_URL ? { baseUrl: process.env.QSTASH_URL } : {}),
  })
  return _client
}

/**
 * ¿La fecha programada está suficientemente cerca como para encolarla ya en
 * QStash? True si falta ≤ 6.5 días (y la fecha es futura).
 */
export function shouldEnqueueNow(scheduledAt: string): boolean {
  const ts = new Date(scheduledAt).getTime()
  if (isNaN(ts)) return false
  const diff = ts - Date.now()
  return diff <= ENQUEUE_WINDOW_MS
}

/**
 * Encola en QStash el job que va a publicar `postId` en `scheduledAt`.
 * Devuelve el `messageId` para guardarlo en la fila del post.
 */
export async function enqueuePostPublish(
  postId: string,
  scheduledAt: string,
  baseUrl: string
): Promise<string> {
  const client = getQStashClient()
  const notBefore = Math.floor(new Date(scheduledAt).getTime() / 1000)
  const res = await client.publishJSON({
    url: `${baseUrl}/api/qstash/publish/${postId}`,
    body: { postId },
    notBefore,
  })
  // Para una URL simple, publishJSON devuelve un único objeto con messageId.
  // (Para url groups devolvería un array, que acá no usamos.)
  const messageId = Array.isArray(res) ? res[0]?.messageId : res.messageId
  if (!messageId) {
    throw new Error('QStash no devolvió un messageId')
  }
  return messageId
}

/**
 * Cancela un job encolado. Idempotente: si el mensaje ya no existe (porque ya
 * se entregó o ya se canceló), no propaga el error.
 */
export async function cancelPostPublish(messageId: string): Promise<void> {
  const client = getQStashClient()
  try {
    await client.messages.delete(messageId)
  } catch (err) {
    // Un 404 (mensaje ya entregado/cancelado) no es un error para nosotros.
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('404') || msg.toLowerCase().includes('not found')) return
    throw err
  }
}

/**
 * Verifica la firma HMAC de una request entrante de QStash usando las dos
 * signing keys. Protege el endpoint de callback de llamadas falsas.
 */
export async function verifyQStashSignature(request: Request, rawBody: string): Promise<boolean> {
  const signature = request.headers.get('upstash-signature')
  if (!signature) return false

  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY
  if (!currentSigningKey || !nextSigningKey) {
    throw new Error('Las signing keys de QStash no están configuradas')
  }

  const receiver = new Receiver({ currentSigningKey, nextSigningKey })
  try {
    return await receiver.verify({ signature, body: rawBody })
  } catch {
    return false
  }
}

/** Estado mínimo del post que necesita la sincronización de cola. */
export interface SchedulingState {
  status: string
  scheduled_at: string | null
  qstash_message_id: string | null
}

/**
 * Dada la transición de un post (estado/fecha viejos → nuevos), decide qué
 * hacer con la cola de QStash y devuelve el `qstash_message_id` que hay que
 * persistir (string si quedó encolado, null si no).
 *
 * Tira si una operación de QStash falla → el endpoint hace rollback y responde 503.
 */
export async function syncQStashForUpdate(
  postId: string,
  oldState: SchedulingState,
  newStatus: string,
  newScheduledAt: string | null,
  baseUrl: string
): Promise<string | null> {
  const oldMessageId = oldState.qstash_message_id
  const willBeScheduled = newStatus === 'scheduled' && !!newScheduledAt
  const inWindow = willBeScheduled && shouldEnqueueNow(newScheduledAt as string)

  // Caso 1: deja de estar programado (o salió de ventana) → cancelar lo viejo.
  if (!inWindow) {
    if (oldMessageId) await cancelPostPublish(oldMessageId)
    return null
  }

  // Caso 2: queda programado dentro de ventana.
  const dateChanged =
    !oldState.scheduled_at ||
    new Date(oldState.scheduled_at).getTime() !==
      new Date(newScheduledAt as string).getTime()

  // Si ya estaba encolado y la fecha no cambió → no tocar nada.
  if (oldMessageId && !dateChanged) return oldMessageId

  // Reencolar: cancelar el viejo (si había) y crear uno nuevo.
  if (oldMessageId) await cancelPostPublish(oldMessageId)
  return enqueuePostPublish(postId, newScheduledAt as string, baseUrl)
}
