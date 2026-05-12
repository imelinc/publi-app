import Link from "next/link"
import { AlertTriangle, Clock, XCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
type AttentionType = "failed" | "pending_review" | "overdue" | "info"

interface AttentionItem {
  id: string
  type: AttentionType
  title: string
  description: string
  cta: string
  ctaHref: string
}

const config: Record<
  AttentionType,
  {
    icon: typeof AlertTriangle
    dotColor: string
    bgColor: string
    borderColor: string
    ctaColor: string
  }
> = {
  failed: {
    icon: XCircle,
    dotColor: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    ctaColor: "text-red-600 hover:bg-red-100",
  },
  pending_review: {
    icon: Clock,
    dotColor: "text-amber-500",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    ctaColor: "text-amber-700 hover:bg-amber-100",
  },
  overdue: {
    icon: AlertTriangle,
    dotColor: "text-orange-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    ctaColor: "text-orange-700 hover:bg-orange-100",
  },
  info: {
    icon: Info,
    dotColor: "text-primary",
    bgColor: "bg-primary-light",
    borderColor: "border-primary-light",
    ctaColor: "text-primary hover:bg-primary-light",
  },
}

interface NeedsAttentionCardProps {
  items: AttentionItem[]
}

export function NeedsAttentionCard({ items }: NeedsAttentionCardProps) {
  if (items.length === 0) return null

  return (
    <section className="rounded-xl border border-primary-light/60 bg-white p-6">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-red-500" />
        <h2 className="text-base font-bold text-foreground">
          Requiere atención
        </h2>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const cfg = config[item.type]
          const Icon = cfg.icon

          return (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-4",
                cfg.borderColor,
                cfg.bgColor
              )}
            >
              <div className="mt-0.5 shrink-0">
                <Icon className={cn("h-4 w-4", cfg.dotColor)} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {item.title}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>

              <Link
                href={item.ctaHref}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  cfg.ctaColor
                )}
              >
                {item.cta}
              </Link>
            </div>
          )
        })}
      </div>
    </section>
  )
}
