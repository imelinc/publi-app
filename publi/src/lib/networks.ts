// ============================================
// publi — Metadatos de redes sociales
// ============================================
//
// Una única fuente de verdad para íconos, nombres, colores y límites
// de cada red social que soporta la app. Importar desde acá en cualquier
// componente que necesite mostrar info de una red.
//
// Para agregar una red nueva: sumarla al tipo `Network` en src/types/index.ts
// y agregar su entrada acá. TypeScript marcará todos los lugares que
// necesitan completarse.

import type { Network } from '@/types'

export interface NetworkMeta {
  label: string
  icon: string         // ícono monocromo (sidebar, listados)
  iconColor: string    // ícono a color (preview, headers)
  color: string        // color de marca (hex)
  charLimit: number    // límite de caracteres para el copy
  /**
   * Engagement rate típico (%) usado como fallback para métricas
   * cuando todavía no hay datos reales. Fuentes: Hootsuite 2024.
   */
  baselineEngagement: number
}

export const NETWORK_META: Record<Network, NetworkMeta> = {
  instagram: {
    label: 'Instagram',
    icon: '/icons/instagram.svg',
    iconColor: '/icons/instagram-color.svg',
    color: '#E1306C',
    charLimit: 2200,
    baselineEngagement: 4.2,
  },
  facebook: {
    label: 'Facebook',
    icon: '/icons/facebook.svg',
    iconColor: '/icons/facebook-color.svg',
    color: '#1877F2',
    charLimit: 63206,
    baselineEngagement: 1.8,
  },
  tiktok: {
    label: 'TikTok',
    icon: '/icons/tiktok.svg',
    iconColor: '/icons/tiktok-color.svg',
    color: '#69C9D0',
    charLimit: 2200,
    baselineEngagement: 5.7,
  },
  x: {
    label: 'X',
    icon: '/icons/twitter.svg',
    iconColor: '/icons/twitter-color.svg',
    color: '#536471',
    charLimit: 280,
    baselineEngagement: 0.9,
  },
  linkedin: {
    label: 'LinkedIn',
    icon: '/icons/linkedin.svg',
    iconColor: '/icons/linkedin-color.svg',
    color: '#0A66C2',
    charLimit: 3000,
    baselineEngagement: 2.3,
  },
  youtube: {
    label: 'YouTube',
    icon: '/icons/youtube.svg',
    iconColor: '/icons/yt-color.svg',
    color: '#FF0000',
    charLimit: 5000,
    baselineEngagement: 1.6,
  },
}

/** Lista de todas las redes en orden estable para selectores. */
export const ALL_NETWORKS: Network[] = [
  'instagram',
  'facebook',
  'tiktok',
  'x',
  'linkedin',
  'youtube',
]
