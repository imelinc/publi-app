# publi — Visión general del proyecto

## Qué es

Plataforma SaaS de gestión de redes sociales para Community Managers freelance. Permite centralizar múltiples clientes, crear y programar publicaciones en Instagram, editar imágenes directamente en la app, obtener sugerencias de IA y visualizar un calendario editorial unificado.

**URL:** deployado en Vercel · **Stack:** Next.js 14 App Router + Supabase + TypeScript

---

## Alcance del producto (MVP)

| Área | Estado |
|---|---|
| Auth (email/password + recuperación) | ✅ Completo |
| Gestión de clientes (CRUD) | ✅ Completo |
| Conexión Instagram OAuth | ✅ Completo |
| Creación y edición de posts | ✅ Completo |
| Editor visual de imágenes (canvas) | ✅ Completo |
| Scheduling vía QStash | ✅ Completo |
| Publicación inmediata en Instagram | ✅ Completo |
| Flujo de aprobación de cliente | ✅ Completo |
| Calendario editorial | ✅ Completo |
| Dashboard con KPIs y métricas | ✅ Completo |
| Asistente IA (Copi) | ✅ Completo |
| Notificaciones | ✅ Completo |
| Plan free/pro con límites | ✅ Completo |
| Cuentas simuladas para demo | ✅ Completo |
| Facebook / TikTok / X / LinkedIn | ⏳ Infraestructura, sin publishing real |
| Métricas reales de Instagram API | ⏳ Solo datos simulados |
| Generación de imágenes con IA | ⏳ Endpoint parcial |

---

## Arquitectura

```
Next.js 14 App Router
├── /app/(auth)/          → login, register, reset-password
├── /app/(dashboard)/     → páginas protegidas (con Sidebar + TopBar)
├── /app/api/             → backend: Route Handlers
├── /components/          → UI (dashboard + landing + shadcn/ui)
├── /lib/                 → servicios y clientes externos
├── /store/               → estado global Zustand
└── /types/               → tipos TypeScript globales
```

**Capa de datos:** Supabase (PostgreSQL + Auth). Cada endpoint valida sesión con `supabase.auth.getUser()` antes de operar.

**Scheduling:** Upstash QStash recibe el post programado, lo encola y llama a `/api/qstash/publish/[postId]` en el momento indicado. El cron `/api/cron/enqueue-due` dispara la encola de posts que vencen pronto.

**Publicación:** `lib/publish-post.ts` es el núcleo compartido entre publicación inmediata y scheduled. Maneja refresco de tokens Instagram, rate limiting (25 posts/24hs por cliente) y el flag `is_simulated`.

---

## Pantallas principales

| Ruta | Descripción |
|---|---|
| `/dashboard` | KPIs (publicados, programados, borradores), mini-calendario, feed de actividad |
| `/nueva-publicacion` | Formulario de creación de post |
| `/editor` | Editor canvas Fabric.js (texto, formas, stickers, filtros) |
| `/publicaciones` | Listado de todos los posts con filtros |
| `/borrador/[postId]` | Detalle y edición de borrador |
| `/calendario` | Vista calendario de posts y eventos |
| `/clientes` | CRUD de clientes + gestión de cuentas sociales conectadas |
| `/metricas` | Gráficas: top hashtags, posts por cliente, tendencias |
| `/ai` | Chat con Copi (asistente IA) |
| `/configuracion` | Perfil, contraseña, notificaciones |
| `/aprobar/[token]` | Página pública para aprobación de posts por el cliente |

---

## API Routes

**Usuarios:**
`GET/PATCH/DELETE /api/users/me` · `PATCH /api/users/me/password`

**Clientes:**
`GET/POST /api/clients` · `PATCH/DELETE /api/clients/[id]` · `GET/POST/DELETE /api/clients/[id]/social-accounts`

**Posts:**
`GET/POST /api/posts` · `PATCH/DELETE /api/posts/[id]` · `POST /api/posts/[id]/publish` · `POST /api/posts/[id]/request-approval` · `POST /api/posts/media`

