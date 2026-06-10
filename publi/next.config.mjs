import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fija la raíz del workspace a esta carpeta (publi/). Sin esto, si aparece un
  // package-lock.json en la carpeta padre, Next infiere la raíz mal y Turbopack
  // termina escaneando el worktree de .claude/ (copia completa del proyecto),
  // colgando la compilación.
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
