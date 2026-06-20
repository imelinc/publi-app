'use client'

import { useState } from 'react'
import { Sparkles, Crown, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/use-app-store'
import { useToast } from '@/components/ui/use-toast'
import type { Client } from '@/types'

interface PlanUpgradeDialogProps {
  open: boolean
  onClose: () => void
  featureName?: string
}

export function PlanUpgradeDialog({
  open,
  onClose,
  featureName = 'las herramientas de Inteligencia Artificial',
}: PlanUpgradeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl bg-white border border-gray-100 shadow-xl overflow-hidden">
        {/* Decorative top gradient */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#0095b6] to-[#ffb703]" />

        <div className="flex flex-col items-center text-center space-y-4 pt-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-[#cceef5] flex items-center justify-center">
              <Crown className="w-7 h-7 text-[#0095b6]" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-[#ffb703] animate-pulse" />
          </div>

          <div className="space-y-1">
            <DialogTitle className="text-xl font-bold text-gray-900">
              Función Pro de publi
            </DialogTitle>
            <p className="text-sm text-gray-500">
              Para usar {featureName}, necesitás activar el plan Pro en tu cuenta.
            </p>
          </div>

          <div className="w-full bg-[#f5f0e8]/50 border border-dashed border-[#cceef5] rounded-xl p-3 text-xs text-gray-600 text-left space-y-1.5">
            <p className="font-semibold text-gray-700">El plan Pro de publi incluye:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Generación y reescritura de copies por IA</li>
              <li>Sugerencia inteligente de hashtags y horario óptimo</li>
              <li>Editor y generador de imágenes integrado</li>
              <li>Workspaces ilimitados (más de 3 clientes)</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="mt-6 flex justify-center">
          <Button
            onClick={onClose}
            className="w-full text-xs bg-[#0095b6] hover:bg-[#007a96] text-white font-medium flex items-center justify-center"
          >
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
