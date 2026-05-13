# Guía para contribuir a publi

Bienvenido al repositorio de **publi**. Esta guía explica paso a paso cómo trabajar en el proyecto, desde clonar el repositorio hasta que tus cambios lleguen al código oficial.

> ⚠️ **Regla principal:** Nadie pushea directo a `main`. Todo cambio entra por un Pull Request (PR) que debe ser aprobado antes de mergearse.

---

## Índice

1. [Configuración inicial (hacé esto una sola vez)](#1-configuración-inicial-hacé-esto-una-sola-vez)
2. [Flujo de trabajo diario](#2-flujo-de-trabajo-diario)
3. [Cómo crear una rama (branch)](#3-cómo-crear-una-rama-branch)
4. [Cómo hacer commits](#4-cómo-hacer-commits)
5. [Cómo subir tus cambios (push)](#5-cómo-subir-tus-cambios-push)
6. [Cómo abrir un Pull Request](#6-cómo-abrir-un-pull-request)
7. [Cómo actualizar tu rama con los últimos cambios](#7-cómo-actualizar-tu-rama-con-los-últimos-cambios)
8. [Convenciones de nombres](#8-convenciones-de-nombres)
9. [Preguntas frecuentes](#9-preguntas-frecuentes)

---

## 1. Configuración inicial (hacé esto una sola vez)

### 1.1 Instalá Git

Bajalo de [git-scm.com](https://git-scm.com/downloads) e instalalo. Para verificar que quedó bien:

```bash
git --version
```

Debería mostrar algo como `git version 2.x.x`.

### 1.2 Configurá tu nombre y email en Git

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

Usá el mismo email con el que te registraste en GitHub.

### 1.3 Cloná el repositorio

```bash
git clone https://github.com/[usuario]/publi.git
```

Esto crea una carpeta `publi` en tu computadora con todo el código.

### 1.4 Entrá a la carpeta del proyecto

```bash
cd publi/publi
```

### 1.5 Instalá las dependencias

```bash
npm install
```

### 1.6 Configurá las variables de entorno

```bash
cp .env.example .env.local
```

Completá `.env.local` con los valores que te pase el líder del proyecto. **Nunca compartas ese archivo ni lo subas a GitHub.**

### 1.7 Levantá el proyecto localmente

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en el navegador. Si ves la landing de publi, todo está funcionando.

---

## 2. Flujo de trabajo diario

Antes de empezar a trabajar cualquier día, seguí estos tres pasos en orden:

```bash
# 1. Asegurate de estar en main
git checkout main

# 2. Traé los últimos cambios del repositorio remoto
git pull origin main

# 3. Creá tu rama para trabajar (ver sección 3)
git checkout -b feature/nombre-de-tu-tarea
```

Nunca trabajes directamente sobre `main`.

---

## 3. Cómo crear una rama (branch)

Cada tarea o feature nueva va en su propia rama. El nombre de la rama debe describir qué estás haciendo.

```bash
git checkout -b feature/nombre-descriptivo
```

### Ejemplos de nombres de ramas

```bash
git checkout -b feature/endpoint-clientes
git checkout -b feature/integracion-instagram-oauth
git checkout -b feature/pagina-metricas-datos-reales
git checkout -b fix/bug-calendario-fecha-incorrecta
git checkout -b fix/error-upload-imagen
```

### Prefijos que usamos

| Prefijo | Cuándo usarlo |
|---|---|
| `feature/` | Cuando agregás algo nuevo |
| `fix/` | Cuando corregís un bug |
| `refactor/` | Cuando reorganizás código sin cambiar funcionalidad |
| `docs/` | Cuando solo modificás documentación |

Para verificar en qué rama estás en cualquier momento:

```bash
git branch
```

La rama con `*` es en la que estás parado.

---

## 4. Cómo hacer commits

Un commit es una foto del estado de tu código en un momento dado. Hacé commits frecuentes — mejor muchos commits pequeños que uno gigante al final.

### Paso a paso

**1. Verificá qué archivos cambiaste:**
```bash
git status
```

Te muestra en rojo los archivos modificados o nuevos que todavía no están listos para commitear.

**2. Agregá los archivos que querés incluir en el commit:**
```bash
# Agregar un archivo específico
git add src/app/api/clients/route.ts

# Agregar todos los archivos modificados
git add .
```

Después de hacer `git add`, corré `git status` de nuevo. Los archivos en verde están listos para el commit.

**3. Hacé el commit con un mensaje descriptivo:**
```bash
git commit -m "feat: crear endpoint GET /api/clients"
```

### Cómo escribir el mensaje del commit

El formato es: `tipo: descripción corta en presente`

```bash
git commit -m "feat: agregar endpoint de creación de clientes"
git commit -m "fix: corregir cálculo de fechas en calendario"
git commit -m "refactor: extraer lógica de Instagram a lib/instagram.ts"
git commit -m "docs: actualizar README con instrucciones de instalación"
```

| Tipo | Cuándo usarlo |
|---|---|
| `feat` | Agregás una funcionalidad nueva |
| `fix` | Corregís un bug |
| `refactor` | Cambiás código sin agregar ni quitar funcionalidad |
| `docs` | Solo cambiás documentación |
| `style` | Cambios de formato, espacios, etc. (sin lógica) |
| `chore` | Tareas de mantenimiento (actualizar dependencias, etc.) |

---

## 5. Cómo subir tus cambios (push)

Una vez que tenés commits en tu rama local, subílos a GitHub:

```bash
git push origin nombre-de-tu-rama
```

**Ejemplo:**
```bash
git push origin feature/endpoint-clientes
```

La primera vez que pusheas una rama nueva, Git puede pedirte que configures el upstream. Si te muestra un mensaje de error con una sugerencia, copiá el comando que te da (normalmente `git push --set-upstream origin nombre-de-tu-rama`) y ejecutalo.

---

## 6. Cómo abrir un Pull Request

Un Pull Request (PR) es la forma de pedirle al equipo que revise tus cambios antes de que entren a `main`.

### Paso a paso

**1.** Subí tu rama a GitHub (ver sección 5).

**2.** Abrí el repositorio en [github.com](https://github.com). GitHub debería mostrarte un banner amarillo que dice algo como:

> "Tu rama `feature/endpoint-clientes` tiene cambios recientes. ¿Querés abrir un Pull Request?"

Hacé click en **"Compare & pull request"**.

**3.** Si no aparece el banner, hacé click en **"Pull requests"** en el menú superior y luego en **"New pull request"**.

**4.** Completá el formulario del PR:

- **Title (Título):** Describí claramente qué hace el PR.
  - ✅ `feat: endpoints CRUD de clientes`
  - ✅ `fix: corregir error al guardar configuración`
  - ❌ `cambios` ❌ `arreglos` ❌ `WIP`

- **Description (Descripción):** Explicá qué cambiaste y por qué. Podés usar esta plantilla:

```
## ¿Qué hace este PR?
[Describí brevemente los cambios]

## ¿Cómo probarlo?
[Pasos para verificar que funciona]

## Notas adicionales
[Cualquier cosa relevante para el revisor]
```

**5.** En la sección **"Reviewers"** (panel derecho), seleccioná al líder del proyecto para que revise el PR.

**6.** Hacé click en **"Create pull request"**.

### Después de abrir el PR

- Esperá la revisión. El revisor puede pedir cambios o aprobarlo.
- Si piden cambios: hacé los cambios en tu rama local, commitealos y pushealos. El PR se actualiza automáticamente.
- Una vez aprobado, el líder mergea el PR a `main`.
- **No cierres el PR vos mismo** a menos que lo canceles.

---

## 7. Cómo actualizar tu rama con los últimos cambios

Si `main` recibió cambios mientras estabas trabajando en tu rama (porque otro PR fue mergeado), necesitás traer esos cambios a tu rama para evitar conflictos.

```bash
# 1. Guardá los cambios que no commiteaste todavía (si los hay)
git stash

# 2. Actualizá main
git checkout main
git pull origin main

# 3. Volvé a tu rama
git checkout feature/tu-rama

# 4. Incorporá los cambios de main en tu rama
git merge main

# 5. Si hiciste stash antes, recuperá tus cambios
git stash pop
```

Si aparecen **conflictos** (Git no puede resolver automáticamente los cambios), los archivos en conflicto van a tener marcas como estas:

```
<<<<<<< HEAD
// tu código
=======
// código de main
>>>>>>> main
```

Editá el archivo para quedarte con la versión correcta (o una combinación de ambas), eliminá las marcas, guardá, y hacé:

```bash
git add archivo-en-conflicto.ts
git commit -m "fix: resolver conflicto en archivo-en-conflicto.ts"
```

Si no sabés cómo resolver un conflicto, pedile ayuda al líder del proyecto antes de commitear.

---

## 8. Convenciones de nombres

### Ramas
```
feature/descripcion-con-guiones
fix/descripcion-con-guiones
refactor/descripcion-con-guiones
```

### Commits
```
tipo: descripción corta en presente
```

### Archivos y carpetas
- Componentes React: `PascalCase.tsx` → `ClientCard.tsx`
- Hooks: `camelCase.ts` → `useClients.ts`
- Utilidades: `camelCase.ts` → `formatDate.ts`
- Carpetas: `kebab-case` → `nueva-publicacion/`

### Variables y funciones TypeScript
- Variables y funciones: `camelCase` → `const clientName = ...`
- Tipos e interfaces: `PascalCase` → `interface ClientCard { ... }`
- Constantes globales: `UPPER_SNAKE_CASE` → `const MAX_CLIENTS = 10`

---

## 9. Preguntas frecuentes

**¿Me equivoqué en el mensaje del último commit. Cómo lo corrijo?**
```bash
git commit --amend -m "mensaje correcto"
```
Solo funciona si todavía no hiciste push.

---

**¿Cómo veo el historial de commits?**
```bash
git log --oneline
```
Presioná `q` para salir.

---

**¿Cómo descarto cambios que hice en un archivo y volvés a la última versión commiteada?**
```bash
git checkout -- src/components/dashboard/ClientCard.tsx
```
⚠️ Esto es irreversible — perdés los cambios del archivo.

---

**¿Cómo veo qué cambié exactamente en cada archivo?**
```bash
git diff
```

---

**¿Me olvidé de crear una rama y commiteé en main directamente?**

No hagas push. Ejecutá esto:
```bash
# Creá la rama con esos commits
git checkout -b feature/nombre-de-la-rama

# Volvé main al estado original
git checkout main
git reset --hard origin/main
```
Tus commits van a estar en la nueva rama, y main queda limpio.

---

**¿Cómo cancelo un PR?**

En GitHub, abrí el PR y hacé click en **"Close pull request"** al pie de la página. La rama no se borra automáticamente.

---

**¿Cómo borro una rama local que ya no necesito?**
```bash
git branch -d feature/rama-ya-mergeada
```

---

**Me aparece "Your branch is behind 'origin/main'"¿Qué hago?**
```bash
git pull origin main
```

---

**Rompí todo y quiero volver al último commit.**
```bash
git reset --hard HEAD
```
⚠️ Perdés todos los cambios no commiteados. Irreversible.

---

Para cualquier duda que no esté acá, preguntale directamente al líder del proyecto antes de intentar algo que no estés seguro.
