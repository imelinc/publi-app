'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { NetworksManager } from './NetworksManager'
import { Share2 } from 'lucide-react'

interface ManageNetworksDialogProps {
  open: boolean
  onClose: () => void
  clientId: string | null
  clientName?: string
}

/**
 * Dialog standalone para gestionar las redes sociales conectadas de un cliente.
 * Se abre desde el dropdown de ClientCard.
 */
export function ManageNetworksDialog({
  open,
  onClose,
  clientId,
  clientName,
}: ManageNetworksDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-3xl border border-slate-100 shadow-2xl bg-white">
        {/* Gradient Header */}
        <div className="px-6 pt-6 pb-5 relative overflow-hidden bg-gradient-to-br from-[#0095b6]/10 to-[#00b4d8]/5">
          <div
            className="absolute -right-8 -top-8 w-28 h-28 rounded-full opacity-[0.08] blur-xl bg-[#0095b6]"
          />
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-[#0095b6]/10 text-[#0095b6] shrink-0 shadow-3xs">
              <Share2 className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-base font-extrabold text-gray-900">
                Gestionar redes conectadas
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 font-medium">
                {clientName
                  ? `Conectá los canales de ${clientName} ingresando las credenciales.`
                  : 'Conectá los canales de redes ingresando las credenciales.'}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {clientId && <NetworksManager clientId={clientId} />}
        </div>

        <DialogFooter className="px-6 pb-6 pt-2">
          <Button
            onClick={onClose}
            className="w-full bg-[#0095b6] hover:bg-[#007a94] text-white rounded-xl font-bold h-10 text-xs shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer border border-transparent"
          >
            Listo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
