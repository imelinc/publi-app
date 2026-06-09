'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Send, Copy, Check } from 'lucide-react'

interface ApprovalLinkDialogProps {
  /** URL de aprobación a mostrar. `null` mantiene el diálogo cerrado. */
  url: string | null
  onClose: () => void
}

/**
 * Diálogo que muestra el link de aprobación generado para el cliente.
 *
 * Se renderiza a NIVEL DE PÁGINA (no dentro de PostForm) a propósito: al pedir
 * aprobación el post pasa a `pending_approval` y la página de edición remonta el
 * PostForm (key por status). Si el diálogo viviera adentro, se destruiría al
 * instante. Acá sobrevive hasta que el usuario lo cierra.
 */
export function ApprovalLinkDialog({ url, onClose }: ApprovalLinkDialogProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={!!url} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="size-4 text-[#0095b6]" />
            Link de aprobación listo
          </DialogTitle>
          <DialogDescription>
            Copiá este link y enviáselo a tu cliente por WhatsApp, email o como prefieras.
            No necesita crear una cuenta para responder.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 truncate">
            {url}
          </div>
          <button
            onClick={handleCopy}
            className="shrink-0 flex items-center gap-1.5 bg-[#0095b6] text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-[#007a94] transition-colors"
          >
            {copied ? (
              <>
                <Check className="size-4" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="size-4" />
                Copiar
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          El post quedó en estado <strong>pendiente de aprobación</strong>.
          Una vez que tu cliente responda, verás el resultado acá mismo o en el calendario.
        </p>
      </DialogContent>
    </Dialog>
  )
}
