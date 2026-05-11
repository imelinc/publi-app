"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { DemoCursor } from "@/components/publi/DemoCursor";
import { FloatingSquares } from "@/components/publi/FloatingSquares";
import { Reveal } from "@/components/publi/Reveal";

type TabId =
  | "crear-publicacion"
  | "asistente-ia"
  | "calendario-mensual"
  | "calendario-semanal"
  | "vista-publicaciones"
  | "cuentas-conectadas";

interface FeatureTab {
  id: TabId;
  label: string;
  icon: ReactNode;
}

const tabs: FeatureTab[] = [
  {
    id: "crear-publicacion",
    label: "Crear publicación",
    icon: <ComposeIcon />,
  },
  {
    id: "asistente-ia",
    label: "Asistente IA",
    icon: <AIIcon />,
  },
  {
    id: "calendario-mensual",
    label: "Calendario mensual",
    icon: <MonthIcon />,
  },
  {
    id: "calendario-semanal",
    label: "Calendario semanal",
    icon: <WeekIcon />,
  },
  {
    id: "vista-publicaciones",
    label: "Vista de publicaciones",
    icon: <PostsIcon />,
  },
  {
    id: "cuentas-conectadas",
    label: "Cuentas conectadas",
    icon: <AccountsIcon />,
  },
];

export function FeatureTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("crear-publicacion");

  return (
    <section
      id="funcionalidades"
      className="relative overflow-hidden bg-[hsl(var(--hero-background))] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <FloatingSquares
        squares={[
          {
            className:
              "left-4 top-10 h-10 w-10 -rotate-6 bg-primary/50 md:left-10 md:h-14 md:w-14",
          },
          {
            className:
              "right-8 top-16 h-8 w-8 rotate-6 bg-primary-light/75 md:h-12 md:w-12",
          },
          {
            className:
              "bottom-10 left-14 h-12 w-12 bg-accent/45 md:bottom-14 md:left-24 md:h-20 md:w-20",
          },
          {
            className:
              "right-16 bottom-16 h-6 w-6 -rotate-3 bg-primary/45 md:h-10 md:w-10",
          },
        ]}
      />

      <div className="relative mx-auto max-w-7xl">
        <Reveal className="max-w-3xl">
          <h2 className="text-4xl font-bold tracking-[-0.03em] text-foreground sm:text-5xl">
            Construido para el CM que exige control
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
            Una interfaz potente e intuitiva, diseñada para gestionar todo
            desde un solo lugar.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
          <Reveal>
            <div className="overflow-hidden rounded-[32px] border border-primary/10 bg-white/70 p-3 shadow-[0_18px_60px_-45px_rgba(8,24,38,0.4)] backdrop-blur">
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const isActive = tab.id === activeTab;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl border-l-[3px] px-4 py-4 text-left transition-all",
                        isActive
                          ? "border-primary bg-primary-light/80 text-primary shadow-sm"
                          : "border-transparent text-muted-foreground hover:bg-white/70 hover:text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-2xl",
                          isActive ? "bg-white text-primary" : "bg-primary/5 text-foreground/75",
                        )}
                      >
                        {tab.icon}
                      </span>
                      <span className="text-sm font-semibold sm:text-base">
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Reveal>

          <Reveal delayMs={120}>
            <DemoCursor className="relative rounded-[32px] border border-primary/15 bg-white p-2.5 shadow-[0_28px_80px_-48px_rgba(6,29,41,0.55)]">
              <div className="rounded-[22px] bg-gradient-to-br from-primary via-primary to-[#005f78] p-1.5">
                <div className="overflow-hidden rounded-[16px] bg-white">
                  <div className="flex items-center justify-between border-b border-border/70 px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#ff6b6b]" />
                      <span className="h-3 w-3 rounded-full bg-accent/80" />
                      <span className="h-3 w-3 rounded-full bg-primary-light" />
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      publi workspace
                    </span>
                  </div>
                  <div className="min-h-[420px] bg-[linear-gradient(180deg,rgba(204,238,245,0.25),rgba(255,255,255,1))] p-5 sm:p-7">
                    {activeTab === "crear-publicacion" && <CreatePostPreview />}
                    {activeTab === "asistente-ia" && <AIAssistantPreview />}
                    {activeTab === "calendario-mensual" && <MonthlyCalendarPreview />}
                    {activeTab === "calendario-semanal" && <WeeklyCalendarPreview />}
                    {activeTab === "vista-publicaciones" && <PostsOverviewPreview />}
                    {activeTab === "cuentas-conectadas" && <ConnectedAccountsPreview />}
                  </div>
                </div>
              </div>
            </DemoCursor>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function CreatePostPreview() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-border/70 transition-all duration-200 hover:ring-primary/30 hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Nuevo borrador</p>
            <p className="text-xs text-muted-foreground">
              Preparado para Instagram, LinkedIn y X
            </p>
          </div>
          <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-foreground">
            Hoy 18:30
          </span>
        </div>

        <div className="mt-5 rounded-[24px] border border-border/80 bg-[hsl(var(--hero-background))] p-4 transition-all duration-200 hover:border-primary/40">
          <p className="text-sm leading-7 text-foreground/80">
            Presentamos la nueva agenda de contenidos para abril. Esta semana
            vamos a mostrar behind the scenes, resultados de clientes y una
            promo exclusiva para stories.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <SocialPill label="Instagram" color="bg-[#E1306C]" />
          <SocialPill label="Facebook" color="bg-[#1877F2]" />
          <SocialPill label="TikTok" color="bg-[#111111]" />
          <SocialPill label="LinkedIn" color="bg-[#0A66C2]" />
        </div>

        <div className="mt-6 flex items-center justify-between rounded-[24px] border border-border/70 bg-white px-4 py-3 transition-all duration-200 hover:border-primary/30">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Acciones
            </p>
            <p className="text-sm font-medium text-foreground">
              Programar, guardar o publicar ahora
            </p>
          </div>
          <button
            type="button"
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:scale-105 hover:bg-primary/90 hover:shadow-md active:scale-100"
          >
            Publicar
          </button>
        </div>
      </div>

      <div className="rounded-[28px] bg-white/80 p-5 shadow-sm ring-1 ring-border/70 transition-all duration-200 hover:shadow-md hover:ring-primary/30">
        <p className="text-sm font-semibold text-foreground">Vista previa</p>
        <div className="mt-4 rounded-[28px] border border-border/70 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary-light" />
            <div>
              <p className="text-sm font-semibold text-foreground">@cliente.activo</p>
              <p className="text-xs text-muted-foreground">Instagram preview</p>
            </div>
          </div>
          <div className="mt-4 h-40 rounded-[22px] bg-[linear-gradient(135deg,rgba(0,149,182,0.18),rgba(255,183,3,0.3))]" />
          <p className="mt-4 text-sm leading-7 text-foreground/75">
            Una sola plataforma para publicar, ordenar y mostrar resultados con
            claridad a cada cliente.
          </p>
        </div>
      </div>
    </div>
  );
}

