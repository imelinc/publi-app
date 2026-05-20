# publi — Sprint 2: Planificación

> **Objetivo del sprint:** Tener un flujo completo de publicación funcionando de punta a punta.
> Al final del sprint, un CM tiene que poder crear un post, programarlo, y que se publique solo en Instagram en el horario elegido.

---

## 📁 Área 1 — Perfil y usuarios

Lo básico que hace que el producto se sienta real para quien lo usa.

- Endpoint de perfil completo (`GET /api/users/me`)
- Edición de nombre, workspace y timezone (`PATCH /api/users/me`)
- Cambio de contraseña y eliminación de cuenta (`PATCH /api/users/me/password` · `DELETE /api/users/me`)

---

## 📝 Área 2 — Publicaciones y calendario

El corazón del producto. Sin esto no hay scheduling.

- Completar filtros y paginación en listado de posts (`GET /api/posts`)
- Detalle y edición de publicaciones individuales (`GET /api/posts/:postId` · `PATCH /api/posts/:postId`)
- Upload de imágenes a Vercel Blob (`POST /api/posts/media`)
- Conectar el calendario con datos reales de Supabase (eliminar mocks)

---

## 🤖 Área 3 — IA y seguridad

Cerrar deuda técnica del Sprint 1 antes de sumar features nuevas.

- Agregar autenticación obligatoria a todos los endpoints de Groq (`/api/ai/*`) ✅

---

## Definición de terminado

Una área se considera completa cuando:

1. Funciona en Vercel en **producción** (no solo en local)
2. Todos los endpoints tienen autenticación (`supabase.auth.getUser()` + 401)
3. Fue probada manualmente por al menos un integrante distinto al que la implementó

---

## Fuera del alcance (Sprint 3+)

- Integración con **Meta / Instagram Graph API** para métricas
- Métricas agregadas y dashboard con datos reales
