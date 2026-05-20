// ─── Types ────────────────────────────────────────────────────────────────────

export type SocialNetwork = 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'twitter' | 'youtube' | 'threads'

export type PostStatus = 'draft' | 'scheduled' | 'published'

export type EventType = 'event' | 'deadline'

export interface Workspace {
  id: string
  name: string
  color: string
  initials: string
  networks: SocialNetwork[]
  clientSince: string
}

export interface Post {
  id: string
  workspaceId: string
  title: string
  description: string
  networks: SocialNetwork[]
  status: PostStatus
  scheduledAt: string | null
  imageUrl: string | null
  createdAt: string
}

export interface CalendarEvent {
  id: string
  workspaceId: string
  title: string
  description: string
  type: EventType
  color: string
  date: string
}

export interface MetricSnapshot {
  date: string
  reach: number
  impressions: number
  likes: number
  comments: number
  shares: number
  followers: number
}

export interface WorkspaceMetrics {
  workspaceId: string
  network: SocialNetwork
  engagementRate: number
  totalPosts: number
  snapshots: MetricSnapshot[]
}

// ─── Workspaces ───────────────────────────────────────────────────────────────

export const WORKSPACES: Workspace[] = [
  {
    id: 'ws-cafe-bruna',
    name: 'Café Bruna',
    color: '#92400e',
    initials: 'CB',
    networks: ['instagram', 'facebook'],
    clientSince: '2025-03-01',
  },
  {
    id: 'ws-studio-luma',
    name: 'Studio Luma',
    color: '#6d28d9',
    initials: 'SL',
    networks: ['instagram', 'tiktok', 'linkedin'],
    clientSince: '2025-06-15',
  },
  {
    id: 'ws-byroal',
    name: 'ByRoal',
    color: '#be185d',
    initials: 'BR',
    networks: ['instagram'],
    clientSince: '2026-01-10',
  },
]

// ─── Posts ────────────────────────────────────────────────────────────────────