interface CalendarPost {
  caption: string;
  hashtags: string[];
  time: string;
  account: string;
  imageSrc: string;
}

const calendarPosts: Record<number, CalendarPost> = {
  3: { caption: "Nuevo latte de temporada ☕ Pruebalo esta semana en todas nuestras sucursales.", hashtags: ["#starbucks", "#nuevolatte", "#primavera"], time: "10:00", account: "@starbucks_ar", imageSrc: "/images/starbucks.webp" },
  8: { caption: "Recorriendo la ciudad en dos ruedas 🚴‍♂️ Cada pedal es un paso más cerca de tu mejor versión.", hashtags: ["#bicicleta", "#ciclismo", "#vidasana"], time: "14:30", account: "@urbike.ar", imageSrc: "/images/bicicleta.jpg" },
  14: { caption: "Arquitectura que cuenta historias 🏙️ Cada edificio tiene algo que decir si sabés dónde mirar.", hashtags: ["#arquitectura", "#edificio", "#cityscape"], time: "18:00", account: "@arq.matters", imageSrc: "/images/edificio.jpg" },
  19: { caption: "Mañana serena junto al canal 🌊 Los mejores momentos son los que no planeás.", hashtags: ["#paisaje", "#canal", "#naturaleza"], time: "09:00", account: "@travel_diary", imageSrc: "/images/paisaje_canal.jpg" },
  24: { caption: "Cena perfecta en nuestro spot favorito 🍝 La buena comida junta a la buena gente.", hashtags: ["#restaurant", "#gourmet", "#foodie"], time: "20:00", account: "@foodie.ar", imageSrc: "/images/restaurant.jpg" },
  29: { caption: "El subte: la arteria de la ciudad 🚇 Millones de historias pasan por acá todos los días.", hashtags: ["#subte", "#buenosaires", "#urbanlife"], time: "12:00", account: "@ba.nostalgia", imageSrc: "/images/subte.jpg" },
  34: { caption: "Desde las alturas todo cambia de perspectiva ✈️ Próximo destino: lo desconocido.", hashtags: ["#avion", "#viaje", "#desdeelarriba"], time: "16:00", account: "@travel_diary", imageSrc: "/images/avion.jpg" },
};

