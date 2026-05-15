"use client"

import Link from "next/link"
import { useState } from "react"
import { AuthLayout } from "@/components/publi/AuthLayout"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Check } from "lucide-react"

type FormState = {
  nombre: string
  email: string
  clientes: string
  herramientas: string
}

const initialForm: FormState = {
  nombre: "",
  email: "",
  clientes: "",
  herramientas: "",
}

export default function WaitlistPage() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [errors, setErrors] = useState<Partial<FormState>>({})
  const [success, setSuccess] = useState(false)
  const [position, setPosition] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  function validate(): boolean {
    const next: Partial<FormState> = {}
    if (!form.nombre.trim()) next.nombre = "Campo requerido"
    if (!form.email.trim()) next.email = "Campo requerido"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Email inválido"
    if (!form.clientes) next.clientes = "Seleccioná una opción"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setServerError(null)

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.nombre,
          email: form.email,
          clientCount: form.clientes,
          currentTools: form.herramientas,
        }),
      })

      const data = await res.json()

      if (res.status === 409) {
        setServerError('Este email ya está en la lista')
        return
      }

      if (!res.ok) {
        setServerError(data.error ?? 'Ocurrió un error. Intentá de nuevo.')
        return
      }

      setPosition(data.position)
      setSuccess(true)
    } catch {
      setServerError('Ocurrió un error. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      {success ? (
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Check className="h-7 w-7 text-primary" strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            ¡Recibimos tu solicitud!
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            ¡Te anotaste! Te avisamos cuando tu acceso esté listo.
            {position !== null && (
              <>
                <br />
                Sos el número <span className="font-semibold text-foreground">#{position}</span> en la lista.
              </>
            )}
          </p>
          <Button asChild className="mt-2">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Estás a un paso de transformar
              <br />
              tu flujo de trabajo.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              publi está en beta cerrada. Dejanos tu info y te avisamos
              cuando tu acceso esté listo.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre completo</Label>
              <Input
                id="nombre"
                type="text"
                placeholder="Tu nombre y apellido"
                value={form.nombre}
                onChange={(e) =>
                  setForm({ ...form, nombre: e.target.value })
                }
                className="h-11 px-4"
              />
              {errors.nombre && (
                <p className="text-xs text-destructive">{errors.nombre}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="waitlist-email">Email profesional</Label>
              <Input
                id="waitlist-email"
                type="email"
                placeholder="vos@ejemplo.com"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                className="h-11 px-4"
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientes">
                ¿Cuántos clientes gestionás actualmente?
              </Label>
              <select
                id="clientes"
                value={form.clientes}
                onChange={(e) =>
                  setForm({ ...form, clientes: e.target.value })
                }
                className="h-11 w-full rounded-lg border border-input bg-card px-4 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [&>option]:text-foreground"
              >
                <option value="" disabled>
                  Seleccioná una opción
                </option>
                <option value="1-2">1-2</option>
                <option value="3-5">3-5</option>
                <option value="6-10">6-10</option>
                <option value="mas-de-10">Más de 10</option>
              </select>
              {errors.clientes && (
                <p className="text-xs text-destructive">{errors.clientes}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="herramientas">
                ¿Qué herramientas usás hoy?
                <span className="font-normal text-muted-foreground">
                  {" "}
                  (opcional)
                </span>
              </Label>
              <Textarea
                id="herramientas"
                rows={3}
                placeholder="Ej: Meta Business Suite, Notion, planillas..."
                value={form.herramientas}
                onChange={(e) =>
                  setForm({ ...form, herramientas: e.target.value })
                }
                className="min-h-[80px] resize-none px-4"
              />
            </div>

            {serverError && (
              <p className="text-sm text-destructive">{serverError}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-11 w-full text-[15px] font-semibold"
            >
              {loading ? 'Enviando...' : 'Solicitar acceso'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿Ya tenés cuenta?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              Ingresá
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  )
}
