# publi — Documentación de API Endpoints

> **Stack:** Next.js 14 (TypeScript) · Supabase (DB + Auth) · Vercel Blob (storage) · Upstash QStash (scheduling) · Groq API (IA)  
> **Convención de rutas:** Next.js API Routes en `app/api/...`  
> **Autenticación:** Supabase Auth — el cliente JS maneja la sesión automáticamente. Los endpoints del servidor validan con `supabase.auth.getUser()`.  
> **Fecha de relevamiento:** Mayo 2026 — basado en inspección del frontend deployado en Vercel

---

## Índice

1. [Auth](#1-auth)
2. [Usuarios](#2-usuarios)
3. [Clientes (Workspaces)](#3-clientes-workspaces)
4. [Publicaciones](#4-publicaciones)
5. [Calendario](#5-calendario)
6. [Métricas](#6-métricas)
7. [Configuración](#7-configuración)
8. [IA — Asistente (Groq)](#8-ia--asistente-groq)
9. [Waitlist](#9-waitlist)
10. [Notificaciones](#10-notificaciones)
11. [Instagram — OAuth & Publicación](#11-instagram--oauth--publicación)
12. [Jobs internos (QStash)](#12-jobs-internos-qstash)

---

## 1. Auth

> **Manejado por Supabase Auth.** El frontend usa el SDK de Supabase directamente (`supabase.auth.signInWithPassword`, `supabase.auth.signInWithOAuth`, etc.). Los endpoints de backend solo necesitan validar la sesión activa.

### `GET /api/auth/callback`
Callback de Google OAuth. Supabase redirige acá después del login con Google. Intercambia el `code` por una sesión activa y redirige al dashboard.

**Query Params:** `code` (string), `next` (string, ruta de redirección)  
**Response:** Redirect `302` a `/dashboard`  
**Nota:** Este endpoint lo genera el helper de Supabase Auth para Next.js (`@supabase/ssr`).

---

### `POST /api/auth/logout`
Cierra la sesión del usuario actual.

**Auth:** Sesión Supabase activa (cookie)  
**Response `200`** — `{ "success": true }`  
**Nota:** El frontend también puede usar `supabase.auth.signOut()` directamente.

---

## 2. Usuarios

> Los datos extendidos del usuario (nombre del workspace, timezone, idioma) se guardan en una tabla `profiles` en Supabase, vinculada a `auth.users` por `user_id`.

### `GET /api/users/me`
Devuelve el perfil completo del usuario autenticado.

**Auth:** Sesión Supabase activa  
**Response `200`**
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "avatarUrl": "string | null",
  "workspaceName": "string",
  "language": "es | en",
  "timezone": "string",
  "createdAt": "ISO 8601"
}
```

---

### `PATCH /api/users/me`
Actualiza el perfil del usuario (nombre, workspace, idioma, timezone).

**Auth:** Sesión Supabase activa  
**Request Body** (todos opcionales)
```json
{
  "name": "string",
  "workspaceName": "string",
  "language": "es | en",
  "timezone": "string"
}
```
**Response `200`** — perfil actualizado

---

### `PATCH /api/users/me/password`
Actualiza la contraseña. Usa `supabase.auth.updateUser()` internamente.

**Auth:** Sesión Supabase activa  
**Request Body**
```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```
**Response `200`** — `{ "message": "Contraseña actualizada correctamente." }`  
**Errores:** `401` contraseña actual incorrecta

---

### `DELETE /api/users/me`
Elimina la cuenta del usuario. Acción irreversible. Elimina también todos sus clientes y publicaciones (cascade en DB).

**Auth:** Sesión Supabase activa  
**Response `204`** — sin body

---

### `PATCH /api/users/me/notifications`
Guarda las preferencias de notificaciones in-app del usuario.

**Auth:** Sesión Supabase activa  
**Request Body**
```json
{
  "onPostScheduled": true,
  "onPostPublished": true,
  "onPostFailed": true,
  "reminderBeforePost": false,
  "weeklySummary": false
}
```
**Response `200`** — preferencias actualizadas

---

## 3. Clientes (Workspaces)

> Cada "cliente" es un workspace aislado que agrupa publicaciones y la cuenta de Instagram conectada.

### `GET /api/clients`
Lista todos los clientes del usuario autenticado con sus estadísticas.

**Auth:** Sesión Supabase activa  
**Response `200`**
```json
[
  {
    "id": "uuid",
    "name": "string",
    "color": "string (hex)",
    "initials": "string",
    "plan": "free | pro",
    "connectedNetworks": ["instagram"],
    "stats": {
      "scheduled": 2,
      "drafts": 1,
      "published": 1
    },
    "createdAt": "ISO 8601"
  }
]
```

---

### `POST /api/clients`
Crea un nuevo cliente. Flujo de 3 pasos en el frontend (nombre+color → redes → plan).

**Auth:** Sesión Supabase activa  
**Request Body**
```json
{
  "name": "string",
  "color": "string (hex)",
  "networks": ["instagram"],
  "plan": "free | pro"
}
```
**Response `201`** — objeto cliente creado  
**Errores:** `400` nombre requerido · `403` límite de clientes en plan Free

---

### `GET /api/clients/:clientId`
Detalle de un cliente específico.

**Auth:** Sesión Supabase activa  
**Response `200`** — objeto cliente completo

---

### `PATCH /api/clients/:clientId`
Edita nombre, color, redes o plan de un cliente.

**Auth:** Sesión Supabase activa  
**Request Body** (todos opcionales)
```json
{
  "name": "string",
  "color": "string (hex)",
  "networks": ["instagram"],
  "plan": "free | pro"
}
```
**Response `200`** — cliente actualizado

---

### `DELETE /api/clients/:clientId`
Elimina un cliente y todas sus publicaciones (cascade).

**Auth:** Sesión Supabase activa  
**Response `204`** — sin body

---

## 4. Publicaciones

### `GET /api/posts`
Lista publicaciones con filtros. Usado en calendario, métricas y dashboard.

**Auth:** Sesión Supabase activa  
**Query Params**
| Param | Tipo | Descripción |
|---|---|---|
| `clientId` | string | UUID o `all` |
| `status` | string | `draft \| scheduled \| published \| failed` |
| `from` | ISO date | Fecha inicio |
| `to` | ISO date | Fecha fin |
| `page` | number | Default: 1 |
| `limit` | number | Default: 20 |

**Response `200`**
```json
{
  "data": [
    {
      "id": "uuid",
      "clientId": "uuid",
      "clientName": "string",
      "clientColor": "string",
      "title": "string",
      "description": "string",
      "networks": ["instagram"],
      "status": "draft | scheduled | published | failed",
      "scheduledAt": "ISO 8601 | null",
      "publishedAt": "ISO 8601 | null",
      "mediaUrls": ["string"],
      "hashtags": ["string"],
      "instagramPostId": "string | null",
      "engagement": {
        "likes": 0,
        "comments": 0,
        "views": 0,
        "reach": 0
      },
      "createdAt": "ISO 8601",
      "updatedAt": "ISO 8601"
    }
  ],
  "total": 0,
  "page": 1,
  "limit": 20
}
```

---

### `POST /api/posts`
Crea una publicación nueva (borrador, programada o inmediata).

**Auth:** Sesión Supabase activa  
**Request Body**
```json
{
  "clientId": "uuid",
  "networks": ["instagram"],
  "description": "string",
  "hashtags": ["string"],
  "mediaUrls": ["string"],
  "status": "draft | scheduled | published",
  "scheduledAt": "ISO 8601 | null"
}
```
**Lógica interna:**
- `status = "scheduled"` → guarda en DB + encola job en QStash con fecha `scheduledAt`
- `status = "published"` → guarda en DB + llama a Instagram Graph API inmediatamente

**Response `201`** — publicación creada  
**Errores:** `400` validación · `403` cuenta de Instagram no conectada

---

### `GET /api/posts/:postId`
Detalle completo de una publicación.

**Auth:** Sesión Supabase activa  
**Response `200`** — objeto publicación completo

---

### `PATCH /api/posts/:postId`
Edita una publicación (solo borradores o programadas aún no ejecutadas).

**Auth:** Sesión Supabase activa  
**Request Body** (todos opcionales)
```json
{
  "description": "string",
  "hashtags": ["string"],
  "mediaUrls": ["string"],
  "status": "draft | scheduled",
  "scheduledAt": "ISO 8601 | null"
}
```
**Lógica interna:** Si cambia `scheduledAt`, cancela el job de QStash anterior y encola uno nuevo.  
**Response `200`** — publicación actualizada  
**Errores:** `409` no editable (ya publicada o fallida)

---

### `DELETE /api/posts/:postId`
Elimina una publicación. Si estaba programada, cancela el job de QStash.

**Auth:** Sesión Supabase activa  
**Response `204`** — sin body

---

### `POST /api/posts/media`
Sube una imagen o video a Vercel Blob y devuelve la URL pública.

**Auth:** Sesión Supabase activa  
**Request:** `multipart/form-data` con campo `file`  
**Response `201`**
```json
{
  "url": "string (URL pública en Vercel Blob)",
  "type": "image | video",
  "size": 0,
  "filename": "string"
}
```
**Errores:** `413` archivo demasiado grande (max 50MB) · `415` formato no soportado

---

## 5. Calendario

### `GET /api/calendar`
Publicaciones agrupadas por día para la vista de calendario.

**Auth:** Sesión Supabase activa  
**Query Params**
| Param | Tipo | Descripción |
|---|---|---|
| `clientId` | string | UUID o `all` |
| `month` | number | Mes (1–12) |
| `year` | number | Año (ej: 2026) |
| `view` | string | `month \| week` |
| `weekStart` | ISO date | Solo para `view=week` |

**Response `200`**
```json
{
  "view": "month | week",
  "period": { "from": "ISO 8601", "to": "ISO 8601" },
  "days": [
    {
      "date": "YYYY-MM-DD",
      "posts": [
        {
          "id": "uuid",
          "title": "string",
          "clientId": "uuid",
          "clientColor": "string",
          "networks": ["instagram"],
          "status": "scheduled | published | draft",
          "scheduledAt": "ISO 8601"
        }
      ]
    }
  ]
}
```

---

### `POST /api/calendar/events`
Crea un evento/publicación desde el botón "+ Agregar evento" del calendario.

**Auth:** Sesión Supabase activa  
**Request Body**
```json
{
  "clientId": "uuid",
  "title": "string",
  "networks": ["instagram"],
  "scheduledAt": "ISO 8601",
  "description": "string | null"
}
```
**Response `201`** — publicación creada con `status: "scheduled"`

---

## 6. Métricas

### `GET /api/metrics`
Estadísticas agregadas para la página de Métricas.

**Auth:** Sesión Supabase activa  
**Query Params**
| Param | Tipo | Descripción |
|---|---|---|
| `clientId` | string | UUID o `all` |
| `period` | string | `7d \| 30d \| 90d \| custom` |
| `from` | ISO date | Si `period=custom` |
| `to` | ISO date | Si `period=custom` |
| `network` | string | `all \| instagram` |

**Response `200`**
```json
{
  "summary": {
    "totalPosts": 4,
    "published": 1,
    "scheduled": 2,
    "drafts": 1,
    "avgEngagement": 3.49,
    "deltaVsPrevious": 4
  },
  "byWeek": [
    { "week": "Sem 1", "count": 0 },
    { "week": "Sem 2", "count": 2 },
    { "week": "Sem 3", "count": 1 },
    { "week": "Sem 4", "count": 1 }
  ],
  "byNetwork": [
    { "network": "instagram", "count": 4 }
  ],
  "posts": [
    {
      "id": "uuid",
      "network": "instagram",
      "title": "string",
      "status": "scheduled | published | draft",
      "scheduledAt": "ISO 8601",
      "engagement": { "likes": 0, "comments": 0, "views": 0 }
    }
  ]
}
```

---

### `GET /api/metrics/dashboard`
Resumen compacto para el Inicio del dashboard (KPIs + mini-calendario semanal + actividad reciente).

**Auth:** Sesión Supabase activa  
**Query Params:** `clientId` (uuid, el cliente activo en el sidebar)

**Response `200`**
```json
{
  "greeting": {
    "userName": "string",
    "clientName": "string",
    "date": "ISO 8601"
  },
  "kpis": {
    "thisWeek": 3,
    "thisWeekDelta": 2,
    "scheduled": 2,
    "scheduledPending": 2,
    "drafts": 1,
    "published": 1,
    "publishedDelta": -1
  },
  "weekCalendar": {
    "weekRange": { "from": "ISO 8601", "to": "ISO 8601" },
    "days": [
      { "date": "YYYY-MM-DD", "hasPost": true }
    ]
  },
  "upcomingPosts": [
    {
      "id": "uuid",
      "title": "string",
      "clientColor": "string",
      "networks": ["instagram"],
      "scheduledAt": "ISO 8601"
    }
  ],
  "recentActivity": [
    {
      "type": "published | draft_saved | client_added",
      "clientName": "string",
      "description": "string",
      "timestamp": "ISO 8601"
    }
  ]
}
```

---

## 7. Configuración

### `GET /api/settings`
Obtiene toda la configuración del usuario.

**Auth:** Sesión Supabase activa  
**Response `200`**
```json
{
  "general": {
    "workspaceName": "string",
    "language": "es | en",
    "timezone": "string"
  },
  "notifications": {
    "onPostScheduled": true,
    "onPostPublished": true,
    "onPostFailed": true,
    "reminderBeforePost": false,
    "weeklySummary": false
  }
}
```

---

### `PATCH /api/settings/general`
Guarda la sección General.

**Auth:** Sesión Supabase activa  
**Request Body**
```json
{
  "workspaceName": "string",
  "language": "es | en",
  "timezone": "string"
}
```
**Response `200`** — configuración actualizada

---

### `PATCH /api/settings/notifications`
Guarda preferencias de notificaciones.

**Auth:** Sesión Supabase activa  
**Request Body**
```json
{
  "onPostScheduled": true,
  "onPostPublished": true,
  "onPostFailed": true,
  "reminderBeforePost": false,
  "weeklySummary": false
}
```
**Response `200`** — preferencias actualizadas

---

## 8. IA — Asistente (Groq)

> Todos los endpoints llaman a la **Groq API** con un system prompt fijo definido por el equipo. El "pre-entrenamiento" se logra mediante **prompt engineering** en el system prompt: se incluye el contexto del CM, el cliente activo, instrucciones de tono y comportamiento esperado. No hay entrenamiento real del modelo.
>
> **Modelo:** `llama-3.3-70b-versatile` (gratis en Groq, latencia muy baja)

### System prompt base (estructura)
```
Sos un asistente experto en community management para el CM que gestiona el cliente [clientName].
Este cliente se dedica a [descripción]. Su audiencia principal es [audiencia].
Siempre respondés en español rioplatense, de forma concisa y accionable.
Para sugerencias de horario, priorizás entre las 18 y 21hs ya que es el pico histórico de engagement.
Cuando sugerís hashtags, balanceás alcance alto, medio y nicho.
```

---

### `POST /api/ai/rewrite`
Reescribe o mejora el copy de una publicación para Instagram.

**Auth:** Sesión Supabase activa  
**Request Body**
```json
{
  "text": "string",
  "clientId": "uuid",
  "tone": "profesional | casual | divertido | informativo | null"
}
```
**Lógica interna:** Construye el prompt con el texto + contexto del cliente desde Supabase, llama a Groq.

**Response `200`**
```json
{
  "suggestions": [
    { "text": "string", "label": "Más formal" },
    { "text": "string", "label": "Más dinámico" }
  ]
}
```

---

### `POST /api/ai/hashtags`
Genera hashtags relevantes para el copy e Instagram.

**Auth:** Sesión Supabase activa  
**Request Body**
```json
{
  "text": "string",
  "clientId": "uuid",
  "count": 10
}
```
**Response `200`**
```json
{
  "hashtags": ["#cafe", "#buenosaires", "#cafeteria"],
  "grouped": {
    "highReach": ["#cafe"],
    "mediumReach": ["#cafeteria"],
    "niche": ["#buenosaires"]
  }
}
```

---

### `POST /api/ai/best-time`
Sugiere el mejor horario para publicar en Instagram. Combina el historial de publicaciones del cliente en Supabase con el system prompt configurado.

**Auth:** Sesión Supabase activa  
**Request Body**
```json
{
  "clientId": "uuid"
}
```
**Response `200`**
```json
{
  "recommendation": {
    "dayOfWeek": "Jueves",
    "time": "19:00",
    "timezone": "America/Buenos_Aires",
    "reason": "string"
  }
}
```

---

### `POST /api/ai/chat`
Chat conversacional del asistente IA (sidebar). Consultas abiertas sobre estrategia de contenido, análisis, ideas de posts.

**Auth:** Sesión Supabase activa  
**Request Body**
```json
{
  "message": "string",
  "clientId": "uuid | null",
  "history": [
    { "role": "user | assistant", "content": "string" }
  ]
}
```
**Nota:** El historial se mantiene en React state en el frontend y se envía en cada request. No se persiste en DB para simplificar el MVP.

**Response `200`**
```json
{
  "reply": "string"
}
```

---

## 9. Waitlist

### `POST /api/waitlist`
Registra a alguien en la lista de espera (beta cerrada).

**Auth:** No requerida — endpoint público  
**Request Body**
```json
{
  "fullName": "string",
  "email": "string",
  "clientCount": "1-3 | 4-10 | 11-20 | 20+",
  "currentTools": "string | null"
}
```
**Response `201`**
```json
{
  "message": "¡Te anotaste! Te avisamos cuando tu acceso esté listo.",
  "position": 42
}
```
**Errores:** `409` email ya registrado

---

## 10. Notificaciones

> Notificaciones in-app (campanita del header). Se generan desde los jobs de QStash al publicar o fallar. No se envían emails.

### `GET /api/notifications`
Lista las notificaciones del usuario.

**Auth:** Sesión Supabase activa  
**Query Params:** `unreadOnly=true | false`  
**Response `200`**
```json
{
  "unreadCount": 3,
  "notifications": [
    {
      "id": "uuid",
      "type": "post_published | post_failed | post_scheduled",
      "title": "string",
      "body": "string",
      "read": false,
      "createdAt": "ISO 8601",
      "metadata": {
        "postId": "uuid | null",
        "clientId": "uuid | null"
      }
    }
  ]
}
```

---

### `PATCH /api/notifications/:notificationId/read`
Marca una notificación como leída.

**Auth:** Sesión Supabase activa  
**Response `200`** — `{ "read": true }`

---

### `PATCH /api/notifications/read-all`
Marca todas como leídas.

**Auth:** Sesión Supabase activa  
**Response `200`** — `{ "updatedCount": 3 }`

---

## 11. Instagram — OAuth & Publicación

> Solo Instagram Graph API. El flujo OAuth usa Facebook Login (Instagram usa la plataforma de Meta).

### `GET /api/instagram/connect`
Genera la URL de autorización de Meta OAuth y redirige al usuario.

**Auth:** Sesión Supabase activa  
**Query Params:** `clientId` (uuid)  
**Response:** Redirect `302` a la URL de OAuth de Meta

---

### `GET /api/instagram/callback`
Callback de Meta OAuth. Intercambia el `code` por el access token y lo guarda en Supabase.

**Query Params:** `code` (string), `state` (uuid del clientId)  
**Lógica interna:**
1. Intercambia `code` por short-lived token (vía Meta API)
2. Convierte a long-lived token (válido 60 días)
3. Guarda encriptado en tabla `instagram_accounts` de Supabase

**Response:** Redirect `302` a `/clientes`

---

### `DELETE /api/clients/:clientId/instagram`
Desconecta la cuenta de Instagram de un cliente.

**Auth:** Sesión Supabase activa  
**Response `204`** — sin body

---

### `GET /api/clients/:clientId/instagram`
Estado de la cuenta de Instagram conectada a un cliente.

**Auth:** Sesión Supabase activa  
**Response `200`**
```json
{
  "connected": true,
  "accountId": "string",
  "username": "string",
  "avatarUrl": "string | null",
  "status": "connected | expired | error",
  "tokenExpiresAt": "ISO 8601"
}
```

---

### `POST /api/instagram/publish`
Publica un post en Instagram via Graph API. Llamado directamente (publicación inmediata) o desde el job de QStash (publicación programada).

**Auth:** Sesión Supabase activa (directo) o header `x-qstash-signature` (desde QStash)  
**Request Body**
```json
{
  "postId": "uuid",
  "clientId": "uuid"
}
```
**Lógica interna:**
1. Obtiene el post y el access token desde Supabase
2. Sube la imagen al Container de Instagram (paso 1 de la Graph API)
3. Publica el container (paso 2 de la Graph API)
4. Actualiza el post en Supabase: `status = "published"`, guarda `instagramPostId`
5. Crea una notificación in-app

**Response `200`**
```json
{
  "success": true,
  "instagramPostId": "string",
  "publishedAt": "ISO 8601"
}
```
**Errores:** `401` token expirado · `500` error de la Graph API

---

### `POST /api/instagram/refresh-token`
Refresca el long-lived token antes de que expire (los tokens duran 60 días).

**Auth:** Sesión Supabase activa  
**Request Body:** `{ "clientId": "uuid" }`  
**Response `200`** — `{ "expiresAt": "ISO 8601" }`

---

## 12. Jobs internos (QStash)

> Estos endpoints son llamados automáticamente por **Upstash QStash** en el momento programado. No son accesibles desde el frontend. Validan la firma con el header `x-qstash-signature`.

### `POST /api/jobs/publish`
Job principal de publicación programada. QStash llama este endpoint cuando llega el horario de un post.

**Headers:** `x-qstash-signature: <firma HMAC>`  
**Request Body** (definido al encolar el job en QStash)
```json
{
  "postId": "uuid",
  "clientId": "uuid"
}
```
**Lógica interna:** Valida la firma → delega a `/api/instagram/publish`  
**Response `200`** — `{ "success": true }`  
**Errores:** `401` firma inválida · `500` error de publicación (QStash reintenta automáticamente con backoff)

---

## Resumen por pantalla

| Pantalla / Feature | Endpoints utilizados |
|---|---|
| Landing page | `POST /api/waitlist` |
| Login (email/password) | Supabase Auth SDK — sin endpoint propio |
| Login (Google OAuth) | Supabase Auth SDK → `GET /api/auth/callback` |
| Waitlist | `POST /api/waitlist` |
| Dashboard / Inicio | `GET /api/metrics/dashboard` |
| Clientes — listado | `GET /api/clients` |
| Clientes — crear | `POST /api/clients` |
| Clientes — editar | `GET /api/clients/:id` · `PATCH /api/clients/:id` |
| Clientes — eliminar | `DELETE /api/clients/:id` |
| Clientes — conectar Instagram | `GET /api/instagram/connect` → `GET /api/instagram/callback` |
| Clientes — estado Instagram | `GET /api/clients/:id/instagram` |
| Calendario | `GET /api/calendar` · `POST /api/calendar/events` · `GET /api/posts` |
| Métricas | `GET /api/metrics` |
| Nueva publicación — crear | `POST /api/posts` · `POST /api/posts/media` |
| Nueva publicación — editar borrador | `PATCH /api/posts/:id` |
| Nueva publicación — IA reescribir | `POST /api/ai/rewrite` |
| Nueva publicación — IA hashtags | `POST /api/ai/hashtags` |
| Nueva publicación — IA horario | `POST /api/ai/best-time` |
| Configuración — General | `GET /api/settings` · `PATCH /api/settings/general` |
| Configuración — Notificaciones | `PATCH /api/settings/notifications` |
| Configuración — Cuenta | `PATCH /api/users/me` · `PATCH /api/users/me/password` |
| Configuración — Cerrar sesión | `POST /api/auth/logout` |
| Configuración — Eliminar cuenta | `DELETE /api/users/me` |
| Notificaciones (header) | `GET /api/notifications` · `PATCH /api/notifications/:id/read` · `PATCH /api/notifications/read-all` |
| Chat IA (sidebar) | `POST /api/ai/chat` |
| Job scheduling (interno) | `POST /api/jobs/publish` ← llamado por QStash |

---

## Convenciones generales

- **Autenticación:** Supabase Auth. El frontend maneja cookies de sesión automáticamente. El servidor valida con `supabase.auth.getUser()` en cada request protegido.
- **Content-Type:** `application/json` para todos los endpoints salvo `POST /api/posts/media` que usa `multipart/form-data`.
- **Errores estándar:**
  - `400` Bad Request — validación de campos
  - `401` Unauthorized — sesión inválida o expirada
  - `403` Forbidden — recurso de otro usuario o plan insuficiente
  - `404` Not Found — recurso inexistente
  - `409` Conflict — duplicado o estado inválido
  - `413` Payload Too Large — imagen demasiado grande
  - `500` Internal Server Error
- **IDs:** UUIDs v4 generados por Supabase.
- **Fechas:** ISO 8601 con timezone. El servidor convierte según el timezone guardado en `profiles`.
- **Paginación:** `page` + `limit` en endpoints de listado.
- **Jobs QStash:** validados con HMAC signature. Si falla, QStash reintenta automáticamente hasta 3 veces con backoff exponencial.
- **Tokens de Instagram:** long-lived tokens (60 días), guardados encriptados en Supabase. Se refrescan a los 50 días.