function MonthlyCalendarPreview() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const days = Array.from({ length: 35 }, (_, index) => index + 1);
  const highlighted = new Set(Object.keys(calendarPosts).map(Number));
  const selectedPost = selectedDay !== null ? calendarPosts[selectedDay] : null;

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Calendario de abril</p>
          <p className="text-xs text-muted-foreground">
            Vista general con entregables y aprobaciones
          </p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-foreground shadow-sm ring-1 ring-border/60">
            Mensual
          </span>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            12 publicaciones
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-3">
        {["L", "M", "X", "J", "V", "S", "D"].map((label) => (
          <div key={label} className="text-center text-xs font-semibold uppercase text-muted-foreground">
            {label}
          </div>
        ))}
        {days.map((day) => {
          const hasPost = highlighted.has(day);
          const post = calendarPosts[day];
          const isSelected = selectedDay === day;

          return (
            <button
              key={day}
              type="button"
              onClick={() => {
                if (hasPost) {
                  setSelectedDay(isSelected ? null : day);
                }
              }}
              className={cn(
                "rounded-[22px] border p-2 text-left text-sm shadow-sm transition-all duration-200",
                hasPost && "cursor-pointer hover:z-10 hover:border-accent/60 hover:shadow-md active:scale-[0.97]",
                hasPost && isSelected && "z-20 border-primary/50 bg-primary-light/40 shadow-lg ring-2 ring-primary/30",
                hasPost && !isSelected && "border-accent/30 bg-accent/20 text-foreground",
                !hasPost && "border-border/70 bg-white text-foreground/75",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{day <= 30 ? day : day - 30}</span>
                {hasPost ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                ) : null}
              </div>

              {hasPost && post ? (
                <>
                  <div className="mt-2 overflow-hidden rounded-xl">
                    <img
                      src={post.imageSrc}
                      alt={post.caption}
                      width={120}
                      height={60}
                      className="h-8 w-full object-cover"
                    />
                  </div>
                  <p className="mt-1 truncate text-[10px] leading-tight text-muted-foreground">
                    {post.caption}
                  </p>
                </>
              ) : (
                <div className="mt-4 h-6 rounded-full bg-primary/5" />
              )}
            </button>
          );
        })}
      </div>

      {selectedDay !== null && selectedPost && (
        <PostPreviewPopover
          post={selectedPost}
          day={selectedDay <= 30 ? selectedDay : selectedDay - 30}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}

function PostPreviewPopover({
  post,
  day,
  onClose,
}: {
  post: CalendarPost;
  day: number;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-[2px] rounded-[24px]">
      <div className="relative w-[280px] rounded-[24px] border border-border/70 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-xs text-white transition-colors hover:bg-black/60"
        >
          ✕
        </button>

        <div className="overflow-hidden rounded-t-[24px]">
          <img
            src={post.imageSrc}
            alt={post.caption}
            width={280}
            height={200}
            className="h-36 w-full object-cover"
          />
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary-light" />
            <div>
              <p className="text-xs font-semibold text-foreground">{post.account}</p>
              <p className="text-[10px] text-muted-foreground">{post.time} · {day} de abril</p>
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-foreground/80">
            {post.caption}
          </p>

          <p className="mt-2 text-[11px] font-medium leading-relaxed text-primary">
            {post.hashtags.join(" ")}
          </p>

          <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
              Programado
            </span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {post.time}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeeklyCalendarPreview() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Semana 15</p>
          <p className="text-xs text-muted-foreground">
            Contenido distribuido por día y cuenta
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          7 columnas
        </span>
      </div>
      <div className="mt-6 grid gap-3 lg:grid-cols-7">
        {["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"].map((day, index) => (
          <div key={day} className="rounded-[24px] border border-border/70 bg-white p-3 shadow-sm transition-all duration-200 hover:scale-[1.03] hover:shadow-md hover:border-primary/30">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {day}
            </p>
            <div
              className={cn(
                "mt-4 rounded-[20px] p-3 text-sm font-medium transition-all duration-200 hover:brightness-110",
                index % 3 === 0 && "bg-primary-light/65 text-primary",
                index % 3 === 1 && "bg-accent/20 text-foreground",
                index % 3 === 2 && "bg-primary/10 text-foreground",
              )}
            >
              Reel cliente
            </div>
            <div className="mt-3 rounded-[20px] bg-[hsl(var(--hero-background))] p-3 text-sm text-foreground/70 transition-all duration-200 hover:bg-primary-light/30">
              Story promo
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PostsOverviewPreview() {
  const posts = [
    { title: "Lanzamiento de campaña", status: "programado", tone: "bg-primary/10 text-primary" },
    { title: "Caso de éxito abril", status: "publicado", tone: "bg-primary-light/70 text-foreground" },
    { title: "Ideas para stories", status: "borrador", tone: "bg-accent/20 text-foreground" },
  ];

  return (
    <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-border/70">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Biblioteca de publicaciones</p>
          <p className="text-xs text-muted-foreground">
            Todo ordenado por estado y por cliente
          </p>
        </div>
        <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          18 posts
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {posts.map((post) => (
          <div
            key={post.title}
            className="flex items-center justify-between rounded-[22px] border border-border/70 bg-[hsl(var(--hero-background))] px-4 py-4 transition-all duration-200 hover:bg-primary-light/40 hover:border-primary/30"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">{post.title}</p>
              <p className="text-xs text-muted-foreground">Cliente: @studio.lucia</p>
            </div>
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold capitalize", post.tone)}>
              {post.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConnectedAccountsPreview() {
  const accounts = [
    { label: "Instagram", color: "bg-[#E1306C]" },
    { label: "Facebook", color: "bg-[#1877F2]" },
    { label: "TikTok", color: "bg-[#111111]" },
    { label: "LinkedIn", color: "bg-[#0A66C2]" },
    { label: "X", color: "bg-black" },
    { label: "YouTube", color: "bg-[#FF0000]" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Cuentas conectadas</p>
          <p className="text-xs text-muted-foreground">
            Lista lista para trabajar sin cambiar de plataforma
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          6 activas
        </span>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <div
            key={account.label}
            className="rounded-[24px] border border-border/70 bg-white p-4 shadow-sm transition-all duration-200 hover:scale-[1.03] hover:shadow-md hover:border-primary/30"
          >
            <div className="flex items-center justify-between">
              <div className={cn("h-10 w-10 rounded-2xl", account.color)} />
              <span className="rounded-full bg-primary-light/80 px-3 py-1 text-xs font-semibold text-primary">
                conectada
              </span>
            </div>
            <p className="mt-4 text-sm font-semibold text-foreground">{account.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SocialPill({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white px-3 py-1.5 text-xs font-semibold text-foreground transition-all duration-200 hover:scale-105 hover:border-primary/30 hover:shadow-sm">
      <span className={cn("h-2.5 w-2.5 rounded-full", color)} />
      {label}
    </span>
  );
}

function AIIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 2l1.09 3.36L16.45 6l-2.72 2.18L14.54 12 12 9.82 9.46 12l.81-3.82L7.55 6l3.36-.64L12 2z" fill="currentColor" />
      <path d="M5 16l.73 2.27L8 19l-2.27.73L5 22l-.73-2.27L2 19l2.27-.73L5 16z" fill="currentColor" opacity="0.7" />
      <path d="M19 13l.55 1.7L21.25 15.25l-1.7.55L19 17.5l-.55-1.7-1.7-.55 1.7-.55L19 13z" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

const aiPrompts = [
  { label: "Generar copy", description: "Creá un caption para Instagram sobre un nuevo producto de skincare", active: true },
  { label: "Mejor horario", description: "¿Cuál es el mejor horario para publicar en Instagram para una tienda de ropa?", active: false },
  { label: "Hashtags", description: "Sugerí 10 hashtags para un post de café artesanal", active: false },
];

const aiSuggestions = [
  { type: "copy" as const, text: "Tu piel merece lo mejor ✨ Descubrí nuestra nueva línea de skincare natural. Hidratación profunda, ingredientes limpios y resultados visibles en 14 días. #SkincareNuevo #BellezaNatural #CuidadoFacial" },
  { type: "time" as const, text: "Mejor horario: 18:30 - 19:00", detail: "Tu audiencia de moda tiene un pico de actividad los martes y jueves a esta hora." },
  { type: "hashtags" as const, text: "#CafeArtesanal #SpecialtyCoffee #CaféDeEspecialidad #Barista #CoffeeLovers #CafeCulture #Cafetería #MorningRitual #CafeConLeche #ThirdWaveCoffee", detail: "Estimación de alcance: 12K - 45K impresiones" },
];

function AIAssistantPreview() {
  const [selectedPrompt, setSelectedPrompt] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [showResult, setShowResult] = useState(true);

  const handleGenerate = () => {
    setShowResult(false);
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setShowResult(true);
    }, 1200);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Asistente IA</p>
          <p className="text-xs text-muted-foreground">
            Generá copys, horarios y hashtags con un click
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          IA Activa
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-3">
          <div className="rounded-[24px] border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path d="M12 2l1.09 3.36L16.45 6l-2.72 2.18L14.54 12 12 9.82 9.46 12l.81-3.82L7.55 6l3.36-.64L12 2z" fill="currentColor" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">¿Qué querés generar?</p>
                <p className="text-[10px] text-muted-foreground">Elegí una opción o escribí tu prompt</p>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {aiPrompts.map((prompt, i) => (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() => {
                    setSelectedPrompt(i);
                    handleGenerate();
                  }}
                  className={cn(
                    "w-full rounded-2xl border px-3 py-2.5 text-left transition-all duration-200",
                    selectedPrompt === i
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "border-border/50 bg-white text-muted-foreground hover:border-primary/20 hover:bg-primary/5",
                  )}
                >
                  <p className="text-[11px] font-semibold">{prompt.label}</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed opacity-70">{prompt.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-border/50 bg-white p-4">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-foreground">Resultado</p>
            {generating && (
              <span className="inline-flex items-center gap-1 text-[10px] text-primary">
                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-primary" />
                Generando...
              </span>
            )}
          </div>

          {generating && (
            <div className="mt-4 space-y-2">
              <div className="h-3 w-3/4 animate-pulse rounded-full bg-primary/10" />
              <div className="h-3 w-full animate-pulse rounded-full bg-primary/10" />
              <div className="h-3 w-2/3 animate-pulse rounded-full bg-primary/10" />
            </div>
          )}

          {showResult && !generating && (
            <div className="mt-3 animate-in fade-in duration-300">
              <div className="rounded-2xl bg-[hsl(var(--hero-background))] p-3">
                <p className="text-[11px] leading-relaxed text-foreground/85">
                  {aiSuggestions[selectedPrompt].text}
                </p>
                {aiSuggestions[selectedPrompt].detail && (
                  <p className="mt-2 text-[10px] text-primary">
                    {aiSuggestions[selectedPrompt].detail}
                  </p>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <button type="button" className="flex-1 rounded-xl bg-primary px-3 py-2 text-[11px] font-semibold text-white transition-all hover:bg-primary/90">
                  Usar este resultado
                </button>
                <button type="button" onClick={handleGenerate} className="rounded-xl border border-border/50 px-3 py-2 text-[11px] font-medium text-muted-foreground transition-all hover:bg-primary/5">
                  Regenerar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ComposeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M5 19h4l8.7-8.7a1.8 1.8 0 0 0-2.6-2.6L6.4 16.4 5 19Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M13.5 7.5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MonthIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3.5v4M16 3.5v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function WeekIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9.2 5.5v15M14.8 5.5v15" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function PostsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="4" y="11" width="16" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="4" y="17" width="10" height="3" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function AccountsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 19a4.5 4.5 0 0 1 9 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14 18a3.5 3.5 0 0 1 6 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
