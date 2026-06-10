# publi — Documentación de API Endpoints

> **Stack:** Next.js 14 (TypeScript) · Supabase (DB + Auth + Storage) · Upstash QStash (scheduling) · Groq API (IA)
> **Convención de rutas:** Next.js API Routes en `app/api/...`
> **Autenticación:** Supabase Auth — el cliente JS maneja la sesión automáticamente. Los endpoints del servidor validan con `supabase.auth.getUser()`.
> **Fecha de relevamiento:** Junio 2026 — actualizado con inspección del repositorio

> **Estado de implementación:** verificado contra `publi/src/app/api/**/route.ts`.
>
> - ✅ Implementado: existe el endpoint y cubre el contrato principal.
> - ⚠️ Parcial: existe el endpoint, pero falta parte del contrato documentado o hay diferencias con la implementación.
> - ⬜ Pendiente: no existe implementación en el repositorio.

---

## Índice

1. [Auth](#1-auth)
2. [Usuarios](#2-usuarios)
3. [Clientes (Workspaces)](#3-clientes-workspaces)
4. [Cuentas sociales (Social Accounts)](#4-cuentas-sociales-social-accounts)
5. [Publicaciones](#5-publicaciones)
6. [Aprobación de posts](#6-aprobación-de-posts)
7. [Calendario (Eventos)](#7-calendario-eventos)
8. [Métricas](#8-métricas)
9. [IA — Asistente (Groq)](#9-ia--asistente-groq)
10. [Waitlist](#10-waitlist)
11. [Instagram — OAuth & Publicación](#11-instagram--oauth--publicación)
12. [Jobs internos (QStash)](#12-jobs-internos-qstash)
13. [Cron de Vercel](#13-cron-de-vercel)
14. [Configuración](#14-configuración)

---

## 1. Auth

> **Manejado por Supabase Auth.** El frontend usa el SDK de Supabase directamente (`supabase.auth.signInWithPassword`, `supabase.auth.signOut`, etc.). Los endpoints de backend solo necesitan validar la sesión activa.

### ✅ `POST /api/auth/logout`
Cierra la sesión del usuario actual.

**Auth:** Sesión Supabase activa (cookie)
**Response `200`** — `{ "success": true }`
**Nota:** El frontend también puede usar `supabase.auth.signOut()` directamente.

---

## 2. Usuarios

> Los datos básicos del usuario (nombre, email, avatar y nombre del workspace) se guardan en la tabla `profiles` en Supabase, vinculada a `auth.users` por `user_id`. No hay endpoints separados de "settings" — todo el perfil y la configuración pasan por `/api/users/me`.

### ✅ `GET /api/users/me`
Devuelve el perfil del usuario autenticado.

**Auth:** Sesión Supabase activa
**Response `200`**
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "avatarUrl": "string | null",
  "initials": "string",
  "workspaceName": "string"
}
```

---

### ✅ `PATCH /api/users/me`
Actualiza el perfil del usuario: nombre o nombre del workspace. Todos los campos son opcionales; solo se actualiza lo que se envía.

**Auth:** Sesión Supabase activa
**Request Body** (todos opcionales)
```json
{
  "name": "string",
  "workspaceName": "string"
}
```
**Response `200`** — perfil actualizado (mismo formato que GET)

---

### ✅ `DELETE /api/users/me`
Elimina la cuenta del usuario. Acción irreversible. Elimina también todos sus clientes y publicaciones (cascade en DB).

**Auth:** Sesión Supabase activa
**Response `204`** — sin body

---

## 3. Clientes (Workspaces)

> Cada "cliente" es un workspace aislado que agrupa publicaciones y las cuentas sociales conectadas (no solo Instagram). La conexión de redes se maneja a través de `/api/clients/:clientId/social-accounts`.

### ✅ `GET /api/clients`
Lista todos los clientes del usuario autenticado con sus estadísticas y redes conectadas.

**Auth:** Sesión Supabase activa
**Response `200`**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "color": "string (hex)",
      "plan": "free | pro",
      "initials": "string",
      "connectedNetworks": ["instagram"],
      "stats": {
        "scheduled": 2,
        "drafts": 1,
        "published": 1
      },
      "createdAt": "ISO 8601"
    }
  ]
}
```

---

### ✅ `POST /api/clients`
Crea un nuevo cliente.

**Auth:** Sesión Supabase activa
**Request Body**
```json
{
  "name": "string (obligatorio)",
  "color": "string (hex)",
  "description": "string | null",
  "plan": "free | pro",
  "networks": ["instagram"]
}
```
**Nota:** `networks` es opcional y no se persiste directamente. La conexión real se hace vía `/api/clients/:clientId/social-accounts`. `description` y `plan` son opcionales (default: `null` y `"free"` respectivamente).

**Response `201`**
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "color": "string (hex)",
    "plan": "free | pro",
    "initials": "string",
    "connectedNetworks": [],
    "stats": { "scheduled": 0, "drafts": 0, "published": 0 },
    "createdAt": "ISO 8601"
  }
}
```
**Errores:** `400` nombre requerido

---

### ✅ `GET /api/clients/:clientId`
Detalle de un cliente específico.

**Auth:** Sesión Supabase activa
**Response `200`**
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "color": "string (hex)",
    "initials": "string",
    "connectedNetworks": ["instagram"],
    "stats": {
      "scheduled": 2,
      "drafts": 1,
      "published": 1
    },
    "createdAt": "ISO 8601"
  }
}
```

---

### ✅ `PATCH /api/clients/:clientId`
Edita nombre, descripción o color de un cliente.

**Auth:** Sesión Supabase activa
**Request Body** (todos opcionales)
```json
{
  "name": "string",
  "description": "string | null",
  "color": "string (hex)"
}
```
**Response `200`**
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "color": "string (hex)",
    "initials": "string",
    "createdAt": "ISO 8601"
  }
}
```

---

### ✅ `DELETE /api/clients/:clientId`
Elimina un cliente y todas sus publicaciones (cascade).

**Auth:** Sesión Supabase activa
**Response `204`** — sin body

---

## 4. Cuentas sociales (Social Accounts)

> Las cuentas sociales (Instagram, Facebook, TikTok, X, LinkedIn, YouTube) se conectan de forma simulada en el MVP. El flujo real de OAuth para Instagram no está implementado todavía. Las redes soportadas están definidas en el código: `instagram`, `facebook`, `tiktok`, `x`, `linkedin`, `youtube`.

### ✅ `GET /api/clients/:clientId/social-accounts`
Lista las cuentas sociales conectadas de un cliente.

**Auth:** Sesión Supabase activa
**Response `200`**
```json
{
  "data": [
    {
      "id": "uuid",
      "clientId": "uuid",
      "network": "instagram | facebook | tiktok | x | linkedin | youtube",
      "externalUserId": "string",
      "username": "string",
      "avatarUrl": "string",
      "isSimulated": true,
      "tokenExpiresAt": "ISO 8601 | null",
      "connectedAt": "ISO 8601"
    }
  ]
}
```
**Errores:** `404` cliente no encontrado

---

### ✅ `POST /api/clients/:clientId/social-accounts`
Crea una conexión de red social (simulada en el MVP). Para Instagram, valida el formato de username según reglas oficiales de Meta (1-30 caracteres alfanuméricos, puntos y guiones bajos, sin puntos consecutivos, no empieza con punto).

**Auth:** Sesión Supabase activa
**Request Body**
```json
{
  "network": "instagram | facebook | tiktok | x | linkedin | youtube",
  "username": "string (obligatorio)",
  "password": "string (obligatorio, no se persiste)"
}
```
**Nota:** `password` es obligatorio para consistencia del flujo UI. Para redes simuladas no tiene significado funcional y nunca se guarda en la DB. Para Instagram (cuando se implemente OAuth real), se intercambiará por un token y se descartará.

**Response `201`**
```json
{
  "data": {
    "id": "uuid",
    "clientId": "uuid",
    "network": "instagram",
    "externalUserId": "sim_instagram_abc123",
    "username": "string",
    "avatarUrl": "string (generado con ui-avatars.com)",
    "isSimulated": true,
    "tokenExpiresAt": null,
    "connectedAt": "ISO 8601"
  }
}
```
**Errores:**
- `400` red inválida, username vacío, username de Instagram inválido, password vacío
- `404` cliente no encontrado
- `409` ya existe una cuenta de esa red para este cliente

---

### ✅ `DELETE /api/clients/:clientId/social-accounts/:accountId`
Desconecta una cuenta social de un cliente. Las publicaciones históricas se mantienen (no hay cascade desde `social_accounts`).

**Auth:** Sesión Supabase activa
**Response `204`** — sin body
**Errores:** `404` cliente o cuenta no encontrada

---

## 5. Publicaciones

> Este endpoint es el núcleo del sistema. También cubre la vista de **Calendario** usando los mismos datos. La creación de eventos desde el calendario usa directamente `POST /api/posts`.

### ⚠️ `GET /api/posts`
Lista publicaciones del usuario autenticado.

**⚠️ Nota:** El endpoint actual NO implementa los query params de filtrado ni paginación documentados originalmente. Devuelve todas las publicaciones de todos los clientes del usuario sin filtrar.

**Auth:** Sesión Supabase activa
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
      "hashtags": ["string"],
      "mediaUrls": ["string"],
      "status": "draft | scheduled | published | failed | pending_approval | approved",
      "scheduledAt": "ISO 8601 | null",
      "approvalToken": "string | null",
      "approvedAt": "string | null",
      "clientFeedback": "string | null",
      "publications": [
        {
          "id": "uuid",
          "postId": "uuid",
          "network": "instagram",
          "description": "string | null",
          "hashtags": ["string"] | null,
          "status": "pending | simulated | published | failed",
          "externalPostId": "string | null",
          "publishedAt": "ISO 8601 | null",
          "errorMessage": "string | null",
          "engagement": {
            "likes": 0,
            "comments": 0,
            "views": 0,
            "reach": 0
          },
          "metricsUpdatedAt": "ISO 8601 | null"
        }
      ],
      "createdAt": "ISO 8601",
      "updatedAt": "ISO 8601"
    }
  ]
}
```

**Query params no implementados (pendiente):** `clientId`, `status`, `from`, `to`, `view`, `page`, `limit`

---

### ✅ `POST /api/posts`
Crea una publicación nueva (borrador, programada o inmediata).

**Estado repo:** crea publicaciones y genera registros en `post_publications` por cada red target. Para cuentas simuladas con `status = "published"`, marca la publicación como `"simulated"` automáticamente. Si se programa (`status = "scheduled"`), se encola automáticamente en Upstash QStash si entra dentro de la ventana de tiempo permitida (≤ 6.5 días).

**Auth:** Sesión Supabase activa
**Request Body**
```json
{
  "clientId": "uuid (obligatorio)",
  "title": "string",
  "networks": ["instagram"],
  "description": "string",
  "hashtags": ["string"],
  "mediaUrls": ["string"],
  "status": "draft | scheduled | published",
  "scheduledAt": "ISO 8601 | null"
}
```

**Response `201`**
```json
{
  "data": {
    "id": "uuid",
    "clientId": "uuid",
    "clientName": "string",
    "clientColor": "string",
    "title": "string",
    "description": "string",
    "networks": ["instagram"],
    "hashtags": ["string"],
    "mediaUrls": ["string"],
    "status": "draft | scheduled | published",
    "scheduledAt": "ISO 8601 | null",
    "approvalToken": "string | null",
    "approvedAt": "string | null",
    "clientFeedback": "string | null",
    "publications": ["... (ver estructura arriba)"],
    "createdAt": "ISO 8601",
    "updatedAt": "ISO 8601"
  }
}
```
**Errores:** `400` validación · `404` cliente no encontrado

---

### ✅ `GET /api/posts/:postId`
Detalle completo de una publicación.

**Auth:** Sesión Supabase activa
**Response `200`**
```json
{
  "data": {
    "id": "uuid",
    "clientId": "uuid",
    "clientName": "string",
    "clientColor": "string",
    "title": "string",
    "description": "string",
    "networks": ["instagram"],
    "status": "draft | scheduled | published | failed | pending_approval | approved",
    "scheduledAt": "ISO 8601 | null",
    "publishedAt": "ISO 8601 | null",
    "mediaUrls": ["string"],
    "hashtags": ["string"],
    "instagramPostId": "string | null",
    "engagement": { "likes": 0, "comments": 0, "views": 0, "reach": 0 },
    "createdAt": "ISO 8601",
    "updatedAt": "ISO 8601"
  }
}
```
**Nota:** Este endpoint usa un mapper diferente al GET list. Devuelve `instagramPostId` y `engagement` a nivel de post (formato legacy), no el array `publications`.

---

### ✅ `PATCH /api/posts/:postId`
Edita una publicación. Se pueden editar posts en estado `draft`, `scheduled`, `pending_approval` o `approved`. Posts en estado `published` o `failed` no son editables.

**Auth:** Sesión Supabase activa
**Request Body** (todos opcionales)
```json
{
  "title": "string",
  "description": "string",
  "hashtags": ["string"],
  "mediaUrls": ["string"],
  "networks": ["instagram"],
  "status": "draft | scheduled | published",
  "scheduledAt": "ISO 8601 | null"
}
```
**Nota:** Si se cambia `status` a `"published"` y no se pasa `scheduledAt`, se establece automáticamente a la fecha actual.
**Response `200`** — mismos campos que GET por ID
**Errores:**
- `404` post no encontrado
- `409` no editable (ya publicada o fallida)

---

### ✅ `DELETE /api/posts/:postId`
Elimina una publicación. Valida ownership del post vía cliente.

**Estado repo:** elimina la publicación validando ownership vía cliente y cancela automáticamente el job programado en QStash si existiera.

**Auth:** Sesión Supabase activa
**Response `204`** — sin body

---

### ✅ `POST /api/posts/media`
Sube una imagen al bucket `post-media` de Supabase Storage y devuelve la URL pública.

**Auth:** Sesión Supabase activa
**Request:** `multipart/form-data` con campo `file`
**Validaciones:**
- Solo imágenes: JPG, PNG, WEBP, GIF
- Tamaño máximo: 10 MB
- Se almacena bajo `{user_id}/{uuid}.{ext}` para RLS por owner

**Response `201`**
```json
{
  "url": "string (URL pública en Supabase Storage)",
  "path": "string (ruta interna del archivo)"
}
```
**Errores:**
- `400` no se envió archivo, formato no soportado, imagen demasiado pesada
- `401` no autenticado
- `500` error de upload

---

### ✅ `POST /api/posts/:postId/request-approval`
Genera un token único de aprobación y cambia el estado del post a `"pending_approval"`. Devuelve la URL pública que el CM puede copiar y enviarle al cliente final.

**Auth:** Sesión Supabase activa
**Response `200`**
```json
{
  "data": {
    "approvalUrl": "https://.../aprobar/{token}",
    "token": "uuid"
  }
}
```
**Errores:**
- `404` post no encontrado
- `409` el post no está en estado `draft`

---

## 6. Aprobación de posts

> Flujo público (no requiere autenticación) para que el cliente final apruebe o rechace un post. Se accede via el link generado por `POST /api/posts/:postId/request-approval`.

### ✅ `GET /api/approve/:token`
Devuelve los datos del post para preview. No requiere autenticación — es un endpoint público.

**Response `200`**
```json
{
  "data": {
    "id": "uuid",
    "description": "string",
    "networks": ["instagram"],
    "hashtags": ["string"],
    "mediaUrls": ["string"],
    "scheduledAt": "ISO 8601 | null",
    "clientName": "string",
    "clientColor": "string"
  }
}
```
**Errores:**
- `404` token inválido o expirado
- `409` el post ya fue procesado (no está en `pending_approval`)

---

### ✅ `POST /api/approve/:token`
El cliente final envía su decisión de aprobación. No requiere autenticación.

**Request Body**
```json
{
  "approved": true,
  "feedback": "string | null"
}
```
**Lógica interna:**
- Si `approved: true` → `status = "approved"`, guarda `approved_at` y `feedback`
- Si `approved: false` → `status = "draft"`, guarda `feedback`, el CM puede editar y reenviar

**Response `200`**
```json
{
  "data": {
    "approved": true,
    "message": "¡Gracias! El post fue aprobado."
  }
}
```
**Errores:**
- `404` token inválido o expirado
- `409` el post ya fue procesado

---

## 7. Calendario (Eventos)

> Módulo para gestionar eventos de planificación general y fechas límites (deadlines) en el calendario, persistiendo las entradas de manera independiente de las publicaciones.

### ✅ `GET /api/calendar/events`
Obtiene los eventos del calendario de los clientes del usuario autenticado.

**Auth:** Sesión Supabase activa
**Query Params**
| Param | Tipo | Descripción |
|---|---|---|
| `clientId` | string | UUID o `all` (default: todos los clientes del usuario) |
| `from` | ISO date | Filtra eventos con `date >= from` |
| `to` | ISO date | Filtra eventos con `date <= to` |

**Response `200`**
```json
{
  "data": [
    {
      "id": "uuid",
      "clientId": "uuid",
      "title": "string",
      "description": "string",
      "type": "event | deadline",
      "color": "string (hex)",
      "date": "ISO 8601 o YYYY-MM-DD (si isAllDay)",
      "endAt": "ISO 8601 | null",
      "isAllDay": true
    }
  ]
}
```

---

### ✅ `POST /api/calendar/events`
Crea un nuevo evento o fecha límite en el calendario.

**Auth:** Sesión Supabase activa
**Request Body**
```json
{
  "clientId": "uuid (obligatorio)",
  "title": "string (obligatorio)",
  "description": "string (default: \"\")",
  "type": "event | deadline (obligatorio)",
  "color": "string (hex, default: \"#0095b6\")",
  "date": "ISO 8601 o YYYY-MM-DD (obligatorio)",
  "endAt": "ISO 8601 | null (solo si isAllDay=false)",
  "isAllDay": "boolean (default: true)"
}
```
**Validaciones:**
- Si `isAllDay=true`, se ignora `endAt` y se guarda como `null`
- Si `isAllDay=false` y se envía `endAt`, debe ser posterior a `date`

**Response `201`**
```json
{
  "data": {
    "id": "uuid",
    "clientId": "uuid",
    "title": "string",
    "description": "string",
    "type": "event | deadline",
    "color": "string (hex)",
    "date": "ISO 8601 o YYYY-MM-DD",
    "endAt": "ISO 8601 | null",
    "isAllDay": true
  }
}
```
**Errores:** `400` campos obligatorios faltantes, tipo inválido, fechas inválidas · `404` cliente no encontrado

---

### ✅ `GET /api/calendar/events/:eventId`
Detalle de un evento de calendario.

**Auth:** Sesión Supabase activa
**Response `200`** — mismo formato que POST response
**Errores:** `404` evento no encontrado o no pertenece al usuario

---

### ✅ `PATCH /api/calendar/events/:eventId`
Actualiza un evento de calendario. Todos los campos son opcionales; solo se actualizan los campos enviados.

**Auth:** Sesión Supabase activa
**Request Body** (todos opcionales)
```json
{
  "title": "string",
  "description": "string",
  "type": "event | deadline",
  "color": "string (hex)",
  "date": "ISO 8601 o YYYY-MM-DD",
  "endAt": "ISO 8601 | null",
  "isAllDay": "boolean"
}
```
**Nota:** Si se marca `isAllDay=true`, se limpia automáticamente `endAt`.
**Response `200`** — mismo formato que POST response
**Errores:** `400` tipo inválido o título vacío · `404` evento no encontrado o no pertenece al usuario

---

### ✅ `DELETE /api/calendar/events/:eventId`
Elimina un evento de calendario.

**Auth:** Sesión Supabase activa
**Response `204`** — sin body
**Errores:** `404` evento no encontrado o no pertenece al usuario

---

## 8. Métricas

> Endpoint pendiente de implementación. Solo existe la carpeta `/api/metrics/dashboard/` con un `.gitkeep` de placeholder.

### ⬜ `GET /api/metrics`
Estadísticas agregadas para la página de Métricas y el resumen del dashboard.

**Auth:** Sesión Supabase activa
**Query Params**
| Param | Tipo | Descripción |
|---|---|---|
| `clientId` | string | UUID o `all` |
| `period` | string | `7d | 30d | 90d | custom` |
| `from` | ISO date | Si `period=custom` |
| `to` | ISO date | Si `period=custom` |
| `network` | string | `all | instagram` |

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

## 9. IA — Asistente (Groq)

> Todos los endpoints llaman a la **Groq API** con un system prompt fijo definido por el equipo. El "pre-entrenamiento" se logra mediante **prompt engineering** en el system prompt: se incluye el contexto del CM, el cliente activo (nombre, descripción, redes conectadas), instrucciones de tono y comportamiento esperado. No hay entrenamiento real del modelo.
>
> **Modelo:** `llama-3.3-70b-versatile` (gratis en Groq, latencia muy baja)
>
> **⚠️ Nota:** Los endpoints de IA **no validan sesión Supabase**. Solo consultan datos del cliente si se proporciona `clientId`.

### System prompt base (estructura)
```
Sos Copi, asistente de publi para Community Managers.
Respondés en español rioplatense, conciso y creativo.
Cuando reescribís copy ofrecés 2 variantes. Nunca uses relleno.
[+ contexto del cliente si se proporciona clientId]
```

---

### ✅ `POST /api/ai/rewrite`
Reescribe o mejora el copy de una publicación.

**Auth:** No requerida (pero usa contexto del cliente si hay sesión)
**Request Body**
```json
{
  "text": "string",
  "clientId": "uuid | null",
  "tone": "profesional | casual | divertido | informativo | null"
}
```
**Lógica interna:** Construye el prompt con el texto + contexto del cliente desde Supabase (nombre, descripción, redes), llama a Groq.

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

### ⚠️ `POST /api/ai/hashtags`
Genera hashtags relevantes para el copy.

**Auth:** No requerida (pero usa contexto del cliente si hay sesión)
**Request Body**
```json
{
  "text": "string",
  "clientId": "uuid | null",
  "count": 10
}
```
**Response `200`**
```json
{
  "hashtags": ["#cafe", "#buenosaires", "#cafeteria"]
}
```
**⚠️ Diferencia con diseño original:** El diseño original incluía un campo `grouped` con `{ highReach, mediumReach, niche }` pero la implementación actual solo devuelve la lista plana de hashtags.

---

### ✅ `POST /api/ai/best-time`
Sugiere el mejor horario para publicar.

**Auth:** No requerida (pero usa contexto del cliente si hay sesión)
**Request Body**
```json
{
  "clientId": "uuid | null",
  "networks": ["instagram"]
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

### ✅ `POST /api/ai/chat`
Chat conversacional del asistente IA (sidebar). Consultas abiertas sobre estrategia de contenido, análisis, ideas de posts.

**Auth:** No requerida (pero usa contexto del cliente si hay sesión)
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
**Nota:** El historial se mantiene en React state en el frontend y se envía en cada request. No se persiste en DB para simplificar el MVP. Si se proporciona `clientId`, se inyecta contexto del cliente (nombre, plan, redes, posts recientes, descripción) en el system prompt.

**Response `200`**
```json
{
  "reply": "string"
}
```

---

### ✅ `POST /api/ai/image`
Genera una imagen a partir de un prompt usando Cloudflare Workers AI con el modelo `flux-1-schnell`.

**Auth:** Sesión Supabase activa
**Request Body**
```json
{
  "prompt": "string (obligatorio)"
}
```

**Response `200`**
```json
{
  "image": "data:image/png;base64,... (cadena codificada en Base64 con el prefijo de URI de datos)"
}
```
**Errores:**
- `400` prompt vacío o inválido
- `401` no autenticado
- `500` error de Cloudflare AI o credenciales faltantes

---

## 10. Waitlist

### ✅ `POST /api/waitlist`
Registra a alguien en la lista de espera (beta cerrada).

**Auth:** No requerida — endpoint público. Usa `SUPABASE_SERVICE_ROLE_KEY` para escribir en la tabla `waitlist` sin sesión.
**Request Body**
```json
{
  "fullName": "string (obligatorio)",
  "email": "string (obligatorio)",
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
**Errores:** `400` campos obligatorios faltantes · `409` email ya registrado

---

## 11. Instagram — OAuth & Publicación

> Solo Instagram Graph API. El flujo OAuth usa Facebook Login (Instagram usa la plataforma de Meta).

### ✅ `GET /api/instagram/connect`
Genera la URL de autorización de Meta OAuth y redirige al usuario.

**Auth:** Sesión Supabase activa (redirección si no está autenticado)
**Query Params:** `clientId` (uuid)
**Response:** Redirect `302` a la URL de OAuth de Meta, guardando una cookie HTTP-only `ig_oauth_state` para protección CSRF.

---

### ✅ `GET /api/instagram/callback`
Callback de Meta OAuth. Intercambia el `code` por el access token y lo guarda/actualiza en Supabase.

**Query Params:** `code` (string), `state` (formato `clientId:nonce`)
**Lógica interna:**
1. Valida el nonce del `state` contra la cookie `ig_oauth_state`.
2. Intercambia el código de autorización por un token short-lived.
3. Intercambia el token short-lived por un token long-lived (válido por 60 días).
4. Obtiene el perfil de Instagram (debe ser tipo `BUSINESS` o `MEDIA_CREATOR`).
5. Guarda/actualiza en la tabla `social_accounts` de Supabase (`is_simulated: false`, `access_token` y `token_expires_at`).

**Response:** Redirect `302` a `/clientes?ig_connected=1` o `ig_error=<motivo>`

---

### ⚠️ `POST /api/instagram/publish` (Helper interno)
No está expuesto como un endpoint público/HTTP independiente. La publicación se ejecuta internamente mediante la función `publishToInstagram` en `@/lib/instagram` que es llamada por el job worker de QStash.

**Lógica interna:**
1. Obtiene el token de Instagram; si expira en menos de 10 días, intenta renovarlo automáticamente.
2. Si es una sola imagen, la sube al Container de Instagram y la publica.
3. Si son múltiples imágenes (hasta 10), crea containers individuales, luego un container de carrusel y lo publica.
4. Actualiza `post_publications` a `status = "published"`, guarda `external_post_id` y `published_at`.

---

### ✅ `GET /api/instagram/refresh-token`
Cron diario (Vercel Cron) que mantiene vivos los tokens long-lived de Instagram.

**Auth:** Protegido por firma de Cron (header `x-vercel-cron` o `Bearer CRON_SECRET`).
**Lógica interna:** Escanea las cuentas de Instagram reales en `social_accounts` cuyo token expira en menos de 10 días y los refresca usando el token exchange de Meta.
**Response `200`** — Estadísticas del refresco `{ refreshed, failed, failedIds, scanned }`

---

## 12. Jobs internos (QStash)

> Estos endpoints son llamados automáticamente por **Upstash QStash** en el momento programado. No son accesibles desde el frontend. Validan la firma con el header `upstash-signature`.

### ✅ `POST /api/qstash/publish/:postId`
Job principal de publicación. QStash llama este endpoint cuando llega el horario programado de un post.

**Headers:** `upstash-signature: <firma HMAC>`
**Lógica interna:**
1. Valida la firma HMAC de QStash para autenticar la llamada.
2. Si el post no existe o no está en estado `scheduled`, responde `200` y salta la ejecución.
3. Obtiene las redes y busca si la cuenta de red social asociada para cada una es real o simulada.
4. Para redes reales (Instagram, `is_simulated = false`), intenta publicar de verdad usando la API de Instagram.
5. Para redes simuladas, genera métricas de demo plausibles y marca la publicación como `"simulated"`.
6. Si falla en todas las redes, marca el post como `failed`. Si alguna red tiene éxito (o es simulada), marca el post como `published`.

**Response `200`** — `{ published: boolean, results: [...] }`
**Errores:** `401` firma inválida · `500` error inesperado (QStash reintenta con backoff exponencial)

---

## 13. Cron de Vercel

> Endpoints para tareas programadas (barridos) llamados de manera recurrente por Vercel Cron. Protegidos por firma de Cron (header `x-vercel-cron` o `Bearer CRON_SECRET`).

### ✅ `GET /api/cron/enqueue-due`
Cron que "barre" y encola en QStash las publicaciones programadas que entran en la ventana de los próximos 6.5 días y aún no fueron encoladas (`qstash_message_id` nulo). Resuelve la limitación de 7 días del plan free de QStash.

**Response `200`** — `{ enqueued, failed, failedIds, scanned }`

---

## 14. Configuración

> Endpoints pendientes de implementación. Solo existen carpetas con `.gitkeep` de placeholder.

### ⬜ `GET /api/settings/general`
Configuración general del usuario. (No implementado)

### ⬜ `PATCH /api/settings/general`
Actualizar configuración general. (No implementado)

### ⬜ `GET /api/settings/notifications`
Preferencias de notificaciones del usuario. (No implementado)

### ⬜ `PATCH /api/settings/notifications`
Actualizar preferencias de notificaciones. (No implementado)

---

## Resumen por pantalla

| Pantalla / Feature | Estado | Endpoints utilizados |
|---|---|---|
| Landing page | ✅ | `POST /api/waitlist` |
| Login (email/password) | ✅ | Supabase Auth SDK — sin endpoint propio |
| Waitlist | ✅ | `POST /api/waitlist` |
| Dashboard / Inicio | ⚠️ | `GET /api/metrics?period=7d` (⬜) · `GET /api/posts` |
| Clientes — listado | ✅ | `GET /api/clients` |
| Clientes — crear | ✅ | `POST /api/clients` |
| Clientes — editar | ✅ | `GET /api/clients/:id` · `PATCH /api/clients/:id` |
| Clientes — eliminar | ✅ | `DELETE /api/clients/:id` |
| Clientes — cuentas sociales | ✅ | `GET /api/clients/:id/social-accounts` · `POST /api/clients/:id/social-accounts` · `DELETE /api/clients/:id/social-accounts/:accountId` |
| Clientes — conectar Instagram (OAuth) | ✅ | `GET /api/instagram/connect` → `GET /api/instagram/callback` · `GET /api/instagram/refresh-token` |
| Calendario | ✅ | `GET /api/posts` · `POST /api/posts` · `GET/POST /api/calendar/events` · `GET/PATCH/DELETE /api/calendar/events/:eventId` |
| Métricas | ⬜ | `GET /api/metrics` |
| Nueva publicación — crear | ✅ | `POST /api/posts` · `POST /api/posts/media` |
| Nueva publicación — editar borrador | ✅ | `GET /api/posts/:id` · `PATCH /api/posts/:id` |
| Nueva publicación — solicitud de aprobación | ✅ | `POST /api/posts/:id/request-approval` |
| Aprobación de posts (público) | ✅ | `GET /api/approve/:token` · `POST /api/approve/:token` |
| Nueva publicación — IA reescribir | ✅ | `POST /api/ai/rewrite` |
| Nueva publicación — IA hashtags | ⚠️ | `POST /api/ai/hashtags` (sin `grouped`) |
| Nueva publicación — IA horario | ✅ | `POST /api/ai/best-time` |
| Configuración — General | ⬜ | `GET /api/settings/general` · `PATCH /api/settings/general` |
| Configuración — Notificaciones | ⬜ | `GET /api/settings/notifications` · `PATCH /api/settings/notifications` |
| Configuración — Perfil | ✅ | `GET /api/users/me` · `PATCH /api/users/me` |
| Configuración — Cerrar sesión | ✅ | `POST /api/auth/logout` |
| Configuración — Eliminar cuenta | ✅ | `DELETE /api/users/me` |
| Chat IA (sidebar) | ✅ | `POST /api/ai/chat` |
| Generador de imágenes de Copi | ✅ | `POST /api/ai/image` |
| Job scheduling (interno) | ✅ | `POST /api/qstash/publish/:postId` ← llamado por QStash |
| Cron de barrido programado (interno) | ✅ | `GET /api/cron/enqueue-due` |

---

## Convenciones generales

- **Autenticación:** Supabase Auth. El frontend maneja cookies de sesión automáticamente. El servidor valida con `supabase.auth.getUser()` en cada request protegido. Excepción: los endpoints de IA (`/api/ai/*`) no validan sesión (salvo `/api/ai/image` que sí requiere sesión activa), y `/api/approve/:token` es público sin autenticación.
- **Content-Type:** `application/json` para todos los endpoints salvo `POST /api/posts/media` que usa `multipart/form-data`.
- **Errores estándar:**
  - `400` Bad Request — validación de campos
  - `401` Unauthorized — sesión inválida o expirada
  - `403` Forbidden — recurso de otro usuario
  - `404` Not Found — recurso inexistente
  - `409` Conflict — duplicado o estado inválido
  - `500` Internal Server Error
- **IDs:** UUIDs v4 generados por Supabase.
- **Fechas:** ISO 8601 con timezone UTC.
- **Paginación:** `page` + `limit` no implementados en `GET /api/posts` (pendiente).
- **Storage:** Imágenes se suben a Supabase Storage (bucket `post-media`). Máximo 10 MB, solo imágenes.
- **Jobs QStash:** validados con HMAC signature. Si falla, QStash reintenta automáticamente hasta 3 veces con backoff exponencial.
- **Redes simuladas:** En el MVP, las cuentas sociales se conectan de forma simulada (no hay OAuth real salvo Instagram que está pendiente). El flag `is_simulated` en `social_accounts` indica si es una conexión real o de demo.
- **Aprobación de posts:** Los posts pasan por un flujo de estados: `draft` → `pending_approval` → `approved` / `draft` (rechazado). El CM solicita aprobación con `POST /api/posts/:postId/request-approval` y el cliente usa `/api/approve/:token` (público).