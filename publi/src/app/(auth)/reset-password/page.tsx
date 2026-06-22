"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Lock, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        throw new Error(updateError.message)
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard")
      }, 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la contraseña. El enlace puede haber expirado.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#f8f9fa] via-white to-[#f1f3f5] relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[400px] space-y-8 relative z-10 bg-white p-8 rounded-3xl border border-slate-100 shadow-xl">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-3xl font-black text-primary mb-4">
            publi
          </Link>
          
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            Nueva contraseña
          </h1>
          <p className="mt-2 text-xs text-slate-500 font-semibold leading-relaxed">
            Ingresá tu nueva clave de acceso para recuperar tu cuenta.
          </p>
        </div>

        {success ? (
          <div className="space-y-4 text-center py-6 animate-in fade-in zoom-in duration-300">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900">¡Contraseña restablecida!</h3>
              <p className="text-xs text-slate-500 font-medium">Te estamos redirigiendo a tu dashboard...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Nueva Contraseña
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pl-10 pr-4 rounded-xl border border-slate-200 focus:border-primary focus:ring-primary/20 bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Confirmar Contraseña
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  placeholder="Repetir contraseña"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 pl-10 pr-4 rounded-xl border border-slate-200 focus:border-primary focus:ring-primary/20 bg-white"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs font-bold text-rose-500 bg-rose-50 border border-rose-100 rounded-lg p-2.5 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full text-[14px] font-bold bg-gradient-to-r from-primary to-[#00b4d8] text-white rounded-xl shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer border border-transparent"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Actualizando...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1">
                  <span>Actualizar contraseña</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </form>
        )}
      </div>
    </main>
  )
}
