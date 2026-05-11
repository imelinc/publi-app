import Link from "next/link"
import { type ReactNode } from "react"

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[hsl(var(--hero-background))] px-4 py-16">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -left-6 -top-6 h-32 w-32 rotate-12 rounded-2xl bg-primary/10" />
        <div className="absolute right-8 top-24 h-20 w-20 -rotate-6 rounded-xl bg-accent/15" />
        <div className="absolute left-12 bottom-28 h-16 w-16 rotate-[10deg] rounded-2xl bg-primary-light/30" />
        <div className="absolute -right-6 bottom-4 h-36 w-36 -rotate-12 rounded-2xl bg-primary/10" />
        <div className="absolute left-1/3 top-1/2 h-10 w-10 rotate-[20deg] rounded-md bg-accent/10" />
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight text-primary transition-opacity hover:opacity-80"
          >
            publi
          </Link>
        </div>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-10">
          {children}
        </div>
      </div>
    </main>
  )
}