**Instagram:**
`POST /api/instagram/connect` · `GET /api/instagram/callback` · `POST /api/instagram/refresh-token` · `GET /api/instagram/daily-limit`

**Scheduling:**
`POST /api/qstash/publish/[postId]` · `GET /api/cron/enqueue-due`

**Calendario:** `GET/POST /api/calendar/events` · `PATCH/DELETE /api/calendar/events/[id]`

**Métricas:** `GET /api/metrics`

**Notificaciones:** `GET/PATCH /api/notifications` · `DELETE /api/notifications/[id]`

**Aprobación:** `GET /api/approve/[token]`

**IA:** `/api/ai/chat` · `/api/ai/rewrite` · `/api/ai/hashtags` · `/api/ai/best-time`

**Waitlist:** `POST /api/waitlist`

---

## Servicios externos

| Servicio | Uso |
|---|---|
| Supabase | PostgreSQL + Auth + Storage |
| Upstash QStash | Cola de posts programados |
| Groq (Llama 3.3 70B) | Asistente Copi + sugerencias IA |
| Instagram Graph API | OAuth + publishing real |
| Vercel | Deploy + Cron Jobs |

---

## Modelo de datos clave

**`clients`** — workspace por cliente (nombre, color, iniciales, stats)  
**`social_accounts`** — cuentas conectadas por cliente (red, token, `is_simulated`)  
**`posts`** — post con título, descripción, hashtags, redes objetivo, estado, fecha programada  
**`publications`** — una fila por (post × red social): status, external_id, métricas, error  
**`calendar_events`** — eventos/deadlines del calendario editorial  
**`notifications`** — alertas de sistema (publicado, fallido, programado)  

**Ciclo de vida del post:** `draft → pending_approval → approved → scheduled → published | failed`

---

## Decisiones técnicas relevantes

- **Sin Google OAuth.** Se removió del MVP; solo email/password.
- **Cuentas simuladas.** `is_simulated = true` genera engagement determinístico (pseudo-random por publication ID) sin necesitar cuenta real de Instagram. Permite hacer demos sin credenciales reales.
- **Rate limiting propio.** Se implementó límite de 25 posts/24hs por cliente a nivel de aplicación antes de llegar a la API de Instagram.
- **Plan free/pro.** Free: máximo 3 clientes. Pro: ilimitado. El guard `PlanUpgradeGuard` bloquea features premium en el frontend.
- **Solo Instagram en publishing real.** El resto de redes (Facebook, TikTok, X, LinkedIn, YouTube) están en `lib/networks.ts` con metadata, íconos y baseline engagement, pero su publishing es simulado.
- **Zustand sobre Redux.** Estado global liviano sin boilerplate. El store maneja clientes, posts, eventos, notificaciones y perfil de usuario.
- **Fabric.js para el editor.** Canvas con soporte de texto, formas, stickers y filtros (brillo, contraste, saturación). Hook `useFabricCanvas` encapsula el estado del canvas.
- **QStash para scheduling confiable.** Reintentos idempotentes, firma HMAC para verificar llamadas entrantes.
- **Groq como LLM.** Costo-efectivo vs. OpenAI para el volumen esperado del MVP; modelo `llama-3.3-70b-versatile`.

---

## Variables de entorno requeridas

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GROQ_API_KEY
INSTAGRAM_APP_ID
INSTAGRAM_APP_SECRET
QSTASH_URL / QSTASH_TOKEN / QSTASH_CURRENT_SIGNING_KEY / QSTASH_NEXT_SIGNING_KEY
NEXT_PUBLIC_APP_URL
CRON_SECRET
```

---

## Design System

| Token | Valor |
|---|---|
| Fuente | Poppins (300–700) |
| Primario | `#0095b6` |
| Secundario | `#cceef5` |
| Acento | `#ffb703` |
| Fondo | `#f5f0e8` |

Variables definidas en `src/app/globals.css`. Componentes base en `src/components/ui/` (shadcn/Radix — no modificar).
