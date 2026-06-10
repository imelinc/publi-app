"use client"

import {
  AlertTriangle,
  User,
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
    <div className="min-h-screen bg-[#f5f0e8] p-6 md:p-8">
    <div className="mx-auto w-full max-w-[680px] space-y-5">
      <section>
        <h1 className="text-3xl font-semibold text-foreground">Configuración</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Personalizá tu experiencia en publi
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-name">Nombre</Label>
            <Input
              id="account-name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="current-email">Email</Label>
            <div className="relative">
              <Input
                id="current-email"
                disabled
                value={userProfile?.email ?? ''}
                className="h-10"
              />
            </div>
          </div>

          <div className="pt-1">
            <Button onClick={handleSaveAccount} disabled={savingAccount}>
              {savingAccount ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Workspace
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace">Nombre del workspace</Label>
            <Input
              id="workspace"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">
              Este nombre aparece en tus reportes y notificaciones
            </p>
          </div>

          <div className="pt-1">
            <Button onClick={handleSaveWorkspace} disabled={savingWorkspace}>
              {savingWorkspace ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className={cn("border-red-300")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Zona de peligro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Cerrar sesión</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Cerrá tu sesión en este dispositivo
              </p>
            </div>
            <Button
              variant="outline"
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                router.push("/login")
              }}
            >
              Cerrar sesión
            </Button>
          </div>

          <Separator />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Eliminar cuenta</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Esta acción es permanente y no se puede deshacer
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Eliminar cuenta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará permanentemente tu cuenta y todos tus datos. No se puede
                    deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDangerDelete}>
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