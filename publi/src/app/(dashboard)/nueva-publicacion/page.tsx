'use client'

import { useEffect } from 'react'
import { PostForm } from '@/components/dashboard/PostForm'

export default function NuevaPublicacionPage() {
  useEffect(() => {
    const startTime = Date.now()

    // Enviar updates de tiempo cada 10 segundos
    const interval = setInterval(async () => {
      try {
        await fetch('/api/users/me/creation-time', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seconds: 10 }),
        })
      } catch (e) {
        console.error('Error reporting creation time:', e)
      }
    }, 10000)

    return () => {
      clearInterval(interval)
      // Enviar el residuo de segundos al salir de la pantalla
      const elapsedSeconds = Math.round((Date.now() - startTime) / 1000) % 10
      if (elapsedSeconds > 0) {
        fetch('/api/users/me/creation-time', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seconds: elapsedSeconds }),
        }).catch((e) => console.error('Error reporting final creation time:', e))
      }
    }
  }, [])

  return <PostForm mode="create" />
}
