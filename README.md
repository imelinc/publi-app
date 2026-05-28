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
| IA | Groq (llama-3.3-70b-versatile) |
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
| `QSTASH_URL` | URL del servidor QStash (solo local, ver más abajo) |
| `QSTASH_TOKEN` | Token de Upstash QStash |
| `QSTASH_CURRENT_SIGNING_KEY` | Firma QStash actual |
| `QSTASH_NEXT_SIGNING_KEY` | Firma QStash siguiente |
| `CRON_SECRET` | Secreto que protege el cron `/api/cron/enqueue-due` (Vercel) |
| `BLOB_READ_WRITE_TOKEN` | Token de Vercel Blob |
| `NEXT_PUBLIC_APP_URL` | URL base de la app |

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

> **Producción / Vercel preview:** en vez de las credenciales de dev, usá las reales del [dashboard de QStash](https://console.upstash.com/qstash) y configurá `CRON_SECRET`. El cron diario (`vercel.json`) encola las publicaciones programadas a más de 7 días cuando entran en ventana.

---

## Documentación

- [Arquitectura del sistema](docs/ARCHITECTURE.md) — stack, base de datos, autenticación, scheduling, IA, deploy e infraestructura
- [Endpoints de la API](docs/api-endpoints.md) — referencia completa de los Route Handlers de Next.js

---

## Estado del proyecto

> MVP en desarrollo — actualmente el frontend trabaja con datos hardcodeados (mock data).
> La integración con Supabase, Instagram Graph API y el resto de servicios se desarrolla en la etapa actual.
