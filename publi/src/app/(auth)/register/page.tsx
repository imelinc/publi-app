"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import {
  Sparkles,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Crown,
  ChevronRight,
  Info,
  Calendar,
  Settings,
  ShieldCheck,
  Building
} from "lucide-react"

type RegisterStep = "details" | "plan" | "payment"

export default function RegisterPage() {
  const router = useRouter()

  // Form states
  const [step, setStep] = useState<RegisterStep>("details")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [selectedPlan, setSelectedPlan] = useState<"free" | "pro">("pro")

  // Payment states
  const [cardNumber, setCardNumber] = useState("")
  const [cardHolder, setCardHolder] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")
  const [cvvFocused, setCvvFocused] = useState(false)

  // Loading & Error states
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState("")

  // Teaser carousel active index (left column)
  const [currentSlide, setCurrentSlide] = useState(0)

  const carouselSlides = [
    {
      title: "14 días de prueba Pro",
      description: "Probá todas las herramientas de IA y la programación directa sin límites."
    },
    {
      title: "Asistente Copi IA",
      description: "Copys adaptados, hashtags inteligentes y sugerencias de horario óptimo en un clic."
    },
    {
      title: "Gestión Multi-Cliente",
      description: "Estructurá el trabajo de tus marcas con workspaces independientes y reportes premium."
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [carouselSlides.length])

  // Form validation for Details step
  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Completá todos los campos para continuar.")
      return
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.")
      return
    }
    setStep("plan")
  }

  // Handle formatting for card inputs
  const onCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const formatted = value.match(/.{1,4}/g)?.join(" ") || ""
    setCardNumber(formatted.slice(0, 19))
  }

  const onExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}`
    }
    setCardExpiry(value.slice(0, 5))
  }

  const onCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    setCardCvv(value.slice(0, 4))
  }

  // Handle final registration & setup
  const executeSignUp = async (plan: "free" | "pro") => {
    setError(null)
    setLoading(true)

    const supabase = createClient()

    try {
      // Phase 1: Authentication
      if (plan === "pro") {
        setLoadingPhase("Procesando pago seguro...")
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setLoadingPhase("Verificando tarjeta de crédito...")
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setLoadingPhase("Creando cuenta de usuario...")
      } else {
        setLoadingPhase("Creando tu cuenta gratis...")
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      // Supabase Sign Up
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name.trim(),
          },
        },
      })

      if (signUpError) {
        throw new Error(signUpError.message)
      }

      const user = data.user
      if (!user) {
        throw new Error("No se pudo obtener la sesión de usuario recién creado.")
      }

      // Phase 2: Create profile with chosen plan
      setLoadingPhase("Configurando tu workspace...")
      
      const patchRes = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          plan: plan,
        }),
      })

      if (!patchRes.ok) {
        const patchData = await patchRes.json().catch(() => ({}))
        throw new Error(patchData.error || "Error al configurar el perfil en la base de datos.")
      }

      setLoadingPhase("¡Listo! Redirigiendo...")
      await new Promise((resolve) => setTimeout(resolve, 800))
      
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      console.error("Sign up process failed:", err)
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado. Por favor, reintentá.")
      setLoading(false)
      // Si falla en base de datos o auth, regresamos a detalles para que corrijan el email/etc.
      setStep("details")
    }
  }

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cardNumber || cardNumber.length < 19) {
      setError("El número de tarjeta no es válido.")
      return
    }
    if (!cardHolder.trim()) {
      setError("El nombre del titular es requerido.")
      return
    }
    if (!cardExpiry || cardExpiry.length < 5) {
      setError("La fecha de expiración no es válida.")
      return
    }
    if (!cardCvv || cardCvv.length < 3) {
      setError("El código CVV no es válido.")
      return
    }

    executeSignUp("pro")
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-12 bg-background overflow-hidden">
      {/* Columna Izquierda: Teaser de marca (Oculto en móviles) */}
      <section className="hidden lg:flex lg:col-span-5 relative overflow-hidden bg-[#0a1c22] flex-col justify-between p-12 text-white border-r border-[#0095b6]/10">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-[#0095b6]/15 blur-[120px] animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#ffb703]/5 blur-[150px] animate-pulse pointer-events-none" style={{ animationDuration: '12s', animationDelay: '2s' }} />

        <Link href="/" className="relative z-10 flex items-center gap-2 text-3xl font-black tracking-tight text-white group">
          <span className="bg-gradient-to-r from-primary to-[#00b4d8] bg-clip-text text-transparent group-hover:opacity-90">publi</span>
          <span className="text-[10px] uppercase font-bold tracking-wider bg-white/10 px-2 py-0.5 rounded-md border border-white/5">Beta</span>
        </Link>

        {/* Floating Previews */}
        <div className="relative my-auto flex flex-col items-center justify-center h-[340px] w-full">
          {/* Card 1 */}
          <div className="absolute top-0 -left-6 w-56 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-xl hover:scale-105 transition-all duration-500">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                <Crown className="h-3.5 w-3.5" />
              </div>
              <span className="text-[10px] font-bold text-white/90">Acceso Pro Ilimitado</span>
            </div>
            <p className="text-[11px] text-white/70 leading-relaxed">
              Planificá sin límites de marcas, automatizá posts y delegá la aprobación al cliente con links mágicos.
            </p>
          </div>

          {/* Card 2 */}
          <div className="absolute bottom-4 -right-6 w-60 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-xl hover:scale-105 transition-all duration-500">
            <div className="flex items-center gap-2 mb-2 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-[10px] font-bold text-white/90">Sincronización IG</span>
            </div>
            <p className="text-[11px] text-white/70 leading-relaxed">
              Subida automática y directa de imágenes y videos directamente al feed e historias.
            </p>
          </div>

          {/* Premium graphic center */}
          <div className="h-32 w-32 rounded-full border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/40 flex items-center justify-center animate-pulse">
            <Sparkles className="h-12 w-12 text-[#ffb703] animate-bounce" style={{ animationDuration: '4s' }} />
          </div>
        </div>

        {/* Carousel */}
        <div className="relative z-10 max-w-sm mx-auto text-center px-4">
          <div className="h-24 overflow-hidden relative">
            {carouselSlides.map((feat, index) => (
              <div
                key={index}
                className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 transform ${
                  index === currentSlide
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-4 scale-95 pointer-events-none"
                }`}
              >
                <h3 className="text-sm font-bold text-white tracking-wide">{feat.title}</h3>
                <p className="text-xs text-white/70 mt-1 max-w-xs font-medium">{feat.description}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-3">
            {carouselSlides.map((_, index) => (
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

      {/* Columna Derecha: Flujo por Pasos */}
      <section className="flex items-center justify-center p-6 sm:p-12 lg:col-span-7 bg-gradient-to-br from-[#f8f9fa] via-white to-[#f1f3f5] relative overflow-y-auto max-h-screen">
        <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-[540px] space-y-8 relative z-10 py-6">
          {/* Indicador de Pasos */}
          <div className="flex items-center justify-center gap-2 max-w-xs mx-auto mb-4">
            <div className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${step === "details" ? "bg-primary" : "bg-emerald-500"}`} />
            <div className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${step === "plan" ? "bg-primary" : step === "payment" ? "bg-emerald-500" : "bg-slate-200"}`} />
            <div className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${step === "payment" ? "bg-primary" : "bg-slate-200"}`} />
          </div>

          {error && (
            <p className="text-xs font-bold text-rose-500 bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              {error}
            </p>
          )}

          {/* PASO 1: DETALLES DE CUENTA */}
          {step === "details" && (
            <div className="space-y-6">
              <div className="text-center lg:text-left">
                <Link href="/" className="lg:hidden inline-flex items-center gap-1.5 text-3xl font-black text-primary mb-6">
                  publi
                </Link>
                <h1 className="text-3xl font-black tracking-tight text-gray-900 leading-tight">
                  Creá tu cuenta
                </h1>
                <p className="mt-2 text-sm text-slate-500 font-semibold leading-relaxed">
                  Ingresá tus credenciales básicas para comenzar a planificar con IA.
                </p>
              </div>

              <form onSubmit={handleDetailsSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Nombre Completo
                  </Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                      <User className="h-4.5 w-4.5" />
                    </div>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Juan Pérez"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 pl-11 pr-4 rounded-xl border border-slate-200 focus:border-primary focus:ring-primary/20 bg-white/70 backdrop-blur-xs font-semibold text-slate-800 transition-all shadow-2xs"
                    />
                  </div>
                </div>

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
                      placeholder="juan@ejemplo.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 pl-11 pr-4 rounded-xl border border-slate-200 focus:border-primary focus:ring-primary/20 bg-white/70 backdrop-blur-xs font-semibold text-slate-800 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Contraseña
                  </Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                      <Lock className="h-4.5 w-4.5" />
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pl-11 pr-4 rounded-xl border border-slate-200 focus:border-primary focus:ring-primary/20 bg-white/70 backdrop-blur-xs font-semibold text-slate-800 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="mt-3 h-12 w-full text-[15px] font-bold bg-gradient-to-r from-primary to-[#00b4d8] text-white rounded-xl shadow-[0_8px_20px_-8px_rgba(0,149,182,0.6)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer border border-transparent"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Elegir plan</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Button>
              </form>

              <p className="text-center text-xs text-slate-400 font-bold pt-4 border-t border-slate-100">
                ¿Ya tenés una cuenta?{" "}
                <Link href="/login" className="font-black text-primary hover:underline ml-1">
                  Iniciar sesión
                </Link>
              </p>
            </div>
          )}

          {/* PASO 2: SELECCIÓN DE PLAN */}
          {step === "plan" && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-black tracking-tight text-gray-900 leading-tight">
                  Elegí tu plan
                </h1>
                <p className="mt-2 text-sm text-slate-500 font-semibold leading-relaxed">
                  Lanzá tu productividad. Podés cambiar o cancelar cuando quieras.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-4">
                {/* Plan Free Card */}
                <div
                  onClick={() => setSelectedPlan("free")}
                  className={`rounded-2xl p-6 bg-white border-2 cursor-pointer transition-all relative flex flex-col justify-between shadow-2xs ${
                    selectedPlan === "free"
                      ? "border-slate-400 bg-slate-50/20 scale-[1.02]"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-3">
                    <span className="text-[9px] font-bold tracking-wider text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase">
                      Plan Free
                    </span>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-black text-slate-800">$0</span>
                      <span className="text-xs text-slate-400 font-bold ml-1">/ de por vida</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      Para community managers que se inician con pocos clientes.
                    </p>
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-[11px] text-slate-600 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>Hasta 3 clientes</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-600 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>Vista Calendario</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 line-through decoration-slate-200 font-semibold">
                        <span>Asistente Copi IA</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 line-through decoration-slate-200 font-semibold">
                        <span>Horarios óptimos</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-6">
                    <p className="text-[10px] text-slate-400 italic mb-2 font-medium">
                      Upgradeable en el futuro.
                    </p>
                    <div className={`w-full h-2 rounded-full ${selectedPlan === 'free' ? 'bg-slate-400' : 'bg-slate-100'}`} />
                  </div>
                </div>

                {/* Plan Pro Card */}
                <div
                  onClick={() => setSelectedPlan("pro")}
                  className={`rounded-2xl p-6 bg-white border-2 cursor-pointer transition-all relative flex flex-col justify-between shadow-xs ${
                    selectedPlan === "pro"
                      ? "border-primary bg-gradient-to-br from-white to-[#0095b6]/5 scale-[1.02] shadow-[0_12px_24px_rgba(0,149,182,0.1)]"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Badge */}
                  <div className="absolute -top-3 right-4 bg-gradient-to-r from-primary to-[#00b4d8] text-white text-[9px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 border border-primary/20">
                    <Sparkles className="h-2.5 w-2.5" />
                    Recomendado
                  </div>

                  <div className="space-y-3">
                    <span className="text-[9px] font-bold tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full uppercase">
                      Plan Pro
                    </span>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-black text-gray-900">$9.99</span>
                      <span className="text-xs text-slate-400 font-bold ml-1">/ mes</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      Acceso completo a la automatización e inteligencia artificial.
                    </p>
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-[11px] text-slate-700 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>Clientes ilimitados</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-700 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>Asistente Copi IA</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-700 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>Horarios de mayor engagement</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-700 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>Editor de imágenes avanzado</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <p className="text-[10px] text-primary font-bold flex items-center gap-1 mb-2">
                      <Crown className="h-3 w-3" />
                      El preferido por profesionales
                    </p>
                    <div className={`w-full h-2 rounded-full ${selectedPlan === 'pro' ? 'bg-primary' : 'bg-slate-100'}`} />
                  </div>
                </div>
              </div>

              {/* Botón de envío según plan */}
              <div className="flex items-center justify-between gap-4 pt-6">
                <Button
                  onClick={() => setStep("details")}
                  variant="outline"
                  className="h-12 px-6 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 text-slate-600 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Atrás
                </Button>

                {selectedPlan === "pro" ? (
                  <Button
                    onClick={() => setStep("payment")}
                    className="h-12 flex-1 rounded-xl bg-gradient-to-r from-primary to-[#00b4d8] text-white font-bold hover:scale-[1.01] transition-all shadow-[0_8px_20px_-8px_rgba(0,149,182,0.6)] cursor-pointer border border-transparent"
                  >
                    <span>Configurar Pago ($9.99)</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => executeSignUp("free")}
                    disabled={loading}
                    className="h-12 flex-1 rounded-xl bg-slate-850 hover:bg-slate-900 text-white font-bold hover:scale-[1.01] transition-all shadow-md cursor-pointer border border-transparent"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{loadingPhase}</span>
                      </div>
                    ) : (
                      <span>Crear Cuenta Gratis</span>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* PASO 3: PASARELA DE PAGO SIMULADA */}
          {step === "payment" && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-black tracking-tight text-gray-900 leading-tight">
                  Pasarela de Pago
                </h1>
                <p className="mt-2 text-sm text-slate-500 font-semibold leading-relaxed">
                  Suscribite a publi Pro. Simulación sin cargo real.
                </p>
              </div>

              {/* CARD PREVIEW INTERACTIVO (Glassmorphism) */}
              <div className="perspective-1000 py-2">
                <div
                  className={`w-full max-w-[360px] h-[210px] mx-auto rounded-3xl p-6 text-white bg-gradient-to-br from-[#0d2a33] to-[#003b49] border border-white/10 shadow-2xl relative transition-transform duration-700 preserve-3d ${
                    cvvFocused ? "rotate-y-180" : ""
                  }`}
                >
                  {/* Front of card */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-between backface-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Crown className="h-5 w-5 text-[#ffb703] shrink-0" />
                        <span className="text-lg font-black tracking-tight">publi</span>
                      </div>
                      <CreditCard className="h-6 w-6 opacity-70 shrink-0" />
                    </div>

                    <div className="my-4">
                      {/* Chip */}
                      <div className="w-10 h-7 rounded bg-[#ffd700]/30 border border-[#ffd700]/40 mb-3" />
                      <p className="text-lg font-mono tracking-widest text-center">
                        {cardNumber || "•••• •••• •••• ••••"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-[8px] text-white/50 uppercase tracking-wider font-bold">Titular</p>
                        <p className="text-xs font-semibold truncate uppercase">
                          {cardHolder || "Juan Pérez"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[8px] text-white/50 uppercase tracking-wider font-bold">Expiración</p>
                        <p className="text-xs font-semibold">
                          {cardExpiry || "MM/AA"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Back of card */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#07161b] to-[#0b2229] border border-white/10 flex flex-col justify-between py-6 backface-hidden rotate-y-180">
                    <div className="w-full h-11 bg-black/60 mt-1" />
                    <div className="px-6 flex items-center justify-between gap-4">
                      <div className="flex-1 bg-white/10 h-8 rounded px-3 flex items-center justify-end text-xs font-mono italic">
                        {cardCvv || "•••"}
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] text-white/40 uppercase tracking-wider font-bold">Firma</p>
                        <div className="w-10 h-2 bg-primary/30 rounded" />
                      </div>
                    </div>
                    <p className="text-[7px] text-white/30 text-center px-6 leading-normal font-medium">
                      Simulación publi. No ingresar datos reales de tarjetas bancarias.
                    </p>
                  </div>
                </div>
              </div>

              {/* Formulario de Pago */}
              <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="card-number" className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Número de Tarjeta
                  </Label>
                  <Input
                    id="card-number"
                    type="text"
                    placeholder="4000 1234 5678 9010"
                    required
                    value={cardNumber}
                    onChange={onCardNumberChange}
                    className="h-11 rounded-xl border border-slate-200 bg-white/70 font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="card-holder" className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Titular de la Tarjeta
                  </Label>
                  <Input
                    id="card-holder"
                    type="text"
                    placeholder="COMO APARECE EN LA TARJETA"
                    required
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="h-11 rounded-xl border border-slate-200 bg-white/70 font-semibold uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="card-expiry" className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Expiración
                    </Label>
                    <Input
                      id="card-expiry"
                      type="text"
                      placeholder="MM/AA"
                      required
                      value={cardExpiry}
                      onChange={onExpiryChange}
                      className="h-11 rounded-xl border border-slate-200 bg-white/70 font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="card-cvv" className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      CVV
                    </Label>
                    <Input
                      id="card-cvv"
                      type="password"
                      placeholder="123"
                      required
                      value={cardCvv}
                      onChange={onCvvChange}
                      onFocus={() => setCvvFocused(true)}
                      onBlur={() => setCvvFocused(false)}
                      className="h-11 rounded-xl border border-slate-200 bg-white/70 font-semibold"
                    />
                  </div>
                </div>

                <div className="bg-[#ffb703]/10 border border-[#ffb703]/20 rounded-xl p-3 flex items-start gap-2.5">
                  <Info className="h-4.5 w-4.5 text-[#ffb703] shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-800 leading-normal font-semibold">
                    <strong>Aviso de Simulación:</strong> pubil-app no procesará ningún cobro bancario real. Es seguro completar el formulario con números de prueba.
                  </p>
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-between gap-4 pt-4">
                  <Button
                    type="button"
                    onClick={() => setStep("plan")}
                    variant="outline"
                    className="h-12 px-6 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 text-slate-600 cursor-pointer"
                  >
                    Atrás
                  </Button>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-12 flex-1 rounded-xl bg-gradient-to-r from-primary to-[#00b4d8] text-white font-bold hover:scale-[1.01] transition-all shadow-[0_8px_20px_-8px_rgba(0,149,182,0.6)] cursor-pointer border border-transparent"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{loadingPhase}</span>
                      </div>
                    ) : (
                      <span>Confirmar Pago $9.99/mes</span>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* Estilos CSS Inline de perspectiva y rotaciones 3D */}
      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </main>
  )
}
