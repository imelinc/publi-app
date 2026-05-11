import Link from "next/link"
import { AuthLayout } from "@/components/publi/AuthLayout"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
    >
      <path
        d="M21.8 12.23c0-.71-.06-1.22-.19-1.75H12v3.44h5.64c-.11.86-.71 2.15-2.04 3.02l-.02.12 2.75 2.13.19.02c1.8-1.66 2.83-4.09 2.83-6.98Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.76 0 5.08-.91 6.77-2.48l-3.22-2.49c-.86.6-2 1.01-3.55 1.01a6.15 6.15 0 0 1-5.82-4.25l-.11.01-2.86 2.21-.04.1A10.23 10.23 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.18 13.79A6.18 6.18 0 0 1 5.83 12c0-.62.13-1.22.34-1.79l-.01-.12-2.9-2.24-.1.04A10.22 10.22 0 0 0 2 12c0 1.64.39 3.19 1.08 4.56l3.1-2.77Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.96c1.96 0 3.28.84 4.03 1.55l2.94-2.87C17.07 2.9 14.76 2 12 2a10.23 10.23 0 0 0-8.84 4.89l3.01 2.32A6.18 6.18 0 0 1 12 5.96Z"
        fill="#EA4335"
      />
    </svg>
  )
}

export default function LoginPage() {
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

      <form className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="tu@email.com"
            autoComplete="email"
            required
            className="h-11 px-4"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link
              href="#"
              className="text-xs font-medium text-primary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
            className="h-11 px-4"
          />
        </div>

        <Button asChild className="mt-2 h-11 w-full text-[15px] font-semibold">
          <Link href="/dashboard">Ingresar</Link>
        </Button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-4 text-xs text-muted-foreground">
            o continuá con
          </span>
        </div>
      </div>

      <button
        type="button"
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <GoogleIcon />
        <span>Continuar con Google</span>
      </button>

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