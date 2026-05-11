"use client"

import {
  AlertTriangle,
  Bell,
  Lock,
  Settings,
  User,
} from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

const USER = {
  name: "Nacho Melinc",
  email: "nacho@publi.app",
  avatar: "NM",
  plan: "Pro",
}

type NotificationSettings = {
  scheduledSuccess: boolean
  published: boolean
  publishError: boolean
  reminder: boolean
  weeklySummary: boolean
}

export default function ConfiguracionPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [workspaceName, setWorkspaceName] = React.useState<string>("Mi workspace")
  const [language, setLanguage] = React.useState<string>("Español")
  const [timezone, setTimezone] = React.useState<string>("America/Buenos_Aires (GMT-3)")
  const [currentPassword, setCurrentPassword] = React.useState<string>("")
  const [newPassword, setNewPassword] = React.useState<string>("")
  const [confirmPassword, setConfirmPassword] = React.useState<string>("")
  const [notifications, setNotifications] = React.useState<NotificationSettings>({
    scheduledSuccess: true,
    published: true,
    publishError: true,
    reminder: false,
    weeklySummary: false,
  })

  const updateNotification = React.useCallback(
    (key: keyof NotificationSettings, value: boolean) => {
      setNotifications((current) => ({ ...current, [key]: value }))
    },
    []
  )

  const handleDangerDelete = React.useCallback(() => {
    toast({ title: "Cuenta eliminada" })
    router.push("/login")
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
            <Settings className="h-4 w-4 text-primary" />
            General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace">Nombre del workspace</Label>
            <Input
              id="workspace"
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">
              Este nombre aparece en tus reportes y notificaciones
            </p>
          </div>

          <div className="space-y-2">
            <Label>Idioma</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Español">Español</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Português">Português</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Zona horaria</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/Buenos_Aires (GMT-3)">
                  America/Buenos_Aires (GMT-3)
                </SelectItem>
                <SelectItem value="America/New_York (GMT-5)">
                  America/New_York (GMT-5)
                </SelectItem>
                <SelectItem value="Europe/Madrid (GMT+1)">
                  Europe/Madrid (GMT+1)
                </SelectItem>
                <SelectItem value="America/Mexico_City (GMT-6)">
                  America/Mexico_City (GMT-6)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-1">
            <Button onClick={() => toast({ title: "Configuración guardada" })}>
              Guardar cambios
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Publicación programada exitosamente
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Recibí una notificación cada vez que una publicación se programe correctamente
                </p>
              </div>
              <Switch
                checked={notifications.scheduledSuccess}
                onCheckedChange={(value) => updateNotification("scheduledSuccess", value)}
              />
            </div>
            <Separator />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Publicación publicada</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Notificación cuando una publicación se publica en la red social
                </p>
              </div>
              <Switch
                checked={notifications.published}
                onCheckedChange={(value) => updateNotification("published", value)}
              />
            </div>
            <Separator />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Error al publicar</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Alerta cuando una publicación falla al intentar publicarse
                </p>
              </div>
              <Switch
                checked={notifications.publishError}
                onCheckedChange={(value) => updateNotification("publishError", value)}
              />
            </div>
            <Separator />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Recordatorio previo a publicación
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Recibí un aviso 1 hora antes de cada publicación programada
                </p>
              </div>
              <Switch
                checked={notifications.reminder}
                onCheckedChange={(value) => updateNotification("reminder", value)}
              />
            </div>
            <Separator />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Resumen semanal</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Recibí un resumen de actividad todos los lunes
                </p>
              </div>
              <Switch
                checked={notifications.weeklySummary}
                onCheckedChange={(value) => updateNotification("weeklySummary", value)}
              />
            </div>
          </div>

          <div className="pt-1">
            <Button onClick={() => toast({ title: "Preferencias guardadas" })}>
              Guardar preferencias
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-email">Email actual</Label>
            <div className="relative">
              <Input
                id="current-email"
                disabled
                value={USER.email}
                className="h-10 pr-10"
              />
              <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current-password">Contraseña actual</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">Nueva contraseña</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="h-10"
            />
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setCurrentPassword("")
              setNewPassword("")
              setConfirmPassword("")
              toast({ title: "Contraseña actualizada correctamente" })
            }}
          >
            Actualizar contraseña
          </Button>
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
              onClick={() => router.push("/login")}
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
