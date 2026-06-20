'use client'

import { useState } from 'react'
import { ImageIcon, Download, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageGeneratorProps {
  clientId: string
}

export default function ImageGenerator({ clientId }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt || isLoading) return

    setIsLoading(true)
    setError(null)
    setImageUrl(null)

    try {
      const res = await fetch('/api/ai/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: trimmedPrompt, clientId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al generar la imagen')
      }

      if (data.image) {
        setImageUrl(data.image)
      } else {
        throw new Error('No se recibió la imagen de la IA')
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error de conexión al servidor')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!imageUrl) return
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `copi-generado-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full min-h-0 bg-white">
      {/* Columna Izquierda: Formulario (40%) */}
      <div className="w-full md:w-[40%] border-r border-gray-100 p-6 flex flex-col justify-between overflow-y-auto">
        <form onSubmit={handleGenerate} className="space-y-5 flex-1 flex flex-col">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              ¿Qué imagen querés crear?
            </label>
            <p className="text-xs text-gray-500">
              Describí con detalle la imagen que necesitás para tu publicación. Copi la creará para vos.
            </p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej. Un mate sobre una mesa de madera con luz cálida de atardecer, estilo fotografía profesional, redes sociales..."
              disabled={isLoading}
              rows={6}
              className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className={cn(
              'w-full flex items-center justify-center gap-2 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-sm',
              isLoading || !prompt.trim()
                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                : 'bg-primary hover:bg-primary/90 hover:shadow active:scale-[0.98]'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                Generar imagen
              </>
            )}
          </button>
        </form>
      </div>

      {/* Columna Derecha: Resultado (60%) */}
      <div className="w-full md:w-[60%] p-6 flex flex-col items-center justify-center bg-gray-50/50 overflow-y-auto min-h-[300px]">
        {/* Placeholder inicial */}
        {!isLoading && !imageUrl && !error && (
          <div className="flex flex-col items-center justify-center text-center max-w-md p-8 bg-[#f5f0e8] rounded-xl border border-gray-200/50 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-inner mb-4">
              <ImageIcon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Generador de imágenes</h3>
            <p className="text-sm text-gray-600">
              Escribí un prompt en el panel izquierdo y hacé clic en "Generar". Tu imagen aparecerá aquí.
            </p>
          </div>
        )}

        {/* Cargando */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center text-center w-full max-w-md h-[400px] bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-sm font-semibold text-gray-600">Creando tu imagen...</p>
            <p className="text-xs text-gray-400 mt-1 px-4">Esto puede demorar unos segundos con flux-1-schnell</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex flex-col items-center justify-center text-center max-w-md p-8 bg-red-50 border border-red-100 rounded-xl shadow-sm">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-inner mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-red-800 mb-2">Error al generar imagen</h3>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Volver a intentar
            </button>
          </div>
        )}

        {/* Resultado exitoso */}
        {imageUrl && !isLoading && (
          <div className="flex flex-col items-center space-y-4 w-full max-w-md">
            <div className="relative aspect-square w-full rounded-xl overflow-hidden shadow-md border border-gray-150 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Imagen generada por Copi"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 bg-primary-light hover:bg-[#b5e4ee] text-primary font-semibold text-sm py-2.5 px-6 rounded-lg transition-colors border border-primary/20 shadow-sm"
            >
              <Download className="w-4 h-4" />
              Descargar imagen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