export const POSTS: Post[] = [
  // ws-cafe-bruna — 2 scheduled, 1 draft, 1 published
  {
    id: 'post-cb-01',
    workspaceId: 'ws-cafe-bruna',
    title: 'Nuevo menú de otoño',
    description:
      '🍂 El otoño llegó a Café Bruna y con él nuestro nuevo menú de temporada. Ingredientes frescos, sabores únicos y el ambiente acogedor que nos caracteriza. ¡Vení a probarlo! 📍 Palermo, Buenos Aires.',
    networks: ['instagram', 'facebook'],
    status: 'scheduled',
    scheduledAt: '2026-05-14T10:00:00.000Z',
    imageUrl: '/images/restaurant.jpg',
    createdAt: '2026-05-09T14:00:00.000Z',
  },
  {
    id: 'post-cb-02',
    workspaceId: 'ws-cafe-bruna',
    title: 'Domingos de brunch',
    description:
      '☀️ ¿Qué mejor plan que un brunch con amigas? Los domingos son nuestros días favoritos. Reservás tu mesa por DM o en el link de nuestra bio. ¡Te esperamos!',
    networks: ['instagram'],
    status: 'scheduled',
    scheduledAt: '2026-05-19T11:00:00.000Z',
    imageUrl: '/images/starbucks.webp',
    createdAt: '2026-05-10T09:30:00.000Z',
  },
  {
    id: 'post-cb-03',
    workspaceId: 'ws-cafe-bruna',
    title: 'Behind the scenes — preparación del cortado',
    description:
      'Borrador: mostrar el proceso de preparación del café de especialidad, resaltar el origen del grano y la técnica del barista.',
    networks: ['instagram'],
    status: 'draft',
    scheduledAt: null,
    imageUrl: null,
    createdAt: '2026-05-11T08:00:00.000Z',
  },
  {
    id: 'post-cb-04',
    workspaceId: 'ws-cafe-bruna',
    title: 'Apertura del local nuevo',
    description:
      '🎉 ¡Ya somos dos! Abrimos nuestro segundo local en Núñez. Más mesas, más sabores y la misma calidad de siempre. Gracias por tanto apoyo. ¡Nos vemos ahí! 📍 Av. Cabildo 1200.',
    networks: ['instagram', 'facebook'],
    status: 'published',
    scheduledAt: '2026-04-30T12:00:00.000Z',
    imageUrl: '/images/edificio.jpg',
    createdAt: '2026-04-28T16:00:00.000Z',
  },

  // ws-studio-luma — 2 scheduled, 1 draft
  {
    id: 'post-sl-01',
    workspaceId: 'ws-studio-luma',
    title: 'Nueva colección SS26',
    description:
      '✨ La nueva colección primavera-verano ya está disponible. Diseños pensados para las que se animan. Entrá a nuestra tienda online desde el link en bio y elegí tu favorito.',
    networks: ['instagram', 'tiktok'],
    status: 'scheduled',
    scheduledAt: '2026-05-13T15:00:00.000Z',
    imageUrl: '/images/bicicleta.jpg',
    createdAt: '2026-05-10T11:00:00.000Z',
  },
  {
    id: 'post-sl-02',
    workspaceId: 'ws-studio-luma',
    title: 'Case study — cliente fitness',
    description:
      '📊 Crecimiento del 340% en alcance orgánico en 90 días. Así lo logramos con nuestra estrategia de contenido para una marca de fitness. Todos los detalles en el artículo del link en bio.',
    networks: ['linkedin'],
    status: 'scheduled',
    scheduledAt: '2026-05-16T09:00:00.000Z',
    imageUrl: '/images/subte.jpg',
    createdAt: '2026-05-10T14:00:00.000Z',
  },
  {
    id: 'post-sl-03',
    workspaceId: 'ws-studio-luma',
    title: 'Reel proceso creativo',
    description:
      'Borrador: mostrar el proceso detrás de una sesión de fotos profesional. Planos del estudio, el equipo trabajando, resultado final. Música trendy.',
    networks: ['instagram', 'tiktok'],
    status: 'draft',
    scheduledAt: null,
    imageUrl: null,
    createdAt: '2026-05-11T10:00:00.000Z',
  },

  // ws-byroal — 1 scheduled, 1 draft, 1 published
  {
    id: 'post-br-01',
    workspaceId: 'ws-byroal',
    title: 'Nueva drop — zapatillas urbanas',
    description:
      '🔥 DROP DISPONIBLE. Las más esperadas ya están acá. Solo 50 pares. Primero en llegar, primero en llevárselas. Link en bio 👟',
    networks: ['instagram'],
    status: 'scheduled',
    scheduledAt: '2026-05-15T18:00:00.000Z',
    imageUrl: '/images/paisaje_canal.jpg',
    createdAt: '2026-05-10T20:00:00.000Z',
  },
  {
    id: 'post-br-02',
    workspaceId: 'ws-byroal',
    title: 'Lookbook invierno',
    description:
      'Borrador: lookbook con las prendas de la colección invierno. Fotos en locación exterior, estilo urbano. Pendiente de aprobación del cliente.',
    networks: ['instagram'],
    status: 'draft',
    scheduledAt: null,
    imageUrl: null,
    createdAt: '2026-05-08T17:00:00.000Z',
  },
  {
    id: 'post-br-03',
    workspaceId: 'ws-byroal',
    title: 'Collab con @vero.styling',
    description:
      '💫 Colaboramos con @vero.styling y el resultado es fuego. Mirá el video completo en nuestra página. ¿Cuál es tu favorito? Comentá abajo 👇',
    networks: ['instagram'],
    status: 'published',
    scheduledAt: '2026-05-05T20:00:00.000Z',
    imageUrl: '/images/avion.jpg',
    createdAt: '2026-05-04T12:00:00.000Z',
  },
]

// ─── Calendar Events ──────────────────────────────────────────────────────────

