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
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Sliders,
  TrendingUp,
  Image as ImageIcon
} from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  // Password recovery states
  const [recoveryEmail, setRecoveryEmail] = useState("")
  const [recoveryLoading, setRecoveryLoading] = useState(false)
  const [recoverySuccess, setRecoverySuccess] = useState(false)
  const [recoveryError, setRecoveryError] = useState<string | null>(null)

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
      icon: <ImageIcon className="h-6 w-6 text-[#00b4d8]" />,
      title: "Diseño & Edición Integrados",
      description: "Generá imágenes desde cero con IA y aplicales filtros profesionales directo en la plataforma."
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-emerald-400" />,
      title: "Métricas de Performance",
      description: "Analizá el engagement, impresiones y crecimiento de tus marcas con gráficos automatizados."
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [features.length])

  // Reset recovery state when modal is opened/closed
  useEffect(() => {
    if (!forgotOpen) {
      setRecoveryEmail("")
      setRecoverySuccess(false)
      setRecoveryError(null)
    }
  }, [forgotOpen])

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setRecoveryError(null)
    setRecoveryLoading(true)

    const supabase = createClient()
    
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        throw new Error(resetError.message)
      }

      setRecoverySuccess(true)
    } catch (err) {
      setRecoveryError(err instanceof Error ? err.message : "Error al enviar el email de recuperación.")
    } finally {
      setRecoveryLoading(false)
    }
  }

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
        <div className="relative my-auto flex flex-col items-center justify-center h-[560px] max-w-[480px] mx-auto w-full scale-[0.9] xl:scale-100 transition-all duration-300">
          {/* Card 1: Cuentas Conectadas */}
          <div className="absolute -top-12 -left-16 w-52 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-2xl hover:scale-105 hover:border-primary/30 transition-all duration-500 animate-in fade-in slide-in-from-left-8 duration-700">
            <span className="text-[9px] font-bold tracking-wider text-white/50 uppercase block mb-2.5">Cuentas Conectadas</span>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500 flex items-center justify-center text-[9px] font-black">IG</div>
                  <span className="text-[11px] font-bold text-white/90">@bistromenu</span>
                </div>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-[#1877f2] flex items-center justify-center text-[9px] font-black">FB</div>
                  <span className="text-[11px] font-bold text-white/70">Bistro Oficial</span>
                </div>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </div>
            </div>
          </div>

          {/* Card 2: Generador IA */}
          <div className="absolute -top-16 -right-16 w-60 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-2xl hover:scale-105 hover:border-primary/30 transition-all duration-500 animate-in fade-in slide-in-from-right-8 duration-700 delay-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold tracking-wider text-white/50 uppercase">Generador IA</span>
              <span className="text-[9px] font-bold text-[#00b4d8] bg-[#00b4d8]/10 px-2 py-0.5 rounded-full">Listo</span>
            </div>
            <p className="text-[10px] text-white/80 font-mono bg-black/20 p-1.5 rounded border border-white/5 truncate mb-2">
              "Atardecer en Venecia con..."
            </p>
            <div className="flex gap-2">
              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 relative">
                <img
                  src="/images/paisaje_canal.jpg"
                  alt="Generated IA"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='48' viewBox='0 0 60 48'><rect width='60' height='48' fill='%2300b4d8'/></svg>"
                  }}
                />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div className="bg-[#00b4d8] h-full w-full" />
                </div>
                <p className="text-[9px] text-white/60 font-medium">Resolución: 1:1 HD</p>
                <div className="text-[8px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded self-start font-bold">100% Optimizado</div>
              </div>
            </div>
          </div>

          {/* Card 3: Editor de Fotos */}
          <div className="absolute top-20 -left-20 w-56 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-2xl hover:scale-105 hover:border-primary/30 transition-all duration-500 animate-in fade-in slide-in-from-left-8 duration-700 delay-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-bold tracking-wider text-white/50 uppercase">Editor de Fotos</span>
              <Sliders className="h-3 w-3 text-white/40" />
            </div>
            <div className="flex gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 relative">
                <img
                  src="/images/bicicleta.jpg"
                  alt="Edit preview"
                  className="h-full w-full object-cover saturate-[1.65]"
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'><rect width='56' height='56' fill='%23ffb703'/></svg>"
                  }}
                />
                <span className="absolute bottom-1 right-1 text-[7px] bg-black/60 px-1 py-0.5 rounded text-white font-bold">Juno</span>
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[8px] text-white/60 font-bold">
                    <span>Brillo</span>
                    <span>+80%</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="bg-[#ffb703] h-full w-[80%]" />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[8px] text-white/60 font-bold">
                    <span>Saturación</span>
                    <span>+65%</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-[65%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Gráfico de Crecimiento */}
          <div className="absolute top-24 -right-24 w-64 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-2xl hover:scale-105 hover:border-primary/30 transition-all duration-500 animate-in fade-in slide-in-from-right-8 duration-700 delay-300">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-bold tracking-wider text-white/50 uppercase">Métricas de Crecimiento</span>
              <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">
                <TrendingUp className="h-2.5 w-2.5" /> +15.4%
              </span>
            </div>
            <div className="mb-2">
              <p className="text-lg font-black text-white leading-none">18.4k</p>
              <p className="text-[9px] text-white/40 font-medium">Seguidores Totales · Bistro</p>
            </div>
            <div className="h-14 w-full relative">
              <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0095b6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#0095b6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,25 C15,22 25,8 40,15 C55,22 70,5 85,12 C92,15 96,6 100,5"
                  fill="none"
                  stroke="#0095b6"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M0,25 C15,22 25,8 40,15 C55,22 70,5 85,12 C92,15 96,6 100,5 L100,30 L0,30 Z"
                  fill="url(#chart-glow)"
                />
                <circle cx="100" cy="5" r="2.5" fill="#00b4d8" className="animate-pulse" />
              </svg>
            </div>
          </div>

          {/* Card 5: Card central de IA */}
          <div className="w-80 rounded-3xl border border-primary/20 bg-gradient-to-br from-[#0a2027]/90 to-[#0e2730]/95 backdrop-blur-xl p-6 shadow-3xl ring-1 ring-white/10 hover:scale-[1.02] transition-all duration-500 relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/20">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Copi IA Asistente</h4>
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

          {/* Card 6: Post Publicado */}
          <div className="absolute bottom-16 -left-20 w-64 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-2xl hover:scale-105 hover:border-primary/30 transition-all duration-500 animate-in fade-in slide-in-from-left-8 duration-700 delay-300">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[9px] font-bold tracking-wider text-white/50 uppercase">Publicado hace 2h</span>
              <span className="text-[9px] font-bold text-[#e1306c] bg-[#e1306c]/10 px-2 py-0.5 rounded-full">Instagram</span>
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10">
                <img
                  src="/images/starbucks.webp"
                  alt="Post thumbnail"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><rect width='40' height='40' fill='%23e1306c'/></svg>"
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-white/90 font-bold truncate">Café de Especialidad</p>
                <p className="text-[9px] text-white/50 leading-relaxed truncate">"Despertá tus sentidos con nuestro nuevo blend..."</p>
              </div>
            </div>
          </div>

          {/* Card 7: Aprobación de Cliente */}
          <div className="absolute bottom-28 -right-20 w-60 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-2xl hover:scale-105 hover:border-primary/30 transition-all duration-500 animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold tracking-wider text-white/50 uppercase">Link de Aprobación</span>
              <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full animate-pulse">Pendiente</span>
            </div>
            <p className="text-[11px] text-white/80 font-medium">Borrador: Campaña de Primavera</p>
            <div className="flex gap-2 mt-3">
              <div className="flex-1 text-center py-1 rounded bg-white/5 text-[9px] font-bold border border-white/5 cursor-not-allowed text-white/60">Corregir</div>
              <div className="flex-1 text-center py-1 rounded bg-[#0095b6] text-[9px] font-bold text-white cursor-not-allowed">Aprobar ✓</div>
            </div>
          </div>

          {/* Card 8: Calendario Semanal */}
          <div className="absolute -bottom-16 -right-16 w-64 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-2xl hover:scale-105 hover:border-primary/30 transition-all duration-500 animate-in fade-in slide-in-from-right-8 duration-700 delay-300">
            <span className="text-[9px] font-bold tracking-wider text-white/50 uppercase block mb-3">Calendario Semanal</span>
            <div className="grid grid-cols-5 gap-1.5 text-center text-[10px]">
              <div className="bg-white/5 rounded p-1 border border-white/5">
                <p className="text-white/40 text-[8px] font-bold">LUN</p>
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mx-auto mt-1" />
              </div>
              <div className="bg-white/10 rounded p-1 border border-primary/30">
                <p className="text-primary font-bold">MAR</p>
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400 mx-auto mt-1 animate-pulse" />
              </div>
              <div className="bg-white/5 rounded p-1 border border-white/5">
                <p className="text-white/40 text-[8px] font-bold">MIÉ</p>
                <div className="h-1.5 w-1.5 rounded-full bg-[#1877f2] mx-auto mt-1" />
              </div>
              <div className="bg-white/5 rounded p-1 border border-white/5">
                <p className="text-white/40 text-[8px] font-bold">JUE</p>
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mx-auto mt-1" />
              </div>
              <div className="bg-white/5 rounded p-1 border border-white/5">
                <p className="text-white/40 text-[8px] font-bold">VIE</p>
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mx-auto mt-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Carousel de Features */}
        <div className="relative z-10 max-w-md mx-auto text-center px-4 mt-auto">
          <div className="h-32 flex flex-col items-center justify-center">
            {(() => {
              const feat = features[currentSlide];
              return (
                <div className="flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="mb-2 bg-white/5 p-2 rounded-full border border-white/5">{feat.icon}</div>
                  <h3 className="text-sm font-bold text-white tracking-wide">{feat.title}</h3>
                  <p className="text-xs text-white/70 mt-1 max-w-sm font-medium leading-relaxed">{feat.description}</p>
                </div>
              );
            })()}
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-1.5 mt-2">
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
                        <ShieldCheck className="h-5 w-5 text-primary animate-pulse" />
                        Recuperar Contraseña
                      </DialogTitle>
                      <DialogDescription className="text-xs text-slate-500 leading-relaxed font-semibold pt-2">
                        Ingresá tu email y te enviaremos un enlace de recuperación seguro.
                      </DialogDescription>
                    </DialogHeader>

                    {recoverySuccess ? (
                      <div className="space-y-4 text-center py-4 animate-in fade-in duration-300">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <CheckCircle2 className="h-5.5 w-5.5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-900">¡Email enviado!</p>
                          <p className="text-[11px] text-slate-500 font-medium">Revisá tu bandeja de entrada y spam.</p>
                        </div>
                        <Button onClick={() => setForgotOpen(false)} className="w-full h-10 rounded-xl font-bold bg-primary hover:bg-primary/95 text-white">
                          Cerrar
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="reset-email" className="text-xs font-bold text-slate-400 uppercase tracking-wide">Email</Label>
                          <Input
                            id="reset-email"
                            type="email"
                            placeholder="tu@email.com"
                            required
                            value={recoveryEmail}
                            onChange={(e) => setRecoveryEmail(e.target.value)}
                            className="h-11 rounded-xl border border-slate-200"
                          />
                        </div>

                        {recoveryError && (
                          <p className="text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 rounded-lg p-2 flex items-center gap-1.5">
                            {recoveryError}
                          </p>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setForgotOpen(false)}
                            className="rounded-xl h-10 flex-1 font-bold"
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            disabled={recoveryLoading}
                            className="rounded-xl h-10 flex-1 bg-primary text-white font-bold hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                          >
                            {recoveryLoading ? "Enviando..." : "Enviar enlace"}
                          </Button>
                        </div>
                      </form>
                    )}
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
