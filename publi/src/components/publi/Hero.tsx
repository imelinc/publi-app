import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  PenLine,
  Play,
  Settings,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/publi/Reveal";
import { cn } from "@/lib/utils";

const socialPlatforms = [
  { name: "Instagram", iconSrc: "/icons/instagram.svg" },
  { name: "Facebook", iconSrc: "/icons/facebook.svg" },
  { name: "TikTok", iconSrc: "/icons/tiktok.svg" },
  { name: "LinkedIn", iconSrc: "/icons/linkedin.svg" },
  { name: "X", iconSrc: "/icons/twitter.svg" },
  { name: "YouTube", iconSrc: "/icons/youtube.svg" },
  { name: "Pinterest", iconSrc: "/icons/pinterest.svg" },
  { name: "Threads", iconSrc: "/icons/theads.svg" },
];

const avatarStack = [
  { initials: "AR", bg: "bg-primary" },
  { initials: "LM", bg: "bg-[#E1306C]" },
  { initials: "SV", bg: "bg-[#0A66C2]" },
  { initials: "KP", bg: "bg-[#25D366]" },
  { initials: "MT", bg: "bg-[#7C3AED]" },
];

const mockupStats = [
  { label: "Publicaciones", value: "148" },
  { label: "Engagement", value: "4.2%" },
  { label: "Cuentas", value: "12" },
];

const mockupPosts = [
  { title: "Campaña primavera", time: "Hoy 18:00", image: "/images/restaurant.jpg" },
  { title: "Behind the scenes", time: "Mañana 10:00", image: "/images/edificio.jpg" },
  { title: "Caso de éxito", time: "Vie 14:30", image: "/images/bicicleta.jpg" },
];

const sidebarItems: ReadonlyArray<{ icon: typeof LayoutDashboard; active: boolean }> = [
  { icon: LayoutDashboard, active: true },
  { icon: CalendarDays, active: false },
  { icon: PenLine, active: false },
  { icon: Users, active: false },
  { icon: BarChart3, active: false },
  { icon: Settings, active: false },
];

interface HeroProps {
  isLoggedIn?: boolean;
}

export function Hero({ isLoggedIn = false }: HeroProps) {
  const marqueeItems = [...socialPlatforms, ...socialPlatforms];

  return (
    <section
      id="inicio"
      className="overflow-hidden bg-[hsl(var(--hero-background))] px-4 pb-20 pt-32 sm:px-6 sm:pt-36 lg:px-8 lg:pb-28 lg:pt-40"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
        <div className="max-w-2xl">
          <Reveal delayMs={60}>
            <h1 className="mt-6 text-5xl font-bold leading-[0.95] tracking-[-0.04em] text-foreground sm:text-6xl lg:text-[4.35rem]">
              <span className="block">Centralizá tus clientes.</span>
              <span className="block text-primary">Programá en segundos.</span>
              <span className="block">Con IA, mostrá resultados.</span>
            </h1>
          </Reveal>

          <Reveal delayMs={120}>
            <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
              La plataforma con IA que unifica la planificación, publicación y
              seguimiento de todas tus cuentas y clientes. Copys, horarios y
              hashtags optimizados automáticamente.
            </p>
          </Reveal>

          <Reveal delayMs={180}>
            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {isLoggedIn ? (
                <Button
                  asChild
                  size="lg"
                  className="h-14 rounded-full px-7 text-base font-semibold shadow-[0_22px_50px_-28px_hsl(var(--primary)/0.9)] hover:bg-primary/90"
                >
                  <Link href="/dashboard">
                    Ir al dashboard
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  size="lg"
                  className="h-14 rounded-full px-7 text-base font-semibold shadow-[0_22px_50px_-28px_hsl(var(--primary)/0.9)] hover:bg-primary/90"
                >
                  <Link href="/register">
                    Empezar gratis
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              )}
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-14 rounded-full border-border/60 px-7 text-base font-semibold text-foreground hover:bg-white/60"
              >
                <Link href="#funcionalidades">
                  <Play className="size-4" />
                  Ver cómo funciona
                </Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delayMs={240}>
            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-2">
                {avatarStack.map((avatar) => (
                  <div
                    key={avatar.initials}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border-2 border-background text-[10px] font-bold text-white",
                      avatar.bg,
                    )}
                  >
                    {avatar.initials}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  500+ CMs ya confían en publi
                </p>
                <p className="text-xs text-muted-foreground">
                  Sin tarjeta de crédito · Plan Free disponible
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="relative hidden lg:block">
          <div className="absolute -right-8 top-12 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute -bottom-4 -left-8 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute left-1/2 top-0 h-32 w-32 -translate-x-1/2 rounded-full bg-primary-light/30 blur-3xl" />

          <Reveal delayMs={150}>
            <div className="relative">
              <div className="rounded-[28px] border border-primary/15 bg-white p-2 shadow-[0_32px_80px_-24px_rgba(6,29,41,0.45)]">
                <div className="overflow-hidden rounded-[22px]">
                  <div className="flex items-center gap-3 border-b border-border/50 bg-[hsl(var(--surface))] px-4 py-2.5">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-accent/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-primary-light" />
                    </div>
                    <div className="flex flex-1 justify-center">
                      <div className="rounded-md bg-white px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm ring-1 ring-border/40">
                        app.publi.io/dashboard
                      </div>
                    </div>
                  </div>

                  <div className="flex bg-white">
                    <div className="flex w-12 flex-col items-center gap-1 border-r border-border/40 bg-[hsl(var(--surface))] py-3">
                      {sidebarItems.map((item, i) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={i}
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
                              item.active
                                ? "bg-primary text-white"
                                : "text-muted-foreground hover:bg-white",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex-1 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Buenos días, Lucía 👋
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Tenés 5 publicaciones programadas
                          </p>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                          L
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {mockupStats.map((stat) => (
                          <div
                            key={stat.label}
                            className="rounded-2xl bg-[hsl(var(--surface))] p-3 transition-all duration-200 hover:bg-primary-light/40"
                          >
                            <p className="text-lg font-bold text-foreground">
                              {stat.value}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {stat.label}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4">
                        <p className="text-xs font-semibold text-foreground">
                          Próximas publicaciones
                        </p>
                        <div className="mt-2 space-y-2">
                          {mockupPosts.map((post) => (
                            <div
                              key={post.title}
                              className="group flex items-center gap-2.5 rounded-2xl border border-border/50 p-2 transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
                            >
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl">
                                <Image
                                  src={post.image}
                                  alt={post.title}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 object-cover"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[11px] font-semibold text-foreground">
                                  {post.title}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {post.time}
                                </p>
                              </div>
                              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary">
                                Prog.
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="absolute -right-4 top-20 rounded-2xl border border-border/50 bg-white px-3 py-2 shadow-lg animate-bounce"
                style={{ animationDuration: "3s" }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-foreground">
                      Publicado en IG
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      Hace 2 min
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="absolute -left-6 bottom-24 rounded-2xl border border-border/50 bg-white px-3 py-2 shadow-lg animate-bounce"
                style={{ animationDuration: "3.5s", animationDelay: "1s" }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 text-[11px]">
                    📈
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-foreground">
                      +24% engagement
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      Esta semana
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="absolute -left-4 top-4 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary to-[#005f78] px-3 py-2 shadow-lg animate-bounce"
                style={{ animationDuration: "4s", animationDelay: "2s" }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-[11px]">
                    ✨
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-white">
                      Copy generado por IA
                    </p>
                    <p className="text-[9px] text-white/70">
                      Mejor horario: 18:30
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
