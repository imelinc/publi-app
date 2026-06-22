"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import {
  Sparkles,
  Calendar,
  TrendingUp,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ShieldCheck
} from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  // Carousel of features on the left teaser panel
  const features = [
    {
      icon: <Calendar className="h-6 w-6 text-primary" />,
      title: "Planificación Unificada",
      description: "Gestioná múltiples clientes y agendas mensuales en una sola cuadrícula visual intuitiva."
    },
    {
      icon: <Sparkles className="h-6 w-6 text-[#ffb703]" />,
      title: "Copys Optimizados con IA",
      description: "Generá textos y hashtags adaptados al tono de tu cliente en segundos con Copi IA."
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-emerald-400" />,
      title: "Métricas que Impactan",
      description: "Visualizá y exportá reportes de engagement de forma automática y premium."
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [features.length])

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
    <main className="min-h-screen grid lg:grid-cols-12 bg-background overflow-hidden">
      {/* Columna Izquierda: Teaser Premium (Oculto en móviles) */}
      <section className="hidden lg:flex lg:col-span-6 relative overflow-hidden bg-[#0a1c22] flex-col justify-between p-12 text-white border-r border-[#0095b6]/10">
        {/* Glows de fondo */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-[#0095b6]/15 blur-[120px] animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#ffb703]/5 blur-[150px] animate-pulse pointer-events-none" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        
        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-2 text-3xl font-black tracking-tight text-white group">
          <span className="bg-gradient-to-r from-primary to-[#00b4d8] bg-clip-text text-transparent group-hover:opacity-90">publi</span>
          <span className="text-[10px] uppercase font-bold tracking-wider bg-white/10 px-2 py-0.5 rounded-md border border-white/5">Beta</span>
        </Link>

        {/* Mockups interactivos flotantes */}
        <div className="relative my-auto flex flex-col items-center justify-center h-[420px] max-w-[460px] mx-auto w-full">
          {/* Card de métricas */}
          <div className="absolute top-4 -left-12 w-64 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-2xl hover:scale-105 transition-all duration-500 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold tracking-wider text-white/50 uppercase">Rendimiento Semanal</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">+34.8%</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black">42.8k</span>
              <span className="text-[10px] text-white/70">Impresiones totales</span>
            </div>
            {/* Gráfico SVG simple y premium */}
            <div className="mt-4 h-10 w-full overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path
                  d="M0,25 Q15,5 30,18 T60,5 T90,12 T100,2 L100,30 L0,30 Z"
                  fill="url(#gradient-chart)"
                  opacity="0.3"
                />
                <path
                  d="M0,25 Q15,5 30,18 T60,5 T90,12 T100,2"
                  fill="none"
                  stroke="#0095b6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient-chart" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0095b6" />
                    <stop offset="100%" stopColor="#0095b6" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Card de publicación programada */}
          <div className="absolute bottom-6 -right-12 w-72 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 shadow-2xl hover:scale-105 transition-all duration-500 animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/restaurant.jpg"
                  alt="Restaurant Post"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    // Fallback simple si no existe la imagen
                    e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><rect width='40' height='40' fill='%230095b6'/></svg>"
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">Menu Primavera - Bistro</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <p className="text-[10px] text-white/60">Programado · Hoy 18:30</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card central de IA */}
          <div className="w-80 rounded-3xl border border-primary/20 bg-gradient-to-br from-[#0a2027]/80 to-[#0e2730]/90 backdrop-blur-xl p-6 shadow-3xl ring-1 ring-white/10 hover:scale-[1.02] transition-all duration-500">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/20">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="text-xs font-bold">Copi IA Asistente</h4>
                <p className="text-[9px] text-white/50">Tono dinámico y engagement</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-[10px] leading-relaxed text-white/80 italic">"¡Presentamos la nueva carta! Hecha con amor y de estación."</p>
              </div>
              <div className="flex justify-center">
                <ChevronRight className="h-4 w-4 text-primary/70 rotate-90" />
              </div>
              <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
                <p className="text-[10px] leading-relaxed text-white font-semibold">"🌸 La primavera se siente en cada plato. ¿Listo para descubrir sabores frescos que despiertan tus sentidos? Vení a probar nuestro nuevo menú. #BistroPrimavera"</p>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel de Features */}
        <div className="relative z-10 max-w-md mx-auto text-center px-4">
          <div className="h-28 overflow-hidden relative">
            {features.map((feat, index) => (
              <div
                key={index}
                className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 transform ${
                  index === currentSlide
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-4 scale-95 pointer-events-none"
                }`}
              >
                <div className="mb-2 bg-white/5 p-2 rounded-full border border-white/5">{feat.icon}</div>
                <h3 className="text-sm font-bold text-white tracking-wide">{feat.title}</h3>
                <p className="text-xs text-white/70 mt-1 max-w-sm font-medium">{feat.description}</p>
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentSlide ? "w-5 bg-primary" : "w-1.5 bg-white/20"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Columna Derecha: Formulario de Login */}
      <section className="flex items-center justify-center p-6 sm:p-12 lg:col-span-6 bg-gradient-to-br from-[#f8f9fa] via-white to-[#f1f3f5] relative">
        {/* Glows sutiles para fondo claro */}
        <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-[420px] space-y-8 relative z-10">
          <div className="text-center lg:text-left">
            {/* Logo para móvil */}
            <Link href="/" className="lg:hidden inline-flex items-center gap-1.5 text-3xl font-black text-primary mb-6">
              publi
            </Link>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 leading-tight">
              Ingresá a tu cuenta
            </h1>
            <p className="mt-2 text-sm text-slate-500 font-semibold leading-relaxed">
              La plataforma definitiva para gestionar redes sociales de forma profesional.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Email
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-11 pr-4 rounded-xl border border-slate-200 focus:border-primary focus:ring-primary/20 bg-white/70 backdrop-blur-xs font-semibold text-slate-800 transition-all shadow-2xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Contraseña
                </Label>
                <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="text-xs font-bold text-primary hover:underline hover:opacity-90"
                    >
                      ¿La olvidaste?
                    </button>
                  </DialogTrigger>
                  <DialogContent className="rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-sm">
                    <DialogHeader>
                      <DialogTitle className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        ¿Olvidaste tu contraseña?
                      </DialogTitle>
                      <DialogDescription className="text-xs text-slate-500 leading-relaxed font-semibold pt-2">
                        Para reestablecer tu contraseña de forma segura, ponete en contacto con nuestro equipo de soporte técnico.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center gap-2 py-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <a
                        href="mailto:support@publi.com"
                        className="text-sm font-bold text-primary hover:underline"
                      >
                        soporte@publi.io
                      </a>
                    </div>
                    <Button onClick={() => setForgotOpen(false)} className="w-full h-11 rounded-xl font-bold bg-primary hover:bg-primary/95 text-white shadow-md">
                      Entendido
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                  <Lock className="h-4.5 w-4.5" />
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
                  className="h-12 pl-11 pr-4 rounded-xl border border-slate-200 focus:border-primary focus:ring-primary/20 bg-white/70 backdrop-blur-xs font-semibold text-slate-800 transition-all shadow-2xs"
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
              className="mt-3 h-12 w-full text-[15px] font-bold bg-gradient-to-r from-primary to-[#00b4d8] hover:from-primary/95 hover:to-[#00b4d8]/95 text-white rounded-xl shadow-[0_8px_20px_-8px_rgba(0,149,182,0.6)] hover:shadow-[0_12px_24px_-6px_rgba(0,149,182,0.8)] active:scale-[0.99] transition-all cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Ingresando...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1">
                  <span>Iniciar sesión</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400 font-bold">
            ¿Todavía no tenés cuenta?{" "}
            <Link
              href="/register"
              className="font-black text-primary hover:underline ml-1"
            >
              Registrarse ahora
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
