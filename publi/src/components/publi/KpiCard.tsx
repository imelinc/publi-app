import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react"
import { cn } from "@/lib/utils"
type TrendDirection = "up" | "down" | "neutral"

interface KpiData {
  icon: keyof typeof iconMap
  label: string
  value: string
  trend: string
  trendDirection: TrendDirection
}

const iconMap = {
  calendar: Calendar,
  clock: Clock,
  users: Users,
  "trending-up": TrendingUp,
} as const

const trendConfig: Record<
  TrendDirection,
  { icon: typeof ArrowUpRight; colorClass: string; bgClass: string }
> = {
  up: {
    icon: ArrowUpRight,
    colorClass: "text-emerald-600",
    bgClass: "bg-emerald-50",
  },
  down: {
    icon: ArrowDownRight,
    colorClass: "text-red-600",
    bgClass: "bg-red-50",
  },
  neutral: {
    icon: Minus,
    colorClass: "text-muted-foreground",
    bgClass: "bg-muted",
  },
}

interface KpiCardProps {
  data: KpiData
}

export function KpiCard({ data }: KpiCardProps) {
  const Icon = iconMap[data.icon]
  const trend = trendConfig[data.trendDirection]
  const TrendIcon = trend.icon

  return (
    <article
      className={cn(
        "group relative rounded-xl border bg-white p-5 transition-shadow",
        "hover:shadow-[0_8px_30px_-12px_rgba(0,149,182,0.15)]",
        data.trendDirection === "down"
          ? "border-red-200"
          : "border-primary-light/60"
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {data.label}
        </p>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            data.trendDirection === "down" ? "bg-red-50" : "bg-primary-light"
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4",
              data.trendDirection === "down" ? "text-red-500" : "text-primary"
            )}
          />
        </div>
      </div>

      <p className="mt-4 text-3xl font-bold leading-none text-foreground">
        {data.value}
      </p>

      <div className="mt-3 flex items-center gap-1.5">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
            trend.bgClass,
            trend.colorClass
          )}
        >
          <TrendIcon className="h-3 w-3" />
          {data.trend}
        </span>
      </div>
    </article>
  )
}
