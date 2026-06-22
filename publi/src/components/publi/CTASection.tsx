"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface CTASectionProps {
  isLoggedIn?: boolean;
}

export function CTASection({ isLoggedIn = false }: CTASectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-28"
      style={{ backgroundColor: "#0f2a33" }}
    >
      {/* Geometric decorations */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        {/* Top-left */}
        <div
          className="absolute -top-8 -left-8 w-40 h-40 rounded-2xl rotate-12"
          style={{ backgroundColor: "#0095b6", opacity: 0.3 }}
        />
        <div
          className="absolute top-16 left-12 w-16 h-16 rounded-xl -rotate-6"
          style={{ backgroundColor: "#ffb703", opacity: 0.3 }}
        />
        {/* Top-right */}
        <div
          className="absolute -top-6 -right-10 w-32 h-32 rounded-2xl -rotate-12"
          style={{ backgroundColor: "#cceef5", opacity: 0.3 }}
        />
        <div
          className="absolute top-20 right-16 w-20 h-20 rounded-xl rotate-6"
          style={{ backgroundColor: "#0095b6", opacity: 0.3 }}
        />
        {/* Bottom-left */}
        <div
          className="absolute -bottom-10 -left-6 w-36 h-36 rounded-2xl -rotate-6"
          style={{ backgroundColor: "#cceef5", opacity: 0.3 }}
        />
        {/* Bottom-right */}
        <div
          className="absolute -bottom-8 -right-8 w-44 h-44 rounded-2xl rotate-12"
          style={{ backgroundColor: "#ffb703", opacity: 0.3 }}
        />
        <div
          className="absolute bottom-16 right-20 w-14 h-14 rounded-lg -rotate-12"
          style={{ backgroundColor: "#0095b6", opacity: 0.3 }}
        />
      </div>

      {/* Content */}
      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <h2
          className={cn(
            "text-[40px] md:text-[48px] font-bold text-white leading-tight mb-5",
            "transition-all duration-600",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
          style={{ transitionDelay: "0ms" }}
        >
          Empezá a gestionar tus redes<br />
          con IA, como un profesional.
        </h2>

        <p
          className={cn(
            "text-[16px] mb-10 transition-all duration-500",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
          style={{ color: "#cceef5", transitionDelay: "120ms" }}
        >
          Empezá a gestionar tus redes con publi. Sin tarjeta de crédito. Sin límites.
        </p>

        <div
          className={cn(
            "flex flex-col sm:flex-row items-center justify-center gap-4 mb-6",
            "transition-all duration-500",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
          style={{ transitionDelay: "220ms" }}
        >
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-bold text-[15px] transition-opacity duration-150 hover:opacity-90"
              style={{ backgroundColor: "#ffb703", color: "#1a1a2e" }}
            >
              Ir al dashboard →
            </Link>
          ) : (
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-bold text-[15px] transition-opacity duration-150 hover:opacity-90"
              style={{ backgroundColor: "#ffb703", color: "#1a1a2e" }}
            >
              Empezar gratis →
            </Link>
          )}
          <a
            href="#"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-medium text-[15px] border border-white text-white transition-colors duration-150 hover:bg-white/10"
          >
            Ver funcionalidades
          </a>
        </div>

        <p
          className={cn(
            "text-[13px] transition-all duration-500",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
          style={{ color: "rgba(204, 238, 245, 0.6)", transitionDelay: "320ms" }}
        >
          Ya se suman más de 500 Community Managers
        </p>
      </div>
    </section>
  )
}
