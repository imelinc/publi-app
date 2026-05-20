"use client"

import {
  AlertTriangle,
  User,
} from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { useAppStore } from "@/store/use-app-store"
import type { UserProfile } from "@/types"

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
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

async function parseApiError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string; message?: string }
    return data.error ?? data.message ?? 'Error desconocido'
  } catch {
    return 'Error desconocido'
  }
}

export default function ConfiguracionPage() {
  const router = useRouter()
  const { toast } = useToast()

  const setUser = useAppStore((s) => s.setUser)

  const [loading, setLoading] = React.useState(true)
  const [savingGeneral, setSavingGeneral] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [workspaceName, setWorkspaceName] = React.useState("Mi workspace")

  React.useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      try {
        const res = await fetch("/api/users/me")
        if (!res.ok) {
          const msg = await parseApiError(res)
          if (!cancelled) {
            toast({ title: "Error al cargar perfil", description: msg })
          }
          return
        }
        const profile = (await res.json()) as UserProfile
        if (cancelled) return
        setName(profile.name)
        setEmail(profile.email)
        setWorkspaceName(profile.workspaceName)
      } catch {
        if (!cancelled) {
          toast({
            title: "Error al cargar perfil",
            description: "No se pudo conectar con el servidor",
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProfile()
    return () => {
      cancelled = true
    }
  }, [toast])

  const handleSaveGeneral = React.useCallback(async () => {
    setSavingGeneral(true)
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, workspaceName }),
      })
      if (!res.ok) {
        toast({
          title: "Error al guardar",
          description: await parseApiError(res),
        })
        return
      }
      const profile = (await res.json()) as UserProfile
      setName(profile.name)
      setWorkspaceName(profile.workspaceName)
      setUser(profile)
      toast({ title: "Configuración guardada" })
    } catch {
      toast({
        title: "Error al guardar",
        description: "No se pudo conectar con el servidor",
      })
    } finally {
      setSavingGeneral(false)
    }
  }, [name, workspaceName, toast, setUser])

  const handleDangerDelete = React.useCallback(async () => {
    setDeleting(true)
    try {
      const res = await fetch("/api/users/me", { method: "DELETE" })
      if (!res.ok && res.status !== 204) {
        toast({
          title: "Error al eliminar cuenta",
          description: await parseApiError(res),
        })
        return
      }
      const supabase = createClient()
      await supabase.auth.signOut()
      toast({ title: "Cuenta eliminada" })
      router.push("/login")
    } catch {
      toast({
        title: "Error al eliminar cuenta",
        description: "No se pudo conectar con el servidor",
      })
    } finally {
      setDeleting(false)
    }
  }, [router, toast])

  const disabled = loading || savingGeneral || deleting

  return (
    <div className="min-h-screen bg-[#f5f0e8] p-6 md:p-8">
    <div className="mx-auto w-full max-w-[680px] space-y-5">
      <section>
        <h1 className="text-3xl font-semibold text-foreground">Configuración</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Personalizá tu experiencia en publi
        </p>
      </section>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando configuración...</p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-10"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace">Nombre del workspace</Label>
            <Input
              id="workspace"
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              className="h-10"
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Este nombre aparece en tus reportes y notificaciones
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current-email">Email</Label>
            <Input
              id="current-email"
              disabled
              value={email}
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">
              El email no se puede modificar
            </p>
          </div>

          <div className="pt-1">
            <Button onClick={handleSaveGeneral} disabled={disabled}>
              {savingGeneral ? "Guardando..." : "Guardar cambios"}
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
              disabled={disabled}
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                router.push("/login")
              }}
            >
              Cerrar sesión
            </Button>
          </div>

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
                  disabled={disabled}
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
                  <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDangerDelete} disabled={deleting}>
                    {deleting ? "Eliminando..." : "Sí, eliminar cuenta"}
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
