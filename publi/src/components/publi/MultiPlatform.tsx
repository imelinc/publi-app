"use client";

import { cn } from "@/lib/utils";
import { FloatingSquares } from "@/components/publi/FloatingSquares";
import { Reveal } from "@/components/publi/Reveal";

interface Platform {
  name: string;
  iconSrc: string;
  color: string;
  handle: string;
}

const platforms: Platform[] = [
  { name: "Instagram", iconSrc: "/icons/instagram-color.svg", color: "from-[#f09433]/10 via-[#e6683c]/10 to-[#bc1888]/10", handle: "@cliente.ok" },
  { name: "Facebook", iconSrc: "/icons/facebook-color.svg", color: "from-[#1877F2]/10 to-[#1877F2]/5", handle: "@cliente.ok" },
  { name: "TikTok", iconSrc: "/icons/tiktok-color.svg", color: "from-[#111111]/10 to-[#25F4EE]/10", handle: "@cliente.ok" },
  { name: "LinkedIn", iconSrc: "/icons/linkedin-color.svg", color: "from-[#0A66C2]/10 to-[#0A66C2]/5", handle: "/in/cliente-ok" },
  { name: "X", iconSrc: "/icons/twitter-color.svg", color: "from-black/10 to-[#1DA1F2]/10", handle: "@cliente_ok" },
  { name: "YouTube", iconSrc: "/icons/yt-color.svg", color: "from-[#FF0000]/10 to-[#FF0000]/5", handle: "@clienteok" },
  { name: "Threads", iconSrc: "/icons/threads-color.svg", color: "from-[#000000]/10 to-[#000000]/5", handle: "@cliente.ok" },
  { name: "Pinterest", iconSrc: "/icons/pinterest-color.svg", color: "from-[#E60023]/10 to-[#E60023]/5", handle: "@clienteok" },
];

export function MultiPlatform() {
  return (
    <section
      id="recursos"
      className="relative overflow-hidden bg-[hsl(var(--hero-background))] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <FloatingSquares
        squares={[
          {
            className:
              "left-10 top-8 h-8 w-8 rotate-6 bg-primary-light/70 md:h-12 md:w-12",
          },
          {
            className:
              "right-6 top-6 h-16 w-16 bg-accent/50 md:right-12 md:h-20 md:w-20",
          },
          {
            className:
              "left-20 bottom-16 h-6 w-6 bg-primary/45 md:left-28 md:h-10 md:w-10",
          },
          {
            className:
              "bottom-10 right-24 h-10 w-10 -rotate-6 bg-primary-light/55 md:h-14 md:w-14",
          },
        ]}
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Multi-plataforma
              </span>
            </Reveal>

            <Reveal delayMs={60}>
              <h2 className="mt-5 text-4xl font-bold tracking-[-0.03em] text-foreground sm:text-5xl">
                Todas las redes,
                <br />
                <span className="text-primary">un solo dashboard.</span>
              </h2>
            </Reveal>

            <Reveal delayMs={120}>
              <p className="mt-5 max-w-lg text-base leading-8 text-muted-foreground sm:text-lg">
                Gestioná todas tus cuentas desde un único lugar. publi soporta
                las redes que tus clientes realmente usan.
              </p>
            </Reveal>

            <Reveal delayMs={180}>
              <div className="mt-8 flex flex-col gap-4">
                <StatLine value="8+" label="plataformas integradas" />
                <StatLine value="∞" label="cuentas por plataforma" />
                <StatLine value="+3" label="plataformas en camino" />
              </div>
            </Reveal>
          </div>

          <Reveal delayMs={100}>
            <div className="rounded-[32px] border border-primary/10 bg-white/80 p-4 shadow-[0_24px_70px_-48px_rgba(10,31,47,0.35)] backdrop-blur">
              <div className="flex items-center justify-between border-b border-border/60 pb-3 pl-2">
                <p className="text-sm font-semibold text-foreground">Cuentas conectadas</p>
                <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
                  8 activas
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2.5">
                {platforms.map((platform, index) => (
                  <PlatformCard key={platform.name} platform={platform} index={index} />
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function PlatformCard({ platform, index }: { platform: Platform; index: number }) {
  return (
    <Reveal delayMs={140 + index * 40}>
      <div
        className={cn(
          "group flex items-center gap-3 rounded-[20px] border border-border/50 bg-gradient-to-br p-3.5 transition-all duration-200 hover:scale-[1.03] hover:shadow-md hover:border-primary/30",
          platform.color,
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-border/40 transition-transform duration-200 group-hover:scale-110">
          <img
            src={platform.iconSrc}
            alt={platform.name}
            width={22}
            height={22}
            className="h-[22px] w-[22px] object-contain"
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{platform.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">{platform.handle}</p>
        </div>
        <div className="ml-auto flex shrink-0">
          <span className="h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-green-400/30" />
        </div>
      </div>
    </Reveal>
  );
}

function StatLine({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">
        {value}
      </span>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
