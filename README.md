# publi — Managing Communities

Plataforma de gestión unificada de redes sociales para Community Managers freelance.
Permite programar publicaciones en Instagram, visualizar calendarios de contenido y gestionar múltiples clientes desde un único dashboard.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript (strict) |
| Estilos | Tailwind CSS + shadcn/ui |
| Estado global | Zustand |
| Base de datos | Supabase (PostgreSQL + Auth) |
| Storage | Vercel Blob |
| Scheduling | Upstash QStash |
| IA | Groq (llama-3.3-70b-versatile) + Cloudflare (flux-1-schnell) |
| Red social | Instagram Graph API |
| Deploy | Vercel |

---

## Equipo

Alves Mendes · D'Astolfo · Gavotti · Gonzalez Miel · Melinc · Young Christiansen

---

## Levantar el proyecto localmente

**Requisitos:** Node.js 18+

```bash
git clone https://github.com/imelinc/publi-app.git
cd publi-app
npm install
cp .env.example .env.local   # completar variables
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en el navegador.

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anon pública de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (solo servidor) |
| `GROQ_API_KEY` | API key de Groq (solo servidor) |
| `META_APP_ID` | App ID de Meta Developers |
| `META_APP_SECRET` | App Secret de Meta (solo servidor) |
| `META_REDIRECT_URI` | Callback URL del OAuth de Meta |
| `INSTAGRAM_APP_ID` | Instagram App ID (producto "Instagram" de la app de Meta) |
| `INSTAGRAM_APP_SECRET` | Instagram App Secret (solo servidor) |
| `INSTAGRAM_REDIRECT_URI` | Opcional: fija el redirect_uri del OAuth de Instagram |
| `QSTASH_URL` | URL del servidor QStash (solo local, ver más abajo) |
| `QSTASH_TOKEN` | Token de Upstash QStash |
| `QSTASH_CURRENT_SIGNING_KEY` | Firma QStash actual |
| `QSTASH_NEXT_SIGNING_KEY` | Firma QStash siguiente |
| `CRON_SECRET` | Secreto que protege el cron `/api/cron/enqueue-due` (Vercel) |
| `BLOB_READ_WRITE_TOKEN` | Token de Vercel Blob |
| `NEXT_PUBLIC_APP_URL` | URL base de la app |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID de Cloudflare (solo servidor) |
| `CLOUDFLARE_API_TOKEN` | API Token de Cloudflare Workers AI (solo servidor) |

> Las variables con prefijo `NEXT_PUBLIC_` son accesibles desde el browser. El resto son exclusivas del servidor.

---

## Probar el scheduling de publicaciones localmente

Las publicaciones programadas se publican vía **Upstash QStash**: al programar un post se encola un job que, al llegar la fecha, hace un callback a `/api/qstash/publish/[postId]` (hoy simula la publicación).

QStash **no puede llamar a `localhost`**, así que para probar el ciclo completo en local se usa el **servidor QStash de desarrollo** que provee Upstash (corre en tu máquina y sí alcanza a `localhost`):

```bash
# En una terminal aparte, dejándola corriendo junto al dev server:
npx @upstash/qstash-cli dev
```

Al arrancar imprime credenciales de desarrollo fijas. Copiá las 4 a tu `.env.local`:

```bash
QSTASH_URL=http://127.0.0.1:8080
QSTASH_TOKEN=...                 # el que imprime el CLI
QSTASH_CURRENT_SIGNING_KEY=...   # el que imprime el CLI
QSTASH_NEXT_SIGNING_KEY=...      # el que imprime el CLI
```

Reiniciá `npm run dev` y listo: programá un post para dentro de unos minutos y se publicará solo (la card pasa de **Programada** a **Publicada** automáticamente vía Supabase Realtime). No hace falta tocar código: el SDK toma `QSTASH_URL` del entorno.

### Crons de Vercel

`vercel.json` define dos crons diarios (los horarios están en **UTC**):

| Cron | Horario | Equivale en Argentina (UTC-3) | Para qué |
|---|---|---|---|
| `/api/cron/enqueue-due` | `0 3 * * *` (03:00 UTC) | 00:00 | Encola en QStash las publicaciones programadas a >6.5 días que entran en ventana (límite de 7 días del plan free). |
| `/api/instagram/refresh-token` | `0 4 * * *` (04:00 UTC) | 01:00 | Refresca los tokens long-lived de Instagram que vencen en <10 días. |

Corren a la medianoche argentina, justo antes del horario pico de publicación. Ambos endpoints se autorizan con el header `x-vercel-cron` (que Vercel manda en prod) o con `Authorization: Bearer $CRON_SECRET` (para dispararlos a mano en dev/preview).

---

## Conexión de cuentas de Instagram

La conexión de Instagram usa la **"Instagram API with Instagram Login"** (OAuth directo, sin Página de Facebook). El CM aprieta "Conectar con Instagram" en *Gestionar redes* de un cliente, inicia sesión en Instagram, y la app guarda un **token long-lived (60 días)** que se **refresca solo** (cron diario `/api/instagram/refresh-token`). Las otras 5 redes siguen siendo simuladas.

### Qué es la "app de Meta" y por qué hace falta

Es una aplicación registrada en [developers.facebook.com](https://developers.facebook.com) que provee el `client_id`/`client_secret` del OAuth. Es **una sola app para toda la plataforma** (no una por cliente) y es la identidad contra la que Instagram autentica. Sin ella no se puede conectar ninguna cuenta.

Setup (una vez):
1. Crear app tipo **Business** → agregar producto **Instagram** → "API setup with Instagram login".
2. Copiar el **Instagram App ID** y **Instagram App Secret** → `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET`.
3. Registrar el **redirect URI** exacto (`https://<dominio>/api/instagram/callback`) en *Business login settings*.
4. Agregar la cuenta de prueba como **Instagram Tester** y aceptar la invitación.

### Requisitos y limitaciones (a comunicar al usuario)

- **La cuenta debe ser Business o Creator.** Las cuentas personales no pueden autorizar ni publicar por API.
- **Development mode:** mientras la app no pase **App Review**, solo cuentas agregadas como *tester* pueden conectarse (suficiente para la demo). Para que cualquier cliente del CM conecte su cuenta real, la app debe aprobar la revisión de `instagram_business_basic` + `instagram_business_content_publish` y estar en **Live mode**.
- El `access_token` se guarda en `social_accounts.access_token` (texto plano por ahora; protegido por RLS + service role) y **nunca** se expone al browser.

> Probar el OAuth requiere un dominio público con HTTPS → usar un **deploy de Vercel preview** (igual que QStash). El estado del cliente final (publicar de verdad) llega en una etapa posterior; hoy solo se conecta y verifica la cuenta.

> **Producción / Vercel preview:** en vez de las credenciales de dev, usá las reales del [dashboard de QStash](https://console.upstash.com/qstash) y configurá `CRON_SECRET`. El cron diario (`vercel.json`) encola las publicaciones programadas a más de 7 días cuando entran en ventana.

---

## Documentación

- [Arquitectura del sistema](docs/ARCHITECTURE.md) — stack, base de datos, autenticación, scheduling, IA, deploy e infraestructura
- [Endpoints de la API](docs/api-endpoints.md) — referencia completa de los Route Handlers de Next.js

---

## Estado del proyecto

> MVP en desarrollo — actualmente el frontend trabaja con datos hardcodeados (mock data).
> La integración con Supabase, Instagram Graph API y el resto de servicios se desarrolla en la etapa actual.
