"use client"

import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface WhyCard {
  icon: ReactNode
  title: string
  description: string
}

const cards: WhyCard[] = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" aria-hidden="true">
        <path d="M12 2l1.09 3.36L16.45 6l-2.72 2.18L14.54 12 12 9.82 9.46 12l.81-3.82L7.55 6l3.36-.64L12 2z" fill="#0095b6" />
        <path d="M5 16l.73 2.27L8 19l-2.27.73L5 22l-.73-2.27L2 19l2.27-.73L5 16z" fill="#0095b6" opacity="0.7" />
        <path d="M19 13l.55 1.7L21.25 15.25l-1.7.55L19 17.5l-.55-1.7-1.7-.55 1.7-.55L19 13z" fill="#0095b6" opacity="0.7" />
      </svg>
    ),
    title: "IA que trabaja por vos",
    description:
      "Generá copys, descubrí los mejores horarios y obtené hashtags optimizados automáticamente. publIA escribe, sugiere y aprende de tus resultados.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="#0095b6" strokeWidth="1.8" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="#0095b6" strokeWidth="1.8" strokeDasharray="2 1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="#0095b6" strokeWidth="1.8" strokeDasharray="2 1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="#0095b6" strokeWidth="1.8" />
        <line x1="10" y1="6.5" x2="14" y2="6.5" stroke="#0095b6" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="6.5" y1="10" x2="6.5" y2="14" stroke="#0095b6" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="17.5" y1="10" x2="17.5" y2="14" stroke="#0095b6" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="2 1.5" />
      </svg>
    ),
    title: "Todo en un solo lugar",
    description:
      "Dejá de saltar entre Meta Business Suite, Notion, planillas y WhatsApp. publi centraliza todo tu flujo de trabajo en una sola interfaz.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" aria-hidden="true">
        <rect x="3" y="4" width="18" height="17" rx="2" stroke="#0095b6" strokeWidth="1.8" />
        <line x1="3" y1="9" x2="21" y2="9" stroke="#0095b6" strokeWidth="1.8" />
        <line x1="8" y1="2" x2="8" y2="6" stroke="#0095b6" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="16" y1="2" x2="16" y2="6" stroke="#0095b6" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M8 14.5l2.5 2.5 5-5" stroke="#0095b6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Planificá con anticipación",
    description:
      "Programá publicaciones para todos tus clientes desde un calendario visual. Sin copiar y pegar, sin omisiones, sin urgencias de último momento.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" aria-hidden="true">
        <rect x="3" y="13" width="4" height="8" rx="1" stroke="#0095b6" strokeWidth="1.8" />
        <rect x="10" y="9" width="4" height="12" rx="1" stroke="#0095b6" strokeWidth="1.8" />
        <rect x="17" y="5" width="4" height="16" rx="1" stroke="#0095b6" strokeWidth="1.8" />
        <path d="M3 7l4-3 5 3 5-4" stroke="#0095b6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Métricas sin esfuerzo",
    description:
      "Accedé al rendimiento de todas las cuentas desde un solo dashboard. Generá reportes para tus clientes en minutos, no en horas.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" aria-hidden="true">
        <circle cx="9" cy="7" r="3" stroke="#0095b6" strokeWidth="1.8" />
        <circle cx="17" cy="8" r="2.2" stroke="#0095b6" strokeWidth="1.8" />
        <path d="M3 19c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#0095b6" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M17 13c2.21 0 4 1.79 4 4" stroke="#0095b6" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="2 1.5" />
      </svg>
    ),
    title: "Cambiá de cliente sin errores",
    description:
      "Un workspace por cliente. Contexto claro, cambio deliberado. Nunca más publicar el contenido de un cliente en la cuenta de otro.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" aria-hidden="true">
        <path
          d="M12 3L4 6.5v5c0 4.418 3.359 8.548 8 9.5 4.641-.952 8-5.082 8-9.5v-5L12 3z"
          stroke="#0095b6"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M8.5 12l2.5 2.5 4.5-4.5"
          stroke="#0095b6"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: "Más que Meta Business Suite",
    description:
      "publi soporta Instagram, TikTok, LinkedIn, X y más. Sin caídas del servicio, sin curva de aprendizaje interminable.",
  },
]

export function WhySection() {
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
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="py-20 bg-background">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div
          className={cn(
            "text-center mb-12 transition-all duration-500",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            ¿Por qué elegir publi?
          </h2>
          <p className="text-[16px] text-muted-foreground max-w-2xl mx-auto">
            IA integrada, gestión centralizada y herramientas pensadas para Community Managers que quieren escalar sin caos.
          </p>
        </div>

        {/* Cards grid — 2 cols desktop, 1 mobile. 5 cards: last one centered */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cards.map((card, i) => (
            <div
              key={card.title}
              className={cn(
                "group bg-white border border-border rounded-2xl p-6",
                "border-l-[3px] border-l-border",
                i === 0 ? "border-l-primary bg-gradient-to-br from-primary/5 to-transparent" : "",
                "hover:border-l-primary hover:shadow-md",
                "transition-all duration-200",
                i === cards.length - 1 && "md:col-span-2 md:max-w-[calc(50%-10px)] md:mx-auto",
                // Entrance animation
                "transition-[opacity,transform] duration-500",
                visible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: `${100 + i * 80}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary-light/50 flex items-center justify-center mb-4">
                {card.icon}
              </div>
              <h3 className="text-[16px] font-bold text-foreground mb-2">
                {card.title}
              </h3>
              <p className="text-[14px] text-muted-foreground leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
