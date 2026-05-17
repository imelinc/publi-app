# publi — Documento de Arquitectura

> **Versión:** 1.0  
> **Fecha:** Mayo 2026  
> **Autores:** Alves Mendes · D'Astolfo · Gavotti · Gonzalez Miel · Melinc · Young Christiansen  
> **Estado:** Definición inicial — MVP

---

## Índice

1. [Visión general](#1-visión-general)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Arquitectura del sistema](#3-arquitectura-del-sistema)
4. [Estructura del repositorio](#4-estructura-del-repositorio)
5. [Capa de datos — Supabase](#5-capa-de-datos--supabase)
6. [Autenticación](#6-autenticación)
7. [API — Next.js Route Handlers](#7-api--nextjs-route-handlers)
8. [Storage de archivos — Vercel Blob](#8-storage-de-archivos--vercel-blob)
9. [Scheduling — Upstash QStash](#9-scheduling--upstash-qstash)
10. [Integración con Instagram](#10-integración-con-instagram)
11. [Asistente IA — Groq](#11-asistente-ia--groq)
12. [Deploy e infraestructura](#12-deploy-e-infraestructura)
13. [Variables de entorno](#13-variables-de-entorno)
14. [Decisiones de diseño](#14-decisiones-de-diseño)
15. [Limitaciones conocidas del MVP](#15-limitaciones-conocidas-del-mvp)

---

## 1. Visión general

**publi** es una plataforma web de gestión unificada de redes sociales orientada a Community Managers freelance. Permite gestionar múltiples clientes desde un único dashboard, programar publicaciones en Instagram, analizar métricas y asistirse con IA para la generación de copy, hashtags y horarios óptimos.

### Alcance del MVP

- ✅ Gestión de clientes (workspaces aislados por cliente)
- ⚠️ Publicación y programación de posts en **Instagram** (única red social en MVP)
- ⚠️ Calendario de contenido mensual y semanal
- ⬜ Métricas de publicaciones (datos reales desde Instagram Graph API)
- ⚠️ Asistente IA para copy, hashtags y horario óptimo (Groq)
- ⚠️ Autenticación con email/contraseña
- ✅ Lista de espera (waitlist) para beta cerrada

### Estado actual verificado en repositorio

> Relevamiento contra `publi/src/app/api/**/route.ts`.
>
> - ✅ Implementado: existe el endpoint o feature y cubre el contrato principal.
> - ⚠️ Parcial: existe implementación, pero faltan piezas del contrato documentado.
> - ⬜ Pendiente: no hay endpoint o integración real en el repositorio.

| Área | Estado | Observación |
|---|---|---|
| Waitlist | ✅ | `POST /api/waitlist` persiste en Supabase con service role y maneja duplicados. |
| Clientes | ⚠️ | CRUD base implementado; falta persistir/editar `networks` y validar límite Free. |
| Publicaciones | ⚠️ | Listado, creación y eliminación básica; faltan filtros/paginación, edición, detalle, QStash e Instagram real. |
| Calendario | ⚠️ | Existe `GET/POST /api/calendar/events`; no está alineado del todo con el contrato que centraliza calendario en `/api/posts`. |
| IA Groq | ⚠️ | Endpoints existen y llaman a Groq; no exigen sesión obligatoria y algunos responses no coinciden con el contrato completo. |
| Auth | ⚠️ | Login email/contraseña vía Supabase SDK; logout implementado en `/api/auth/logout`. |
| Usuarios / Configuración | ⬜ | No existen `/api/users/me`, `/api/users/me/password` ni eliminación de cuenta. |
| Métricas | ⬜ | No existe `/api/metrics`. |
| Storage Blob | ⬜ | No existe `/api/posts/media`; `src/lib/blob.ts` es placeholder. |
| Instagram Graph API | ⬜ | No existen endpoints OAuth/publish; `src/lib/instagram.ts` es placeholder. |
| QStash | ⬜ | No existe `/api/jobs/publish`; `src/lib/qstash.ts` es placeholder. |

### Fuera del alcance del MVP

- Otras redes sociales (Facebook, TikTok, LinkedIn, X, YouTube, Threads)
- Notificaciones por email
- Colaboración en equipo / aprobaciones
- Planes de pago / billing real
- Exportación de reportes

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión | Costo |
|---|---|---|---|
| Framework | Next.js | 14 (App Router) | Gratis |
| Lenguaje | TypeScript | 5.x | Gratis |
| Estilos | Tailwind CSS | 3.x | Gratis |
| Componentes UI | shadcn/ui | latest | Gratis |
| Base de datos | Supabase (PostgreSQL) | — | Gratis (tier free) |
| Autenticación | Supabase Auth | — | Gratis |
| ORM / Query builder | Supabase JS client | 2.x | Gratis |
| Storage | Vercel Blob | — | Gratis (1 GB) |
| Scheduling | Upstash QStash | — | Gratis (500 msgs/día) |
| IA | Groq API | — | Gratis |
| Modelo IA | llama-3.3-70b-versatile | — | Gratis |
| Red social | Instagram Graph API | v21 | Gratis |
| Deploy | Vercel | — | Gratis (Hobby) |
| Control de versiones | GitHub | — | Gratis |

---

## 3. Arquitectura del sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIO (Browser)                        │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL (publi.vercel.app)                      │
│                                                                   │
│   ┌─────────────────────────┐  ┌──────────────────────────────┐  │
│   │   Next.js — Frontend    │  │   Next.js — API Routes       │  │
│   │   (React Server/Client  │  │   (Serverless Functions)     │  │
│   │    Components)          │  │   /api/...                   │  │
│   │                         │  │                              │  │
│   │  • Landing page         │  │  • Auth endpoints            │  │
│   │  • Dashboard            │  │  • CRUD clientes/posts       │  │
│   │  • Calendario           │  │  • Métricas                  │  │
│   │  • Métricas             │  │  • IA (Groq)                 │  │
│   │  • Nueva publicación    │  │  • Instagram OAuth           │  │
│   │  • Configuración        │  │  • Jobs receiver (QStash)    │  │
│   └─────────────────────────┘  └──────────────┬───────────────┘  │
└─────────────────────────────────────────────────┼───────────────┘
                                                  │
                    ┌─────────────────────────────┼──────────────────────┐
                    │                             │                      │
                    ▼                             ▼                      ▼
     ┌──────────────────────┐   ┌────────────────────────┐  ┌──────────────────┐
     │  SUPABASE            │   │  UPSTASH QSTASH         │  │  VERCEL BLOB     │
     │                      │   │                         │  │                  │
     │  • PostgreSQL DB     │   │  • Job queue            │  │  • Imágenes      │
     │  • Auth (JWT)        │   │  • Scheduling           │  │  • Videos        │
     │  • Row Level Security│   │  • Retry automático     │  │                  │
     └──────────────────────┘   └──────────┬──────────────┘  └──────────────────┘
                                           │ HTTP callback
                                           ▼ (en el horario programado)
                                ┌──────────────────────┐
                                │  /api/jobs/publish   │
                                │  (Vercel Function)   │
                                └──────────┬───────────┘
                                           │
                                           ▼
                                ┌──────────────────────┐
                                │  INSTAGRAM           │
                                │  GRAPH API (Meta)    │
                                └──────────────────────┘
                                           │
                                           ▼
                                ┌──────────────────────┐
                                │  GROQ API            │
                                │  (llama-3.3-70b)     │
                                └──────────────────────┘
```

### Flujo de una publicación programada

```
Usuario completa form          QStash espera             QStash llama
en /nueva-publicacion    →     hasta la fecha      →     /api/jobs/publish
        │                      programada                       │
        │                                                        │
        ▼                                                        ▼
POST /api/posts               [espera...]              GET post desde Supabase
  • Guarda en Supabase                                 GET token Instagram
  • Encola job en QStash                               POST imagen a Instagram
  • status = "scheduled"                               PATCH post → "published"
                                                       Crea notificación in-app
```

---

## 4. Estructura del repositorio

```
publi/                              ← raíz del proyecto Next.js
├── public/                         ← assets estáticos
│   ├── icons/                      ← íconos SVG de redes sociales
│   └── images/                     ← imágenes de la landing
├── src/
│   ├── app/                        ← App Router de Next.js
│   │   ├── (auth)/                 ← grupo de rutas de autenticación
│   │   │   └── login/
│   │   ├── (dashboard)/            ← grupo de rutas del dashboard (con layout propio)
│   │   │   ├── calendario/
│   │   │   ├── clientes/
│   │   │   ├── configuracion/
│   │   │   ├── dashboard/
│   │   │   ├── metricas/
│   │   │   ├── nueva-publicacion/
│   │   │   └── layout.tsx          ← layout con Sidebar + TopBar
│   │   ├── waitlist/
│   │   ├── api/                    ← BACKEND — Next.js Route Handlers
│   │   │   ├── auth/
│   │   │   │   └── logout/         ← ✅ logout
│   │   │   ├── users/me/           ← ⬜ perfil, contraseña, configuración
│   │   │   ├── clients/            ← ⚠️ CRUD clientes
│   │   │   │   └── [clientId]/
│   │   │   │       └── instagram/  ← ⬜ estado cuenta Instagram por cliente
│   │   │   ├── posts/              ← ⚠️ CRUD publicaciones + vista calendario
│   │   │   │   ├── media/          ← ⬜ upload a Vercel Blob
│   │   │   │   └── [postId]/
│   │   │   ├── metrics/            ← ⬜ estadísticas (dashboard + detalle)
│   │   │   ├── ai/                 ← ⚠️ rewrite, hashtags, best-time, chat
│   │   │   ├── instagram/          ← ⬜ OAuth connect/callback, publish
│   │   │   ├── waitlist/           ← ✅ registro de waitlist
│   │   │   └── jobs/publish/       ← ⬜ receiver de QStash (scheduling)
│   │   ├── layout.tsx              ← layout raíz (fonts, providers)
│   │   ├── page.tsx                ← landing page
│   │   └── globals.css
│   ├── components/
│   │   ├── dashboard/              ← componentes del dashboard
│   │   ├── publi/                  ← componentes de la landing
│   │   └── ui/                     ← shadcn/ui components
│   ├── lib/
│   │   ├── supabase.ts             ← cliente Supabase (server + client)
│   │   ├── groq.ts                 ← cliente Groq + system prompts
│   │   ├── instagram.ts            ← wrapper Instagram Graph API
│   │   ├── qstash.ts               ← cliente Upstash QStash
│   │   ├── blob.ts                 ← helper Vercel Blob
│   │   ├── mock-data.ts            ← datos hardcodeados (frontend MVP)
│   │   └── utils.ts                ← utilidades generales
│   ├── store/
│   │   └── use-app-store.ts        ← estado global (Zustand)
│   └── types/
│       └── index.ts                ← tipos TypeScript globales
├── .env.example                    ← plantilla de variables de entorno (se commitea)
├── .env.local                      ← variables reales (NO se commitea)
├── .gitignore
├── next.config.mjs
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

### Convención de nombres de archivos API

Cada endpoint es un archivo `route.ts` dentro de su carpeta correspondiente:

```typescript
// src/app/api/clients/route.ts
export async function GET(request: Request) { ... }   // GET /api/clients
export async function POST(request: Request) { ... }  // POST /api/clients

// src/app/api/clients/[clientId]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { clientId: string } }
) { ... }
```

---

## 5. Capa de datos — Supabase

### Schema de base de datos

#### Tabla `profiles`
Extiende `auth.users` con datos del perfil del CM.

```sql
create table profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  name          text not null,
  workspace_name text default 'Mi workspace',
  language      text default 'es',
  timezone      text default 'America/Buenos_Aires',
  -- preferencias de notificaciones
  notif_post_scheduled    boolean default true,
  notif_post_published    boolean default true,
  notif_post_failed       boolean default true,
  notif_reminder          boolean default false,
  notif_weekly_summary    boolean default false,
  created_at    timestamptz default now()
);
```

#### Tabla `clients`
Un cliente = un workspace de un cliente del CM.

```sql
create table clients (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  color       text not null,
  plan        text default 'free' check (plan in ('free', 'pro')),
  created_at  timestamptz default now()
);
```

#### Tabla `instagram_accounts`
Cuenta de Instagram conectada por cliente.

```sql
create table instagram_accounts (
  id              uuid default gen_random_uuid() primary key,
  client_id       uuid references clients(id) on delete cascade unique not null,
  instagram_user_id text not null,
  username        text not null,
  avatar_url      text,
  access_token    text not null,  -- encriptado con pgcrypto
  token_expires_at timestamptz not null,
  connected_at    timestamptz default now()
);
```

#### Tabla `posts`
Publicaciones de contenido.

```sql
create table posts (
  id                uuid default gen_random_uuid() primary key,
  client_id         uuid references clients(id) on delete cascade not null,
  user_id           uuid references auth.users(id) on delete cascade not null,
  title             text,
  description       text not null,
  networks          text[] default array['instagram'],
  hashtags          text[] default array[]::text[],
  media_urls        text[] default array[]::text[],
  status            text default 'draft'
                      check (status in ('draft', 'scheduled', 'published', 'failed')),
  scheduled_at      timestamptz,
  published_at      timestamptz,
  instagram_post_id text,
  qstash_message_id text,  -- para poder cancelar jobs
  error_message     text,  -- si status = 'failed'
  -- engagement (se actualiza desde Instagram Graph API)
  likes             integer default 0,
  comments          integer default 0,
  views             integer default 0,
  reach             integer default 0,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);
```

#### Tabla `notifications`
Notificaciones in-app.

```sql
create table notifications (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  type        text not null check (type in ('post_published', 'post_failed', 'post_scheduled')),
  title       text not null,
  body        text not null,
  read        boolean default false,
  post_id     uuid references posts(id) on delete set null,
  client_id   uuid references clients(id) on delete set null,
  created_at  timestamptz default now()
);
```

#### Tabla `waitlist`
Lista de espera de la beta.

```sql
create table waitlist (
  id            uuid default gen_random_uuid() primary key,
  full_name     text not null,
  email         text not null unique,
  client_count  text not null,
  current_tools text,
  created_at    timestamptz default now()
);
```

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. Política base para cada tabla de usuario:

```sql
-- Ejemplo para tabla clients
alter table clients enable row level security;

create policy "users can only see their own clients"
  on clients for all
  using (auth.uid() = user_id);
```

Esto garantiza que un usuario nunca pueda acceder a datos de otro usuario, incluso si el endpoint no valida correctamente.

### Cliente de Supabase en Next.js

Se necesitan **dos instancias** del cliente según el contexto:

```typescript
// src/lib/supabase.ts

import { createServerClient } from '@supabase/ssr'
import { createBrowserClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Para uso en Server Components y API Routes
export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )
}

// Para uso en Client Components
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

---

## 6. Autenticación

### Flujo email/contraseña

```
Usuario ingresa email + password
        │
        ▼
supabase.auth.signInWithPassword()   ← llamado desde el cliente (browser)
        │
        ▼
Supabase valida → devuelve JWT
        │
        ▼
Cookie de sesión guardada automáticamente por @supabase/ssr
        │
        ▼
Redirect a /dashboard
```

### Validación en API Routes

```typescript
// Patrón estándar en cada endpoint protegido
export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ... lógica del endpoint
}
```

---

## 7. API — Next.js Route Handlers

### Patrón de respuesta estándar

```typescript
// Éxito
return Response.json({ data: result }, { status: 200 })

// Error de validación
return Response.json({ error: 'El nombre es requerido' }, { status: 400 })

// No autorizado
return Response.json({ error: 'Unauthorized' }, { status: 401 })

// No encontrado
return Response.json({ error: 'Cliente no encontrado' }, { status: 404 })
```

### Patrón de validación de body

```typescript
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, color, networks, plan } = body

  if (!name) return Response.json({ error: 'El nombre es requerido' }, { status: 400 })

  const { data, error } = await supabase
    .from('clients')
    .insert({ name, color, networks, plan, user_id: user.id })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json(data, { status: 201 })
}
```

### Timeout de Vercel

Las Serverless Functions en el tier gratuito de Vercel tienen un timeout de **10 segundos**. El endpoint `/api/instagram/publish` (que hace upload de imagen + publicación) debe optimizarse para no superar ese límite. Si fuera necesario, se puede dividir en dos steps.

---

## 8. Storage de archivos — Vercel Blob

Las imágenes y videos que el usuario sube antes de publicar en Instagram se almacenan en Vercel Blob.

### Flujo de upload

```
Usuario selecciona imagen en /nueva-publicacion
        │
        ▼
POST /api/posts/media (multipart/form-data)
        │
        ▼
Vercel Blob recibe el archivo
        │
        ▼
Devuelve URL pública permanente
        │
        ▼
URL se guarda en post.media_urls[]
        │
        ▼
Al publicar, Instagram Graph API descarga la imagen desde esa URL
```

### Implementación

```typescript
// src/lib/blob.ts
import { put } from '@vercel/blob'

export async function uploadMedia(file: File, userId: string) {
  const filename = `${userId}/${Date.now()}-${file.name}`
  const blob = await put(filename, file, { access: 'public' })
  return blob.url
}
```

---

## 9. Scheduling — Upstash QStash

QStash es un servicio de cola de mensajes HTTP con soporte de delay. Se usa para ejecutar publicaciones en el horario programado por el usuario.

### Flujo de scheduling

```
POST /api/posts con scheduledAt = "2026-05-15T19:00:00-03:00"
        │
        ▼
Calcula el delay en segundos hasta esa fecha
        │
        ▼
QStash.publishJSON({
  url: "https://publi.vercel.app/api/jobs/publish",
  body: { postId, clientId },
  delay: segundosHastaPublicacion
})
        │
        ▼
QStash devuelve messageId → se guarda en posts.qstash_message_id
        │
        ▼
[espera hasta la fecha programada]
        │
        ▼
QStash hace HTTP POST a /api/jobs/publish con el body
        │
        ▼
El endpoint valida la firma HMAC y publica en Instagram
```

### Cancelar un job

Si el usuario edita o elimina una publicación programada:

```typescript
// src/lib/qstash.ts
import { Client } from '@upstash/qstash'

const qstash = new Client({ token: process.env.QSTASH_TOKEN! })

export async function cancelJob(messageId: string) {
  await qstash.messages.delete(messageId)
}
```

### Validación de firma en el receiver

```typescript
// src/app/api/jobs/publish/route.ts
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs'

export const POST = verifySignatureAppRouter(async (request: Request) => {
  const { postId, clientId } = await request.json()
  // ... lógica de publicación
})
```

---

## 10. Integración con Instagram

### Requisitos previos

- Cuenta de desarrollador en Meta (developers.facebook.com)
- App de Meta creada con los permisos: `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`
- La app debe estar aprobada por Meta para publicar (o en modo desarrollo para cuentas de prueba)

### Flujo OAuth de Meta

```
GET /api/instagram/connect?clientId=xxx
        │
        ▼
Genera URL de autorización de Meta:
https://www.facebook.com/dialog/oauth?
  client_id={META_APP_ID}
  &redirect_uri={META_REDIRECT_URI}
  &scope=instagram_basic,instagram_content_publish
  &state={clientId}
        │
        ▼
Usuario autoriza en Meta → redirige a:
GET /api/instagram/callback?code=xxx&state={clientId}
        │
        ▼
Intercambia code por short-lived token (válido 1 hora)
        │
        ▼
Convierte a long-lived token (válido 60 días)
        │
        ▼
Obtiene Instagram Business Account ID del usuario
        │
        ▼
Guarda en instagram_accounts: { token, instagram_user_id, username }
        │
        ▼
Redirect a /clientes
```

### Flujo de publicación en Instagram

Instagram Graph API requiere **dos pasos** para publicar:

```
Paso 1 — Crear container:
POST https://graph.facebook.com/{ig-user-id}/media
  image_url={URL pública de Vercel Blob}
  caption={descripción + hashtags}
  access_token={long-lived token}
→ Devuelve: creation_id

Paso 2 — Publicar container:
POST https://graph.facebook.com/{ig-user-id}/media_publish
  creation_id={creation_id de paso 1}
  access_token={long-lived token}
→ Devuelve: instagram_post_id
```

### Gestión de tokens

Los long-lived tokens de Instagram duran **60 días** y se pueden refrescar antes de que expiren. Estrategia:

- Al guardar un token, registrar `token_expires_at = now() + 60 días`
- Antes de cada publicación, verificar si el token expira en menos de 10 días
- Si está por expirar, refrescarlo automáticamente dentro de `/api/instagram/publish` antes de proceder

---

## 11. Asistente IA — Groq

### Modelo

`llama-3.3-70b-versatile` — disponible gratuitamente en Groq con latencia muy baja (< 1 segundo para respuestas típicas).

### Arquitectura del system prompt

El "pre-entrenamiento" del asistente se logra mediante **prompt engineering** en el system prompt. Este se construye dinámicamente en el servidor combinando una base fija con el contexto del cliente activo:

```typescript
// src/lib/groq.ts

export function buildSystemPrompt(client: Client): string {
  return `
Sos un asistente experto en community management que trabaja junto al CM que gestiona el cliente "${client.name}".

CONTEXTO DEL CLIENTE:
- Nombre: ${client.name}
- Redes sociales activas: Instagram

INSTRUCCIONES:
- Respondés siempre en español rioplatense, de forma concisa y accionable.
- Cuando reescribís copy, ofrecés 2 variantes: una más formal y una más dinámica.
- Para hashtags, balanceás entre hashtags de alto alcance, alcance medio y nicho.
- Para sugerencias de horario, priorizás entre las 18 y 21hs (pico histórico de engagement en Instagram Argentina).
- Nunca inventás métricas. Si no tenés datos, lo decís claramente.
- Sos directo y no usás relleno ni frases vacías.
`
}
```

### Endpoint de rewrite (ejemplo completo)

```typescript
// src/app/api/ai/rewrite/route.ts
import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase'
import { buildSystemPrompt } from '@/lib/groq'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { text, clientId, tone } = await request.json()

  // Obtiene contexto del cliente
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .eq('user_id', user.id)
    .single()

  if (!client) return Response.json({ error: 'Cliente no encontrado' }, { status: 404 })

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: buildSystemPrompt(client) },
      {
        role: 'user',
        content: `Reescribí este copy para Instagram con tono ${tone || 'neutral'}:
"${text}"

Respondé SOLO con un JSON válido con este formato:
{"suggestions": [{"text": "...", "label": "Más formal"}, {"text": "...", "label": "Más dinámico"}]}`
      }
    ],
    temperature: 0.7,
    max_tokens: 500
  })

  const raw = completion.choices[0].message.content || '{}'
  const result = JSON.parse(raw)

  return Response.json(result)
}
```

### Chat IA (sidebar)

El historial de conversación se mantiene en **React state** en el frontend y se envía completo en cada request. No se persiste en base de datos para simplificar el MVP.

```typescript
// Frontend — ejemplo de uso
const [history, setHistory] = useState<Message[]>([])

const sendMessage = async (message: string) => {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message, clientId, history })
  })
  const { reply } = await response.json()
  setHistory(prev => [...prev, { role: 'user', content: message }, { role: 'assistant', content: reply }])
}
```

---

## 12. Deploy e infraestructura

### Vercel

El proyecto completo (frontend + backend) se deploya en Vercel desde el repositorio de GitHub. Configuración:

- **Root directory:** `publi/`
- **Framework preset:** Next.js
- **Build command:** `next build` (automático)
- **Variables de entorno:** configuradas en el dashboard de Vercel

Cada push a `main` dispara un deploy automático. Los PRs generan preview deployments.

### Supabase

- Proyecto creado en la región más cercana (São Paulo para Argentina)
- Las migrations de DB se aplican manualmente desde el SQL Editor de Supabase o con la CLI
- RLS habilitado en todas las tablas desde el inicio

### Upstash

- Proyecto QStash creado en Upstash Console
- URL de destino de los jobs: `https://publi.vercel.app/api/jobs/publish`
- Retry policy: 3 intentos con backoff exponencial

### Dominios

| Entorno | URL |
|---|---|
| Producción | `https://publi-six.vercel.app` (hasta configurar dominio propio) |
| Preview (por PR) | `https://publi-[hash].vercel.app` |
| Local | `http://localhost:3000` |

---

## 13. Variables de entorno

| Variable | Descripción | Requerida en |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Cliente + Servidor |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anon pública de Supabase | Cliente + Servidor |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (bypasea RLS) | Solo servidor |
| `GROQ_API_KEY` | API key de Groq | Solo servidor |
| `META_APP_ID` | App ID de Meta Developers | Solo servidor |
| `META_APP_SECRET` | App Secret de Meta | Solo servidor |
| `META_REDIRECT_URI` | URL de callback OAuth de Meta | Solo servidor |
| `QSTASH_TOKEN` | Token de Upstash QStash | Solo servidor |
| `QSTASH_CURRENT_SIGNING_KEY` | Clave de firma QStash (actual) | Solo servidor |
| `QSTASH_NEXT_SIGNING_KEY` | Clave de firma QStash (siguiente) | Solo servidor |
| `BLOB_READ_WRITE_TOKEN` | Token de Vercel Blob | Solo servidor |
| `NEXT_PUBLIC_APP_URL` | URL base de la app | Cliente + Servidor |

Las variables con prefijo `NEXT_PUBLIC_` son accesibles desde el browser. El resto solo están disponibles en el servidor. **Nunca exponer `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY` ni `META_APP_SECRET` al cliente.**

---

## 14. Decisiones de diseño

### ¿Por qué un único proyecto Next.js y no frontend + backend separados?

Next.js 14 con App Router permite colocar el backend (API Routes) dentro del mismo proyecto, deployando todo en Vercel como Serverless Functions. Esto elimina la necesidad de un servidor separado (Render, Railway, etc.), simplifica el deploy, reduce la latencia entre frontend y backend, y mantiene el type-safety de TypeScript en ambas capas sin configuración extra.

### ¿Por qué Supabase Auth en lugar de NextAuth o JWT manual?

Supabase Auth provee email/contraseña out of the box, se integra automáticamente con la base de datos (tabla `auth.users`), y el helper `@supabase/ssr` maneja las cookies de sesión en Next.js sin configuración adicional. Implementar JWT manual representaría semanas de trabajo innecesario para el timeline del proyecto.

### ¿Por qué solo Instagram en el MVP?

De las encuestas realizadas, Instagram es la red social más usada por el target (>90% de los encuestados). Integrar la Instagram Graph API ya representa una complejidad significativa (OAuth de Meta, two-step publishing, token management). Las demás redes se agregan en iteraciones posteriores una vez validado el core del producto.

### ¿Por qué Groq y no OpenAI?

Groq ofrece un tier gratuito generoso con el modelo `llama-3.3-70b-versatile`, latencia sub-segundo, y una API compatible con el formato de OpenAI (fácil migración futura). Para el MVP universitario es la opción más práctica y sin costo.

### ¿Por qué el historial del chat IA no se persiste en DB?

Simplificación deliberada para el MVP. Mantener el historial en React state es suficiente para demostrar la funcionalidad en la presentación final. La persistencia en DB es una mejora natural para la siguiente iteración.

### ¿Por qué QStash y no un cron job?

Next.js en Vercel no tiene un servidor corriendo 24/7, por lo que no se puede usar `setInterval` ni cron jobs tradicionales. QStash es un servicio de mensajería HTTP con delay que llama a un endpoint en el momento exacto programado, lo que lo hace ideal para scheduling en entornos serverless. El tier gratuito (500 mensajes/día) es más que suficiente para el MVP.

---

## 15. Limitaciones conocidas del MVP

| Limitación | Impacto | Resolución futura |
|---|---|---|
| Solo Instagram | No soporta otras redes sociales | Agregar Facebook, TikTok, LinkedIn según demanda |
| Timeout de 10s en Vercel Free | El upload de imágenes pesadas puede fallar | Upgrade a Vercel Pro o dividir el proceso en dos steps |
| Tokens de Instagram expiran en 60 días | Requiere refresh manual o job recurrente | Implementar job de refresh automático con QStash |
| Chat IA sin persistencia | El historial se pierde al recargar | Guardar conversaciones en tabla `ai_conversations` |
| Sin sistema de planes real | Plan Free/Pro es solo un campo en DB | Integrar Stripe o Mercado Pago para billing |
| Sin tests automatizados | Riesgo de regresiones | Agregar Jest + Testing Library en iteración post-MVP |
| Engagement de Instagram | Solo se guarda lo que Instagram devuelve al publicar | Implementar job periódico que actualice métricas desde Graph API |
