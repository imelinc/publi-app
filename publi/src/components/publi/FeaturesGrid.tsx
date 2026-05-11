import Link from "next/link";

import { FloatingSquares } from "@/components/publi/FloatingSquares";
import { Reveal } from "@/components/publi/Reveal";

interface FeatureCard {
  title: string;
  description: string;
  align: "left" | "right";
  iconSrc: string;
  badge?: string;
}

const featureCards: FeatureCard[] = [
  {
    title: "Asistente de IA",
    description:
      "Generá copys persuasivos, descubrí el mejor horario para publicar y obtené hashtags optimizados con un solo click. Tu contenido, potenciado por inteligencia artificial.",
    align: "left",
    iconSrc: "/ai-icon.svg",
  },
  {
    title: "Programación",
    description:
      "Planificá y programá tu contenido con una interfaz visual e intuitiva. Automatizá la publicación y olvidate de hacerlo a mano.",
    align: "right",
    iconSrc: "/schedule.svg",
  },
  {
    title: "Gestión de clientes",
    description:
      "Un workspace dedicado por cliente. Cambiá de contexto de forma clara y deliberada. Sin errores, sin confusiones.",
    align: "left",
    iconSrc: "/clients.svg",
  },
  {
    title: "Analytics",
    description:
      "Accedé a métricas claras y accionables sobre el rendimiento de cada cuenta. Generá reportes para tus clientes en minutos.",
    align: "right",
    iconSrc: "/analytics.svg",
    badge: "Próximamente",
  },
  {
    title: "Colaboración",
    description:
      "Invitá a tu equipo, compartí borradores con clientes y gestioná aprobaciones antes de publicar.",
    align: "left",
    iconSrc: "/collaboration.svg",
    badge: "Próximamente",
  },
] as const;

export function FeaturesGrid() {
  return (
    <section className="relative overflow-hidden bg-[hsl(var(--hero-background))] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <FloatingSquares
        squares={[
          {
            className:
              "right-4 top-8 h-16 w-16 bg-accent/50 md:right-12 md:h-24 md:w-24",
          },
          {
            className:
              "left-4 top-24 h-6 w-6 bg-primary/45 md:left-10 md:h-10 md:w-10",
          },
          {
            className:
              "left-20 bottom-28 h-7 w-7 bg-primary-light/75 md:left-24 md:h-12 md:w-12",
          },
          {
            className:
              "bottom-10 right-10 h-12 w-12 bg-primary/50 md:h-16 md:w-16",
          },
        ]}
      />

      <div className="relative mx-auto max-w-7xl">
        <Reveal className="max-w-3xl">
          <h2 className="text-4xl font-bold tracking-[-0.03em] text-foreground sm:text-5xl">
            Funcionalidades poderosas, fáciles de usar
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
            Construí tu presencia digital, generá resultados y escalá tu
            cartera de clientes.
          </p>
        </Reveal>

        <div className="mt-16 space-y-10 lg:space-y-16">
          {featureCards.map((feature, index) => (
            <div
              key={feature.title}
              className={`grid items-center gap-8 lg:grid-cols-2 ${
                feature.align === "right" ? "lg:[&>*:first-child]:order-2" : ""
              }`}
            >
              <Reveal delayMs={index * 80}>
                <div className="rounded-[34px] border border-white/70 bg-white p-8 shadow-[0_22px_70px_-48px_rgba(8,24,38,0.4)] sm:p-10">
                  <div className="mb-8 flex h-36 items-center justify-center rounded-[28px] bg-[linear-gradient(180deg,rgba(245,240,232,0.4),rgba(204,238,245,0.15))]">
                    <img
                      src={feature.iconSrc}
                      alt={feature.title}
                      width={112}
                      height={112}
                      className="h-28 w-28 object-contain"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-3xl font-semibold tracking-[-0.02em] text-foreground">
                      {feature.title}
                    </h3>
                    {feature.badge ? (
                      <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-foreground">
                        {feature.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-4 max-w-md text-base leading-8 text-muted-foreground">
                    {feature.description}
                  </p>
                  <Link
                    href="#funcionalidades"
                    className="mt-6 inline-flex text-sm font-semibold text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
                  >
                    Ver todas las funcionalidades →
                  </Link>
                </div>
              </Reveal>

              <div className="relative hidden min-h-[120px] lg:block">
                <div className="absolute left-8 top-10 h-12 w-12 bg-primary-light/70" />
                <div className="absolute left-20 top-24 h-10 w-10 bg-primary/45" />
                <div className="absolute left-36 top-4 h-14 w-14 bg-accent/50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
