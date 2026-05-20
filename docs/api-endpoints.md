# publi — Documentación de API Endpoints

> **Stack:** Next.js 14 (TypeScript) · Supabase (DB + Auth) · Vercel Blob (storage) · Upstash QStash (scheduling) · Groq API (IA)  
> **Convención de rutas:** Next.js API Routes en `app/api/...`  
> **Autenticación:** Supabase Auth — el cliente JS maneja la sesión automáticamente. Los endpoints del servidor validan con `supabase.auth.getUser()`.  
> **Fecha de relevamiento:** Mayo 2026 — actualizado con inspección del repositorio

> **Estado de implementación:** verificado contra `publi/src/app/api/**/route.ts`.
>
> - ✅ Implementado: existe el endpoint y cubre el contrato principal.
> - ⚠️ Parcial: existe el endpoint, pero falta parte del contrato documentado.
> - ⬜ Pendiente: no existe implementación en el repositorio.

---

## Índice

1. [Auth](#1-auth)
2. [Usuarios](#2-usuarios)
3. [Clientes (Workspaces)](#3-clientes-workspaces)
4. [Publicaciones](#4-publicaciones)
5. [Calendario (Eventos)](#5-calendario-eventos)
6. [Métricas](#6-métricas)
7. [IA — Asistente (Groq)](#7-ia--asistente-groq)
8. [Waitlist](#8-waitlist)
9. [Instagram — OAuth & Publicación](#9-instagram--oauth--publicación)
10. [Jobs internos (QStash)](#10-jobs-internos-qstash)

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
  "workspaceName": "string",
  "createdAt": "ISO 8601"
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
**Response `200`** — perfil actualizado

---

### ✅ `DELETE /api/users/me`
Elimina la cuenta del usuario. Acción irreversible. Elimina también todos sus clientes y publicaciones (cascade en DB).

**Auth:** Sesión Supabase activa  
**Response `204`** — sin body

---

## 3. Clientes (Workspaces)

> Cada "cliente" es un workspace aislado que agrupa publicaciones y la cuenta de Instagram conectada.

### ✅ `GET /api/clients`
Lista todos los clientes del usuario autenticado con sus estadísticas.

**Auth:** Sesión Supabase activa  
**Response `200`**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
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
  ]
}
```

---

### ✅ `POST /api/clients`
Crea un nuevo cliente.

**Nota sobre Redes (`networks`):** El parámetro `networks` en el cuerpo es opcional y no se persiste directamente en la tabla `clients`. La conexión real con Instagram (única red soportada) se realiza posteriormente mediante el flujo de autorización Meta OAuth (que crea un registro en `instagram_accounts`). Si existe la cuenta conectada, se devolverá automáticamente `"instagram"` en `connectedNetworks`.

**Auth:** Sesión Supabase activa  
**Request Body**
```json
{
  "name": "string",
  "color": "string (hex)",
  "networks": ["instagram"]
}
```
**Response `201`**
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "color": "string (hex)",
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
Edita nombre o color de un cliente. (El campo `networks` es ignorado ya que se maneja dinámicamente mediante la conexión OAuth de Instagram).

**Auth:** Sesión Supabase activa  
**Request Body** (todos opcionales)
```json
{
  "name": "string",
  "color": "string (hex)"
}
```
**Response `200`**
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
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

## 4. Publicaciones

> Este endpoint es el núcleo del sistema. También cubre la vista de **Calendario**: usando los parámetros `from`, `to` y `view` se obtienen las publicaciones agrupadas por día sin necesidad de un endpoint separado. La creación de eventos desde el calendario usa directamente `POST /api/posts`.

### ⚠️ `GET /api/posts`
Lista publicaciones con filtros. Usado en calendario, métricas y dashboard.

**Estado repo:** lista publicaciones del usuario, pero todavía no aplica query params (`clientId`, `status`, `from`, `to`, `view`, `page`, `limit`) ni devuelve paginación.

**Auth:** Sesión Supabase activa  
**Query Params**
| Param | Tipo | Descripción |
|---|---|---|
| `clientId` | string | UUID o `all` |
| `status` | string | `draft \| scheduled \| published \| failed` |
| `from` | ISO date | Fecha inicio |
| `to` | ISO date | Fecha fin |
| `view` | string | `month \| week` — agrupa resultados por día cuando se indica |
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

### ⚠️ `POST /api/posts`
Crea una publicación nueva (borrador, programada o inmediata).

**Estado repo:** crea publicaciones básicas, pero todavía no encola QStash para `scheduled`, no publica en Instagram para `published` y no valida cuenta de Instagram conectada.

**Auth:** Sesión Supabase activa  
**Request Body**
```json
{
  "clientId": "uuid",
  "title": "string",
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
    "status": "draft | scheduled | published",
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
**Errores:** `400` validación · `403` cuenta de Instagram no conectada

---

### ⬜ `GET /api/posts/:postId`
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
    "status": "draft | scheduled | published | failed",
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

---

### ⬜ `PATCH /api/posts/:postId`
Edita una publicación (solo borradores o programadas aún no ejecutadas).

**Auth:** Sesión Supabase activa  
**Request Body** (todos opcionales)
```json
{
  "title": "string",
  "description": "string",
  "hashtags": ["string"],
  "mediaUrls": ["string"],
  "status": "draft | scheduled",
  "scheduledAt": "ISO 8601 | null"
}
```
**Lógica interna:** Si cambia `scheduledAt`, cancela el job de QStash anterior y encola uno nuevo.  
**Response `200`**
```json
{
  "data": {
    "id": "uuid",
    "clientId": "uuid",
    "title": "string",
    "description": "string",
    "networks": ["instagram"],
    "status": "draft | scheduled",
    "scheduledAt": "ISO 8601 | null",
    "mediaUrls": ["string"],
    "hashtags": ["string"],
    "createdAt": "ISO 8601",
    "updatedAt": "ISO 8601"
  }
}
```
**Errores:** `409` no editable (ya publicada o fallida)

---

### ⚠️ `DELETE /api/posts/:postId`
Elimina una publicación. Si estaba programada, cancela el job de QStash.

**Estado repo:** elimina la publicación validando ownership vía cliente, pero todavía no cancela jobs de QStash.

**Auth:** Sesión Supabase activa  
**Response `204`** — sin body

---

### ⬜ `POST /api/posts/media`
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

## 5. Calendario (Eventos)

> Módulo para gestionar eventos de planificación general y fechas límites (deadlines) en el calendario, persistiendo las entradas de manera independiente de las publicaciones.

### ⚠️ `GET /api/calendar/events`
Obtiene todos los eventos del calendario creados para los clientes del usuario autenticado.

**Auth:** Sesión Supabase activa  
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
      "date": "ISO 8601"
    }
  ]
}
```

---

### ⚠️ `POST /api/calendar/events`
Crea un nuevo evento o fecha límite en el calendario.

**Auth:** Sesión Supabase activa  
**Request Body**
```json
{
  "clientId": "uuid",
  "title": "string",
  "description": "string",
  "type": "event | deadline",
  "color": "string (hex)",
  "date": "ISO 8601"
}
```
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
    "date": "ISO 8601"
  }
}
```
**Errores:** `400` campos obligatorios vacíos · `404` cliente no encontrado

---

## 6. Métricas

> Endpoint único que cubre tanto la página de Métricas como el resumen del Dashboard. El frontend lo consume con distintos parámetros según el contexto: `period=7d` para el inicio del dashboard, períodos más amplios para la página de Métricas.

### ⬜ `GET /api/metrics`
Estadísticas agregadas para la página de Métricas y el resumen del dashboard.

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

## 7. IA — Asistente (Groq)

> Todos los endpoints llaman a la **Groq API** con un system prompt fijo definido por el equipo. El "pre-entrenamiento" se logra mediante **prompt engineering** en el system prompt: se incluye el contexto del CM, el cliente activo, instrucciones de tono y comportamiento esperado. No hay entrenamiento real del modelo.
>
> **Modelo:** `llama-3.3-70b-versatile` (gratis en Groq, latencia muy baja)

### System prompt base (estructura)
```
Sos un asistente experto en community management para el CM que gestiona el cliente [clientName].
Siempre respondés en español rioplatense, de forma concisa y accionable.
Para sugerencias de horario, priorizás entre las 18 y 21hs ya que es el pico histórico de engagement.
Cuando sugerís hashtags, balanceás alcance alto, medio y nicho.
```

---

### ⚠️ `POST /api/ai/rewrite`
Reescribe o mejora el copy de una publicación para Instagram.

**Estado repo:** llama a Groq y usa contexto del cliente cuando hay sesión, pero no exige autenticación para responder.

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

### ⚠️ `POST /api/ai/hashtags`
Genera hashtags relevantes para el copy e Instagram.

**Estado repo:** llama a Groq y devuelve `hashtags`, pero no exige autenticación y todavía no devuelve `grouped`.

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

### ⚠️ `POST /api/ai/best-time`
Sugiere el mejor horario para publicar en Instagram. Combina el historial de publicaciones del cliente en Supabase con el system prompt configurado.

**Estado repo:** llama a Groq y devuelve una recomendación, pero no exige autenticación ni combina historial real de publicaciones.

**Auth:** Sesión Supabase activa  
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

### ⚠️ `POST /api/ai/chat`
Chat conversacional del asistente IA (sidebar). Consultas abiertas sobre estrategia de contenido, análisis, ideas de posts.

**Estado repo:** llama a Groq y usa contexto del cliente cuando hay sesión, pero no exige autenticación para responder.

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

## 7. Waitlist

### ✅ `POST /api/waitlist`
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

## 8. Instagram — OAuth & Publicación

> Solo Instagram Graph API. El flujo OAuth usa Facebook Login (Instagram usa la plataforma de Meta). El refresh del token se maneja automáticamente dentro del proceso de publicación: antes de publicar, el endpoint verifica si el token expira en menos de 10 días y lo renueva si es necesario.

### ⬜ `GET /api/instagram/connect`
Genera la URL de autorización de Meta OAuth y redirige al usuario.

**Auth:** Sesión Supabase activa  
**Query Params:** `clientId` (uuid)  
**Response:** Redirect `302` a la URL de OAuth de Meta

---

### ⬜ `GET /api/instagram/callback`
Callback de Meta OAuth. Intercambia el `code` por el access token y lo guarda en Supabase.

**Query Params:** `code` (string), `state` (uuid del clientId)  
**Lógica interna:**
1. Intercambia `code` por short-lived token (vía Meta API)
2. Convierte a long-lived token (válido 60 días)
3. Guarda encriptado en tabla `instagram_accounts` de Supabase

**Response:** Redirect `302` a `/clientes`

---

### ⬜ `GET /api/clients/:clientId/instagram`
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

### ⬜ `DELETE /api/clients/:clientId/instagram`
Desconecta la cuenta de Instagram de un cliente.

**Auth:** Sesión Supabase activa  
**Response `204`** — sin body

---

### ⬜ `POST /api/instagram/publish`
Publica un post en Instagram via Graph API. Llamado directamente (publicación inmediata) o desde el job de QStash (publicación programada). Refresca el token automáticamente si está próximo a vencer.

**Auth:** Sesión Supabase activa (directo) o header `x-qstash-signature` (desde QStash)  
**Request Body**
```json
{
  "postId": "uuid",
  "clientId": "uuid"
}
```
**Lógica interna:**
1. Verifica el token de Instagram; si expira en menos de 10 días lo renueva automáticamente
2. Obtiene el post y el access token desde Supabase
3. Sube la imagen al Container de Instagram (paso 1 de la Graph API)
4. Publica el container (paso 2 de la Graph API)
5. Actualiza el post en Supabase: `status = "published"`, guarda `instagramPostId`

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

## 9. Jobs internos (QStash)

> Estos endpoints son llamados automáticamente por **Upstash QStash** en el momento programado. No son accesibles desde el frontend. Validan la firma con el header `x-qstash-signature`.

### ⬜ `POST /api/jobs/publish`
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

| Pantalla / Feature | Estado | Endpoints utilizados |
|---|---|---|
| Landing page | ✅ | `POST /api/waitlist` |
| Login (email/password) | ✅ | Supabase Auth SDK — sin endpoint propio |
| Waitlist | ✅ | `POST /api/waitlist` |
| Dashboard / Inicio | ⚠️ | `GET /api/metrics?period=7d` · `GET /api/posts?view=week` |
| Clientes — listado | ✅ | `GET /api/clients` |
| Clientes — crear | ⚠️ | `POST /api/clients` |
| Clientes — editar | ⚠️ | `GET /api/clients/:id` · `PATCH /api/clients/:id` |
| Clientes — eliminar | ✅ | `DELETE /api/clients/:id` |
| Clientes — conectar Instagram | ⬜ | `GET /api/instagram/connect` → `GET /api/instagram/callback` |
| Clientes — estado Instagram | ⬜ | `GET /api/clients/:id/instagram` |
| Calendario | ⚠️ | `GET /api/posts?view=month&from=&to=` · `POST /api/posts` · `GET/POST /api/calendar/events` |
| Métricas | ⬜ | `GET /api/metrics` |
| Nueva publicación — crear | ⚠️ | `POST /api/posts` · `POST /api/posts/media` |
| Nueva publicación — editar borrador | ⬜ | `PATCH /api/posts/:id` |
| Nueva publicación — IA reescribir | ⚠️ | `POST /api/ai/rewrite` |
| Nueva publicación — IA hashtags | ⚠️ | `POST /api/ai/hashtags` |
| Nueva publicación — IA horario | ⚠️ | `POST /api/ai/best-time` |
| Configuración — General | ✅ | `GET /api/users/me` · `PATCH /api/users/me` |
| Configuración — Notificaciones | ⬜ | Eliminado / Fuera de alcance |
| Configuración — Cuenta | ⬜ | Eliminado / Fuera de alcance |
| Configuración — Cerrar sesión | ✅ | `POST /api/auth/logout` |
| Configuración — Eliminar cuenta | ✅ | `DELETE /api/users/me` |
| Chat IA (sidebar) | ⚠️ | `POST /api/ai/chat` |
| Job scheduling (interno) | ⬜ | `POST /api/jobs/publish` ← llamado por QStash |

---

## Convenciones generales

- **Autenticación:** Supabase Auth. El frontend maneja cookies de sesión automáticamente. El servidor valida con `supabase.auth.getUser()` en cada request protegido.
- **Content-Type:** `application/json` para todos los endpoints salvo `POST /api/posts/media` que usa `multipart/form-data`.
- **Errores estándar:**
  - `400` Bad Request — validación de campos
  - `401` Unauthorized — sesión inválida o expirada
  - `403` Forbidden — recurso de otro usuario
  - `404` Not Found — recurso inexistente
  - `409` Conflict — duplicado o estado inválido
  - `413` Payload Too Large — imagen demasiado grande
  - `500` Internal Server Error
- **IDs:** UUIDs v4 generados por Supabase.
- **Fechas:** ISO 8601 con timezone UTC.
- **Paginación:** `page` + `limit` en endpoints de listado.
- **Jobs QStash:** validados con HMAC signature. Si falla, QStash reintenta automáticamente hasta 3 veces con backoff exponencial.
- **Tokens de Instagram:** long-lived tokens (60 días), guardados encriptados en Supabase. El refresh es automático dentro de `/api/instagram/publish` cuando quedan menos de 10 días.