export const CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-01',
    workspaceId: 'ws-cafe-bruna',
    title: 'Entrega de contenido mayo',
    description:
      'Entrega del calendario de contenido completo para el mes de junio. Incluye copies, imágenes y videos aprobados.',
    type: 'deadline',
    color: '#ef4444',
    date: '2026-05-15',
  },
  {
    id: 'evt-02',
    workspaceId: 'ws-studio-luma',
    title: 'Reunión mensual con cliente',
    description:
      'Revisión de métricas del mes, presentación de la estrategia para junio y alineación de objetivos.',
    type: 'deadline',
    color: '#f97316',
    date: '2026-05-20',
  },
  {
    id: 'evt-03',
    workspaceId: 'ws-studio-luma',
    title: 'Lanzamiento colección SS26',
    description:
      'Activación digital para el lanzamiento oficial de la colección primavera-verano. Campaña multicanal con influencers.',
    type: 'event',
    color: '#0095b6',
    date: '2026-05-13',
  },
  {
    id: 'evt-04',
    workspaceId: 'ws-byroal',
    title: 'Campaña Día del Trabajador',
    description:
      'Campaña especial de descuentos para el feriado. Posts coordinados en todos los canales durante 48hs.',
    type: 'event',
    color: '#ffb703',
    date: '2026-05-22',
  },
]

// ─── Workspace Metrics ────────────────────────────────────────────────────────

function buildSnapshots(baseReach: number, baseFollowers: number): MetricSnapshot[] {
  const snapshots: MetricSnapshot[] = []
  const start = new Date('2026-04-12')
  for (let i = 0; i < 30; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const variation = 0.8 + Math.sin(i * 0.7) * 0.3 + (i % 7 === 0 ? 0.4 : 0)
    const reach = Math.round(baseReach * variation)
    const impressions = Math.round(reach * (1.4 + (i % 5) * 0.1))
    const likes = Math.round(reach * (0.03 + (i % 4) * 0.005))
    const comments = Math.round(likes * 0.12)
    const shares = Math.round(likes * 0.07)
    const followers = baseFollowers + i * 3 + Math.round(Math.sin(i) * 5)
    snapshots.push({ date: dateStr, reach, impressions, likes, comments, shares, followers })
  }
  return snapshots
}

export const WORKSPACE_METRICS: WorkspaceMetrics[] = [
  {
    workspaceId: 'ws-cafe-bruna',
    network: 'instagram',
    engagementRate: 4.2,
    totalPosts: 48,
    snapshots: buildSnapshots(1800, 5200),
  },
  {
    workspaceId: 'ws-studio-luma',
    network: 'instagram',
    engagementRate: 5.7,
    totalPosts: 92,
    snapshots: buildSnapshots(2600, 11400),
  },
]

// ─── Activity Feed ────────────────────────────────────────────────────────────

export const ACTIVITY_FEED: Array<{
  id: string
  workspaceId: string
  text: string
  timestamp: string
  type: 'post_published' | 'draft_saved' | 'client_added'
}> = [
  {
    id: 'act-01',
    workspaceId: 'ws-cafe-bruna',
    text: 'Post "Apertura del local nuevo" publicado exitosamente en Instagram y Facebook.',
    timestamp: '2026-04-30T12:01:00.000Z',
    type: 'post_published',
  },
  {
    id: 'act-02',
    workspaceId: 'ws-byroal',
    text: 'Collab con @vero.styling publicada en Instagram.',
    timestamp: '2026-05-05T20:01:00.000Z',
    type: 'post_published',
  },
  {
    id: 'act-03',
    workspaceId: 'ws-studio-luma',
    text: 'Borrador "Reel proceso creativo" guardado.',
    timestamp: '2026-05-11T10:02:00.000Z',
    type: 'draft_saved',
  },
  {
    id: 'act-04',
    workspaceId: 'ws-cafe-bruna',
    text: 'Borrador "Behind the scenes — preparación del cortado" guardado.',
    timestamp: '2026-05-11T08:01:00.000Z',
    type: 'draft_saved',
  },
  {
    id: 'act-05',
    workspaceId: 'ws-byroal',
    text: 'Nuevo cliente ByRoal agregado a la plataforma.',
    timestamp: '2026-01-10T09:00:00.000Z',
    type: 'client_added',
  },
  {
    id: 'act-06',
    workspaceId: 'ws-byroal',
    text: 'Borrador "Lookbook invierno" guardado para revisión del cliente.',
    timestamp: '2026-05-08T17:01:00.000Z',
    type: 'draft_saved',
  },
]
