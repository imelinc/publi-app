"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { AuthLayout } from "@/components/publi/AuthLayout"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError("Email o contraseña incorrectos")
      setLoading(false)
      return
    }

    router.push("/dashboard")
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Ingresá a tu cuenta
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Gestioná tus redes desde un solo lugar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="tu@email.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 px-4"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>¿Olvidaste tu contraseña?</DialogTitle>
                  <DialogDescription>
                    Ponte en contacto con nuestro equipo para reestablecer tu contraseña.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2 py-4">
                  <a
                    href="mailto:support@publi.com"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    support@publi.com
                  </a>
                </div>
                <Button onClick={() => setForgotOpen(false)} className="w-full">
                  Entendido
                </Button>
              </DialogContent>
            </Dialog>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 px-4"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="mt-2 h-11 w-full text-[15px] font-semibold"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        ¿Todavía no tenés cuenta?{" "}
        <Link
          href="/waitlist"
          className="font-semibold text-primary hover:underline"
        >
          Solicitar acceso
        </Link>
      </p>
    </AuthLayout>
  )
}
