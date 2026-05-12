import Link from "next/link"
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
type AlertSeverity = "success" | "warning" | "error" | "info"

interface AlertItem {
  id: string
  severity: AlertSeverity
  text: string
  time: string
  cta?: string
  ctaHref?: string
}

const severityConfig: Record<
  AlertSeverity,
  { icon: typeof CheckCircle2; dotColor: string; iconColor: string }
> = {
  success: {
    icon: CheckCircle2,
    dotColor: "bg-emerald-500",
    iconColor: "text-emerald-500",
  },
  warning: {
    icon: AlertTriangle,
    dotColor: "bg-amber-500",
    iconColor: "text-amber-500",
  },
  error: {
    icon: XCircle,
    dotColor: "bg-red-500",
    iconColor: "text-red-500",
  },
  info: {
    icon: Info,
    dotColor: "bg-primary",
    iconColor: "text-primary",
  },
}

interface AlertsFeedProps {
  items: AlertItem[]
}

export function AlertsFeed({ items }: AlertsFeedProps) {
  return (
    <section className="rounded-xl border border-primary-light/60 bg-white p-6">
      <h2 className="text-base font-bold text-foreground">
        Alertas e insights
      </h2>

      <div className="mt-5 space-y-0">
        {items.map((item, index) => {
          const cfg = severityConfig[item.severity]
          const Icon = cfg.icon

          return (
            <div
              key={item.id}
              className="relative flex gap-3 pb-5 last:pb-0"
            >
              {/* Timeline line + dot */}
              <div className="relative flex w-5 shrink-0 justify-center">
                <Icon className={cn("mt-0.5 h-4 w-4", cfg.iconColor)} />
                {index < items.length - 1 && (
                  <span className="absolute top-6 h-full w-px bg-border" />
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed text-foreground">
                  {item.text}
                </p>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {item.time}
                  </span>
                  {item.cta && item.ctaHref && (
                    <Link
                      href={item.ctaHref}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
                    >
                      {item.cta}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
