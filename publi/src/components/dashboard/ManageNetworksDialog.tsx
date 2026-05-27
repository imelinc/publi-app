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
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Gestionar redes conectadas</DialogTitle>
          <DialogDescription>
            {clientName
              ? `Conectá las redes sociales de ${clientName} ingresando el usuario de cada una.`
              : 'Conectá las redes sociales ingresando el usuario de cada una.'}
          </DialogDescription>
        </DialogHeader>

        {clientId && <NetworksManager clientId={clientId} />}

        <DialogFooter>
          <Button
            onClick={onClose}
            className="bg-[#0095b6] hover:bg-[#007a96] text-white"
          >
            Listo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
