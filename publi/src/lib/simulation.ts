/**
 * Generación determinista de métricas plausibles para redes simuladas
 * (`social_accounts.is_simulated = true`).
 *
 * Determinístico = la misma publicación devuelve siempre los mismos números,
 * así la demo es estable entre re-fetches y recargas.
 */

function pseudoRandom(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

export function simulateEngagement(publicationId: string) {
  const r1 = pseudoRandom(publicationId)
  const r2 = pseudoRandom(publicationId + 'x')
  const r3 = pseudoRandom(publicationId + 'y')
  const r4 = pseudoRandom(publicationId + 'z')
  return {
    likes: Math.floor(50 + r1 * 850),
    comments: Math.floor(2 + r2 * 80),
    views: Math.floor(200 + r3 * 4800),
    reach: Math.floor(300 + r4 * 7000),
  }
}
