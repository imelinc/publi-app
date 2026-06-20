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
    <div className="min-h-screen bg-[#f8f6f2] p-6 md:p-10">
      <div className="mx-auto w-full max-w-[720px] space-y-8 animate-in fade-in duration-300">
        <section className="space-y-1.5">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Configuración</h1>
          <p className="text-sm text-gray-500 font-medium">
            Personalizá tu cuenta, gestioná tu espacio de trabajo y visualizá los detalles de tu suscripción en publi
          </p>
        </section>

        {/* Tarjeta de Plan (Premium UI) */}
        <Card className="overflow-hidden border border-gray-100/70 shadow-lg rounded-2xl bg-white">
          <CardHeader className="bg-[#fcfbfa] border-b border-gray-100/50 py-5">
            <CardTitle className="flex items-center gap-2.5 text-base font-bold text-gray-900">
              <div className="p-2 rounded-xl bg-[#cceef5] text-[#0095b6] shadow-3xs">
                <Crown className="h-5 w-5" />
              </div>
              Plan y Suscripción
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {userProfile?.plan === 'pro' ? (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0095b6] to-[#007a96] p-6 text-white shadow-md border border-[#0095b6]/10">
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
                    <p className="text-sm text-white/95 leading-relaxed max-w-sm">
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
              <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/50 p-6 text-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <span className="bg-gray-200/80 text-gray-600 text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full">
                      Suscripción Activa
                    </span>
                    <h3 className="text-xl font-bold text-gray-900">Plan Free</h3>
                    <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
                      Límite de 3 clientes. Sin acceso al asistente Copi IA ni al editor de imágenes.
                    </p>
                  </div>
                  <div className="shrink-0 bg-white border border-gray-100 rounded-xl p-4 shadow-3xs text-center">
                    <div className="text-2xl font-black text-gray-950">Gratis</div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">De por vida</div>
                  </div>
                </div>
              </div>
            )}

            {/* Grid of features details */}
            <div className="bg-[#fcfbfa] rounded-2xl p-5 border border-gray-100">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3.5">
                Beneficios asociados a tu cuenta
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#0095b6] shrink-0" />
                  <span>Workspaces de Clientes: <strong className="text-gray-900">{userProfile?.plan === 'pro' ? 'Ilimitados' : 'Hasta 3'}</strong></span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  {userProfile?.plan === 'pro' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#0095b6] shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    </div>
                  )}
                  <span className={userProfile?.plan === 'pro' ? 'text-gray-800' : 'text-gray-400 line-through decoration-gray-300'}>Asistente Copi IA</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  {userProfile?.plan === 'pro' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#0095b6] shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    </div>
                  )}
                  <span className={userProfile?.plan === 'pro' ? 'text-gray-800' : 'text-gray-400 line-through decoration-gray-300'}>Editor de imágenes avanzado</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  {userProfile?.plan === 'pro' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#0095b6] shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    </div>
                  )}
                  <span className={userProfile?.plan === 'pro' ? 'text-gray-800' : 'text-gray-400 line-through decoration-gray-300'}>Sugerencias de horario óptimo</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta de Cuenta */}
        <Card className="overflow-hidden border border-gray-100/70 shadow-lg rounded-2xl bg-white">
          <CardHeader className="bg-[#fcfbfa] border-b border-gray-100/50 py-5">
            <CardTitle className="flex items-center gap-2.5 text-base font-bold text-gray-900">
              <div className="p-2 rounded-xl bg-[#cceef5] text-[#0095b6] shadow-3xs">
                <User className="h-5 w-5" />
              </div>
              Cuenta
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="account-name" className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nombre</Label>
              <Input
                id="account-name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="h-11 rounded-xl border-gray-200 focus:border-[#0095b6] focus:ring-[#0095b6]/20 transition-all font-medium text-gray-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current-email" className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email</Label>
              <div className="relative">
                <Input
                  id="current-email"
                  disabled
                  value={userProfile?.email ?? ''}
                  className="h-11 rounded-xl border-gray-100 bg-gray-50/50 text-gray-500 font-medium"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleSaveAccount}
                disabled={savingAccount}
                className="h-11 rounded-xl bg-[#0095b6] hover:bg-[#007a96] text-white font-semibold px-6 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
              >
                {savingAccount ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta de Workspace */}
        <Card className="overflow-hidden border border-gray-100/70 shadow-lg rounded-2xl bg-white">
          <CardHeader className="bg-[#fcfbfa] border-b border-gray-100/50 py-5">
            <CardTitle className="flex items-center gap-2.5 text-base font-bold text-gray-900">
              <div className="p-2 rounded-xl bg-[#cceef5] text-[#0095b6] shadow-3xs">
                <Building2 className="h-5 w-5" />
              </div>
              Workspace
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="workspace" className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nombre del workspace</Label>
              <Input
                id="workspace"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="h-11 rounded-xl border-gray-200 focus:border-[#0095b6] focus:ring-[#0095b6]/20 transition-all font-medium text-gray-800"
              />
              <p className="text-[11px] text-gray-400 font-medium mt-1">
                Este nombre aparece en tus reportes y notificaciones
              </p>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleSaveWorkspace}
                disabled={savingWorkspace}
                className="h-11 rounded-xl bg-[#0095b6] hover:bg-[#007a96] text-white font-semibold px-6 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
              >
                {savingWorkspace ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Zona de peligro */}
        <Card className="overflow-hidden border border-red-100 shadow-md rounded-2xl bg-white">
          <CardHeader className="bg-red-50/40 border-b border-red-50 py-5">
            <CardTitle className="flex items-center gap-2.5 text-base font-bold text-red-650">
              <div className="p-2 rounded-xl bg-red-100/50 text-red-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
              Zona de peligro
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gray-50/40 border border-gray-100/60 p-4 rounded-xl">
              <div>
                <p className="text-sm font-bold text-gray-800">Cerrar sesión</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Cerrá tu sesión en este dispositivo
                </p>
              </div>
              <Button
                variant="outline"
                className="h-10 rounded-xl border-red-200/50 text-red-500 hover:bg-red-50/50 hover:text-red-600 font-semibold px-5 transition-colors"
                onClick={async () => {
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  router.push("/login")
                }}
              >
                Cerrar sesión
              </Button>
            </div>

            <Separator className="bg-gray-100" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-red-50/10 border border-red-100/30 p-4 rounded-xl">
              <div>
                <p className="text-sm font-bold text-gray-800">Eliminar cuenta</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Esta acción es permanente y no se puede deshacer
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold px-5 shadow-xs transition-all active:scale-[0.98]"
                  >
                    Eliminar cuenta
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-extrabold text-gray-900">¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed font-medium">
                      Esta acción eliminará permanentemente tu cuenta y todos tus datos. No se puede
                      deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl font-semibold">Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDangerDelete} className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold">
                      Sí, eliminar cuenta
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}