'use client'

import { useState } from 'react'
import { Sparkles, Crown, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/use-app-store'
import { useToast } from '@/components/ui/use-toast'
import type { Client } from '@/types'

interface PlanUpgradeGuardProps {
  featureName: string
  activeClient: Client | null
}

export function PlanUpgradeGuard({ featureName, activeClient }: PlanUpgradeGuardProps) {
  const [upgrading, setUpgrading] = useState(false)
  const updateClient = useAppStore((s) => s.updateClient)
  const { toast } = useToast()
  const router = useRouter()

  async function handleUpgrade() {
    if (!activeClient) return
    setUpgrading(true)
    try {
      await updateClient(activeClient.id, { plan: 'pro' })
      toast({
        title: '¡Plan actualizado a Pro!',
        description: `El workspace de ${activeClient.name} ahora tiene acceso a todas las herramientas Pro.`,
      })
      router.push(`/dashboard?upgrade_success=${encodeURIComponent(activeClient.name)}`)
    } catch (err) {
      toast({
        title: 'Error al actualizar',
        description: 'No se pudo actualizar el plan. Intentá de nuevo.',
      })
    } finally {
      setUpgrading(false)
    }
  }

  if (!activeClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-2xl border border-gray-100 shadow-xs">
        <p className="text-gray-500 text-sm">Seleccioná o creá un cliente para continuar.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto my-12">
      <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 sm:p-12 shadow-md">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[#cceef5]/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-[#ffb703]/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col items-center text-center space-y-6">
          {/* Elegant Icon Badge */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-[#cceef5]/40 flex items-center justify-center animate-pulse">
              <Crown className="w-10 h-10 text-[#0095b6]" />
            </div>
            <div className="absolute -top-2 -right-2 bg-[#ffb703] text-white p-1 rounded-lg shadow-sm">
              <Sparkles className="w-4 h-4 animate-spin [animation-duration:8s]" />
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {featureName} es una función <span className="text-[#0095b6]">Pro</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto leading-relaxed">
              El cliente <strong className="text-gray-900 font-semibold">{activeClient.name}</strong> está en el plan <strong className="text-[#0095b6]">Free</strong>. Para desbloquear el editor de imágenes y el asistente con IA de Copi, actualizá el plan de este cliente.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="w-full max-w-md bg-[#f5f0e8]/40 border border-[#cceef5]/50 rounded-2xl p-5 text-left space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              ¿Qué incluye el plan Pro?
            </h4>
            <ul className="grid grid-cols-1 gap-2.5">
              <li className="flex items-center gap-2.5 text-xs text-gray-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#0095b6] shrink-0" />
                Asistente de IA (Copi chat, sugerencia de copys y hashtags)
              </li>
              <li className="flex items-center gap-2.5 text-xs text-gray-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#0095b6] shrink-0" />
                Editor de imágenes avanzado (Fabric.js)
              </li>
              <li className="flex items-center gap-2.5 text-xs text-gray-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#0095b6] shrink-0" />
                Generador de imágenes artificiales por prompt
              </li>
              <li className="flex items-center gap-2.5 text-xs text-gray-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#0095b6] shrink-0" />
                Sugerencias inteligentes de horarios óptimos
              </li>
            </ul>
          </div>

          {/* Interactive CTA */}
          <div className="w-full max-w-md pt-2">
            <Button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="w-full py-6 rounded-xl bg-[#0095b6] hover:bg-[#007a96] text-white font-semibold text-sm transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {upgrading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  Actualizando cliente a Pro...
                </>
              ) : (
                <>
                  Actualizar {activeClient.name} a Pro por $9.99/mes
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
            <p className="text-[10px] text-gray-400 mt-2.5">
              Los cambios se aplicarán inmediatamente y se facturarán a tu cuenta.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
