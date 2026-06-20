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
    <div className="flex-grow flex flex-col md:flex-row h-full min-h-0 bg-white">
      {/* Columna Izquierda: Formulario (40%) */}
      <div className="w-full md:w-[40%] border-r border-gray-100 p-6 flex flex-col justify-between overflow-y-auto">
        <form onSubmit={handleGenerate} className="space-y-5 flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              ¿Qué imagen querés crear?
            </label>
            <p className="text-[11px] font-medium text-gray-400">
              Describí con detalle la imagen que necesitás para tu publicación. Copi la creará para vos en segundos.
            </p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej. Un mate sobre una mesa de madera con luz cálida de atardecer, estilo fotografía profesional, redes sociales..."
              disabled={isLoading}
              rows={8}
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className={cn(
              'w-full h-11 flex items-center justify-center gap-2 text-white font-bold rounded-xl transition-all duration-200 text-xs uppercase tracking-wider',
              isLoading || !prompt.trim()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-primary to-[#00b4d8] hover:opacity-95 shadow-[0_4px_12px_rgba(0,149,182,0.25)] hover:scale-[1.01] active:scale-[0.99]'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
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
      <div className="w-full md:w-[60%] p-6 flex flex-col items-center justify-center bg-slate-50/30 overflow-y-auto min-h-[300px]">
        {/* Placeholder inicial */}
        {!isLoading && !imageUrl && !error && (
          <div className="flex flex-col items-center justify-center text-center max-w-sm p-8 bg-slate-50 border border-gray-150/40 rounded-2xl shadow-xs">
            <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-xs border border-gray-100 mb-4">
              <ImageIcon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-gray-850 mb-1.5">Generador de imágenes</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Escribí un prompt en el panel izquierdo y hacé clic en "Generar". Tu imagen aparecerá aquí lista para descargar.
            </p>
          </div>
        )}

        {/* Cargando */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center text-center w-full max-w-sm h-[360px] bg-white rounded-2xl border border-gray-100 shadow-xs animate-pulse">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-xs font-bold text-gray-650 uppercase tracking-wider">Creando tu imagen...</p>
            <p className="text-[10px] text-gray-400 mt-1 px-4">Esto puede demorar unos segundos con flux-1-schnell</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex flex-col items-center justify-center text-center max-w-sm p-8 bg-red-50/50 border border-red-200/40 rounded-2xl shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-xs mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2">Error al generar imagen</h3>
            <p className="text-xs text-red-600 mb-4">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs font-bold text-primary hover:underline"
            >
              Volver a intentar
            </button>
          </div>
        )}

        {/* Resultado exitoso */}
        {imageUrl && !isLoading && (
          <div className="flex flex-col items-center space-y-4 w-full max-w-sm">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-md border border-gray-150/70 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Imagen generada por Copi"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 bg-primary-light/80 hover:bg-[#b5e4ee] text-primary font-bold text-xs py-2.5 px-6 rounded-xl transition-all duration-200 border border-primary/20 shadow-xs hover:scale-[1.02] active:scale-[0.98]"
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
