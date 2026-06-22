"use client"

import {
  AlertTriangle,
  User,
  Crown,
  Sparkles,
  CheckCircle2,
  Building2,
  CreditCard,
  Info,
  ShieldCheck,
  Mail,
  Lock,
} from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { createClient } from "@/lib/supabase/client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/use-app-store"

export default function ConfiguracionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const userProfile = useAppStore((s) => s.userProfile)

  const [workspaceName, setWorkspaceName] = React.useState<string>(
    userProfile?.workspaceName ?? "Mi workspace"
  )
  const [accountName, setAccountName] = React.useState<string>(
    userProfile?.name ?? ""
  )
  const [savingWorkspace, setSavingWorkspace] = React.useState(false)
  const [savingAccount, setSavingAccount] = React.useState(false)

  // Upgrade/Downgrade Subscription States
  const fetchUserProfile = useAppStore((s) => s.fetchUserProfile)
  const [upgradeModalOpen, setUpgradeModalOpen] = React.useState(false)
  const [cardNumber, setCardNumber] = React.useState("")
  const [cardHolder, setCardHolder] = React.useState("")
  const [cardExpiry, setCardExpiry] = React.useState("")
  const [cardCvv, setCardCvv] = React.useState("")
  const [cvvFocused, setCvvFocused] = React.useState(false)
  const [paying, setPaying] = React.useState(false)
  const [payPhase, setPayPhase] = React.useState("")
  const [cancelOpen, setCancelOpen] = React.useState(false)
  const [paymentError, setPaymentError] = React.useState<string | null>(null)

  const onCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const formatted = value.match(/.{1,4}/g)?.join(" ") || ""
    setCardNumber(formatted.slice(0, 19))
  }

  const onExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}`
    }
    setCardExpiry(value.slice(0, 5))
  }

  const onCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    setCardCvv(value.slice(0, 4))
  }

  async function handleUpgradePlan(e: React.FormEvent) {
    e.preventDefault()
    setPaymentError(null)

    if (!cardNumber || cardNumber.length < 19) {
      setPaymentError("El número de tarjeta no es válido.")
      return
    }
    if (!cardHolder.trim()) {
      setPaymentError("El nombre del titular es requerido.")
      return
    }
    if (!cardExpiry || cardExpiry.length < 5) {
      setPaymentError("La fecha de expiración no es válida.")
      return
    }
    if (!cardCvv || cardCvv.length < 3) {
      setPaymentError("El código CVV no es válido.")
      return
    }

    setPaying(true)
    try {
      setPayPhase("Conectando pasarela...")
      await new Promise((resolve) => setTimeout(resolve, 800))
      setPayPhase("Verificando tarjeta...")
      await new Promise((resolve) => setTimeout(resolve, 800))
      setPayPhase("Confirmando plan...")
      await new Promise((resolve) => setTimeout(resolve, 600))
      
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro' }),
      })

      if (!res.ok) {
        toast({ title: 'Error en la suscripción', description: 'No se pudo registrar la tarjeta.' })
        return
      }

      await fetchUserProfile()
      toast({ title: '¡Suscripción Pro Activa!', description: 'Ahora contás con acceso completo a Copi IA e ilimitados clientes.' })
      setUpgradeModalOpen(false)
      // reset form
      setCardNumber("")
      setCardHolder("")
      setCardExpiry("")
      setCardCvv("")
    } catch {
      toast({ title: 'Error en el servidor', description: 'No se pudo conectar con el servidor.' })
    } finally {
      setPaying(false)
    }
  }

  async function handleCancelSubscription() {
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'free' }),
      })

      if (!res.ok) {
        toast({ title: 'Error al cancelar', description: 'No se pudo realizar el cambio.' })
        return
      }

      await fetchUserProfile()
      toast({ title: 'Plan Pro Cancelado', description: 'Tu cuenta ha sido rebajada a Plan Free.' })
      setCancelOpen(false)
    } catch {
      toast({ title: 'Error al conectar', description: 'Intente nuevamente más tarde.' })
    }
  }

  React.useEffect(() => {
    if (userProfile) {
      setWorkspaceName(userProfile.workspaceName ?? "Mi workspace")
      setAccountName(userProfile.name ?? "")
    }
  }, [userProfile])

  async function handleSaveWorkspace() {
    setSavingWorkspace(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceName }),
      })
      if (!res.ok) {
        toast({ title: 'Error al guardar', description: 'Intentá de nuevo.' })
        return
      }
      toast({ title: 'Workspace actualizado' })
    } catch {
      toast({ title: 'Error al guardar', description: 'No se pudo conectar con el servidor.' })
    } finally {
      setSavingWorkspace(false)
    }
  }

  async function handleSaveAccount() {
    setSavingAccount(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: accountName }),
      })
      if (!res.ok) {
        toast({ title: 'Error al guardar', description: 'Intentá de nuevo.' })
        return
      }
      toast({ title: 'Nombre actualizado' })
    } catch {
      toast({ title: 'Error al guardar', description: 'No se pudo conectar con el servidor.' })
    } finally {
      setSavingAccount(false)
    }
  }

  const handleDangerDelete = React.useCallback(async () => {
    try {
      const res = await fetch('/api/users/me', { method: 'DELETE' })
      if (!res.ok && res.status !== 204) {
        toast({ title: 'Error al eliminar cuenta', description: 'Intentá de nuevo.' })
        return
      }
      const supabase = createClient()
      await supabase.auth.signOut()
      toast({ title: 'Cuenta eliminada' })
      router.push('/login')
    } catch {
      toast({ title: 'Error al eliminar cuenta', description: 'No se pudo conectar con el servidor.' })
    }
  }, [router, toast])

  return (

    <div className="w-full max-w-[720px] mx-auto space-y-8 animate-in fade-in duration-300">
      <section className="space-y-1.5">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight gradient-text">Configuración</h1>
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
          Personalizá tu cuenta, gestioná tu espacio de trabajo y visualizá tu suscripción
        </p>
      </section>

      {/* Tarjeta de Plan (Premium UI) */}
      <Card className="premium-card overflow-hidden border border-slate-100/50 shadow-xs rounded-2xl bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100/50 py-5 px-6">
          <CardTitle className="flex items-center gap-2.5 text-base font-bold text-gray-900">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-[#00b4d8]/10 text-primary shadow-xs">
              <Crown className="h-5 w-5" strokeWidth={2} />
            </div>
            Plan y Suscripción
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6 px-6 pb-6">
          {userProfile?.plan === 'pro' ? (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#00b4d8] p-6 text-white shadow-[0_12px_24px_rgba(0,149,182,0.2)] border border-[#0095b6]/10 hover:scale-[1.01] transition-all duration-350">
              {/* Background decorative glows */}
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-black/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-white/20 text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                      Suscripción Activa
                    </span>
                    <Sparkles className="w-4 h-4 text-[#ffb703] animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight">Plan Pro</h3>
                  <p className="text-sm text-white/95 leading-relaxed max-w-sm font-medium">
                    Disfrutás de acceso ilimitado a todas las herramientas avanzadas de IA, editor y workspaces de clientes.
                  </p>
                </div>
                
                <div className="shrink-0 flex items-center justify-center bg-white/10 border border-white/20 rounded-xl p-4 backdrop-blur-xs shadow-2xs">
                  <div className="text-center">
                    <div className="text-3xl font-black">$9.99</div>
                    <div className="text-[10px] font-bold opacity-80 uppercase tracking-wider mt-0.5">Por mes</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-slate-150 bg-slate-50/50 p-6 text-slate-850 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="bg-slate-200/80 text-slate-600 text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full">
                    Suscripción Activa
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Plan Free</h3>
                  <p className="text-sm text-slate-500 max-w-sm leading-relaxed font-semibold">
                    Límite de 3 clientes. Sin acceso al asistente Copi IA ni al editor de imágenes.
                  </p>
                </div>
                <div className="shrink-0 bg-white border border-slate-150 rounded-xl p-4 shadow-3xs text-center">
                  <div className="text-2xl font-black text-slate-950">Gratis</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">De por vida</div>
                </div>
              </div>
            </div>
          )}

          {/* Grid of features details */}
          <div className="bg-slate-50/40 rounded-2xl p-5 border border-slate-150/60 shadow-3xs">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3.5">
              Beneficios asociados a tu cuenta
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-sm text-slate-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Workspaces de Clientes: <strong className="text-slate-900">{userProfile?.plan === 'pro' ? 'Ilimitados' : 'Hasta 3'}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700 font-semibold">
                {userProfile?.plan === 'pro' ? (
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  </div>
                )}
                <span className={userProfile?.plan === 'pro' ? 'text-slate-805' : 'text-slate-400 line-through decoration-slate-350'}>Asistente Copi IA</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700 font-semibold">
                {userProfile?.plan === 'pro' ? (
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  </div>
                )}
                <span className={userProfile?.plan === 'pro' ? 'text-slate-805' : 'text-slate-400 line-through decoration-slate-350'}>Editor de imágenes avanzado</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700 font-semibold">
                {userProfile?.plan === 'pro' ? (
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  </div>
                )}
                <span className={userProfile?.plan === 'pro' ? 'text-slate-805' : 'text-slate-400 line-through decoration-slate-350'}>Sugerencias de horario óptimo</span>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-100/80 my-4" />
          
          <div className="flex justify-end">
            {userProfile?.plan === 'pro' ? (
              /* PRO Action: Downgrade / Cancel */
              <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto h-11 rounded-xl border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all font-bold px-6 cursor-pointer shadow-2xs"
                  >
                    Cancelar Suscripción Pro
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl border border-slate-100 shadow-2xl p-6">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-extrabold text-slate-900 text-lg">¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm text-slate-500 leading-relaxed font-semibold">
                      Tu plan volverá a ser Free. Perderás de inmediato el acceso al asistente Copi IA, herramientas de imágenes y tu límite de clientes será de un máximo de 3.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-4 gap-2">
                    <AlertDialogCancel className="rounded-xl font-bold border-slate-200 hover:bg-slate-50 cursor-pointer">Seguir en Pro</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelSubscription}
                      className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold cursor-pointer"
                    >
                      Confirmar Cancelación
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              /* FREE Action: Upgrade to Pro */
              <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="w-full sm:w-auto h-11 rounded-xl bg-gradient-to-br from-primary to-[#00b4d8] text-white font-bold px-6 shadow-[0_4px_12px_rgba(0,149,182,0.2)] hover:shadow-[0_6px_20px_rgba(0,149,182,0.3)] hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Mejorar a Plan Pro
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-lg overflow-y-auto max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle className="font-extrabold text-slate-900 text-xl flex items-center gap-2">
                      <Crown className="h-5 w-5 text-[#ffb703] animate-bounce" />
                      Suscripción a publi Pro
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Completá los datos de tu tarjeta simulada para habilitar clientes ilimitados e inteligencia artificial.
                    </DialogDescription>
                  </DialogHeader>

                  {paymentError && (
                    <p className="text-xs font-bold text-rose-500 bg-rose-50 border border-rose-100 rounded-xl p-2.5 flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      {paymentError}
                    </p>
                  )}

                  {/* Digital Card Preview */}
                  <div className="perspective-1000 py-2">
                    <div
                      className={`w-full max-w-[320px] h-[180px] mx-auto rounded-2xl p-5 text-white bg-gradient-to-br from-[#0d2a33] to-[#003b49] border border-white/10 shadow-xl relative transition-transform duration-700 preserve-3d ${
                        cvvFocused ? "rotate-y-180" : ""
                      }`}
                    >
                      {/* Front */}
                      <div className="absolute inset-0 p-5 flex flex-col justify-between backface-hidden">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black tracking-tight flex items-center gap-1"><Crown className="h-4 w-4 text-[#ffb703]" /> publi</span>
                          <CreditCard className="h-5 w-5 opacity-70" />
                        </div>
                        <div className="my-2">
                          <div className="w-8 h-6 rounded bg-[#ffd700]/30 border border-[#ffd700]/40 mb-2" />
                          <p className="text-md font-mono tracking-widest text-center">
                            {cardNumber || "•••• •••• •••• ••••"}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="text-[6px] text-white/50 uppercase font-bold">Titular</p>
                            <p className="text-[10px] font-semibold truncate uppercase">{cardHolder || "Juan Pérez"}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[6px] text-white/50 uppercase font-bold">Expiración</p>
                            <p className="text-[10px] font-semibold">{cardExpiry || "MM/AA"}</p>
                          </div>
                        </div>
                      </div>
                      {/* Back */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#07161b] to-[#0b2229] border border-white/10 flex flex-col justify-between py-5 backface-hidden rotate-y-180">
                        <div className="w-full h-8 bg-black/60 mt-1" />
                        <div className="px-5 flex items-center justify-between gap-3">
                          <div className="flex-1 bg-white/10 h-7 rounded px-2.5 flex items-center justify-end text-[10px] font-mono italic">
                            {cardCvv || "•••"}
                          </div>
                          <div className="w-8 h-2 bg-primary/30 rounded" />
                        </div>
                        <p className="text-[6px] text-white/30 text-center px-4">Simulación. No ingresar datos reales.</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleUpgradePlan} className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <Label htmlFor="modal-card-number" className="text-xs font-bold text-slate-400 uppercase tracking-wide">Número de tarjeta</Label>
                      <Input
                        id="modal-card-number"
                        placeholder="4000 1234 5678 9010"
                        required
                        value={cardNumber}
                        onChange={onCardNumberChange}
                        className="h-10 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="modal-card-holder" className="text-xs font-bold text-slate-400 uppercase tracking-wide">Nombre del titular</Label>
                      <Input
                        id="modal-card-holder"
                        placeholder="COMO APARECE EN LA TARJETA"
                        required
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="h-10 rounded-xl border border-slate-200 bg-white uppercase"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="modal-card-expiry" className="text-xs font-bold text-slate-400 uppercase tracking-wide">Expiración</Label>
                        <Input
                          id="modal-card-expiry"
                          placeholder="MM/AA"
                          required
                          value={cardExpiry}
                          onChange={onExpiryChange}
                          className="h-10 rounded-xl border border-slate-200 bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="modal-card-cvv" className="text-xs font-bold text-slate-400 uppercase tracking-wide">CVV</Label>
                        <Input
                          id="modal-card-cvv"
                          type="password"
                          placeholder="123"
                          required
                          value={cardCvv}
                          onChange={onCvvChange}
                          onFocus={() => setCvvFocused(true)}
                          onBlur={() => setCvvFocused(false)}
                          className="h-10 rounded-xl border border-slate-200 bg-white"
                        />
                      </div>
                    </div>

                    <div className="bg-[#ffb703]/10 border border-[#ffb703]/20 rounded-xl p-3 flex items-start gap-2">
                      <Info className="h-4.5 w-4.5 text-[#ffb703] shrink-0 mt-0.5" />
                      <p className="text-[9px] text-amber-800 leading-normal font-semibold">
                        <strong>Simulación:</strong> pubil-app no procesará ningún cobro bancario real. Es seguro completar el formulario con números de prueba.
                      </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setUpgradeModalOpen(false)}
                        className="rounded-xl font-bold"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={paying}
                        className="rounded-xl bg-primary hover:bg-primary/95 text-white font-bold px-6 cursor-pointer"
                      >
                        {paying ? (
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>{payPhase}</span>
                          </div>
                        ) : (
                          <span>Pagar $9.99/mes</span>
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {/* Estilos CSS Inline de perspectiva y rotaciones 3D */}
          <style jsx global>{`
            .perspective-1000 {
              perspective: 1000px;
            }
            .preserve-3d {
              transform-style: preserve-3d;
            }
            .backface-hidden {
              backface-visibility: hidden;
            }
            .rotate-y-180 {
              transform: rotateY(180deg);
            }
          `}</style>
        </CardContent>
      </Card>

      {/* Tarjeta de Cuenta */}
      <Card className="premium-card overflow-hidden border border-slate-100/50 shadow-xs rounded-2xl bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100/50 py-5 px-6">
          <CardTitle className="flex items-center gap-2.5 text-base font-bold text-gray-900">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-[#00b4d8]/10 text-primary shadow-xs">
              <User className="h-5 w-5" strokeWidth={2} />
            </div>
            Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-5 px-6 pb-6">
          <div className="space-y-2">
            <Label htmlFor="account-name" className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nombre</Label>
            <Input
              id="account-name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="h-11 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 transition-all font-semibold text-slate-850 shadow-2xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="current-email" className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email</Label>
            <div className="relative">
              <Input
                id="current-email"
                disabled
                value={userProfile?.email ?? ''}
                className="h-11 rounded-xl border-slate-150 bg-slate-50/60 text-slate-400 font-semibold cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleSaveAccount}
              disabled={savingAccount}
              className="h-11 rounded-xl bg-gradient-to-br from-primary to-[#00b4d8] text-white font-bold px-6 shadow-[0_4px_12px_rgba(0,149,182,0.2)] hover:shadow-[0_6px_20px_rgba(0,149,182,0.3)] hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer"
            >
              {savingAccount ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tarjeta de Workspace */}
      <Card className="premium-card overflow-hidden border border-slate-100/50 shadow-xs rounded-2xl bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100/50 py-5 px-6">
          <CardTitle className="flex items-center gap-2.5 text-base font-bold text-gray-900">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-[#00b4d8]/10 text-primary shadow-xs">
              <Building2 className="h-5 w-5" strokeWidth={2} />
            </div>
            Workspace
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-5 px-6 pb-6">
          <div className="space-y-2">
            <Label htmlFor="workspace" className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nombre del workspace</Label>
            <Input
              id="workspace"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="h-11 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 transition-all font-semibold text-slate-850 shadow-2xs"
            />
            <p className="text-[10px] text-slate-400 font-semibold mt-1">
              Este nombre aparece en tus reportes y notificaciones
            </p>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleSaveWorkspace}
              disabled={savingWorkspace}
              className="h-11 rounded-xl bg-gradient-to-br from-primary to-[#00b4d8] text-white font-bold px-6 shadow-[0_4px_12px_rgba(0,149,182,0.2)] hover:shadow-[0_6px_20px_rgba(0,149,182,0.3)] hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer"
            >
              {savingWorkspace ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Zona de peligro */}
      <Card className="premium-card overflow-hidden border border-rose-100/60 shadow-xs rounded-2xl bg-white">
        <CardHeader className="bg-rose-50/30 border-b border-rose-100/50 py-5 px-6">
          <CardTitle className="flex items-center gap-2.5 text-base font-bold text-rose-600">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-500 shadow-2xs">
              <AlertTriangle className="h-5 w-5" strokeWidth={2} />
            </div>
            Zona de peligro
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6 px-6 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 border border-slate-150 p-4 rounded-2xl shadow-3xs">
            <div>
              <p className="text-sm font-bold text-slate-800">Cerrar sesión</p>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Cerrá tu sesión en este dispositivo
              </p>
            </div>
            <Button
              variant="outline"
              className="h-10 rounded-xl border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:scale-[1.01] active:scale-[0.99] font-bold px-5 transition-all shadow-2xs cursor-pointer"
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                router.push("/login")
              }}
            >
              Cerrar sesión
            </Button>
          </div>

          <Separator className="bg-slate-100/80" />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-rose-50/5 border border-rose-100/20 p-4 rounded-2xl shadow-3xs">
            <div>
              <p className="text-sm font-bold text-slate-850">Eliminar cuenta</p>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Esta acción es permanente y no se puede deshacer
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="h-10 rounded-xl bg-rose-500 hover:bg-rose-650 text-white font-bold px-5 shadow-[0_4px_12px_rgba(239,68,68,0.2)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer border border-transparent"
                >
                  Eliminar cuenta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl border border-slate-100 shadow-2xl p-6">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-extrabold text-slate-900 text-lg">¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm text-slate-500 leading-relaxed font-semibold">
                    Esta acción eliminará permanentemente tu cuenta y todos tus datos asociados. No se puede
                    deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4 gap-2">
                  <AlertDialogCancel className="rounded-xl font-bold border-slate-200 hover:bg-slate-50 cursor-pointer">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDangerDelete} className="bg-rose-500 hover:bg-rose-650 text-white rounded-xl font-bold cursor-pointer">
                    Sí, eliminar cuenta
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}