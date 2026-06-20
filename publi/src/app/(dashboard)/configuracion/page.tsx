"use client"

import {
  AlertTriangle,
  User,
  Crown,
  Sparkles,
  CheckCircle2,
  Building2,
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