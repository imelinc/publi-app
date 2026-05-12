"use client"

import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Plus, AlertTriangle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface TodaySummary {
  scheduledCount: number
  pendingReviewCount: number
  failedCount: number
}

const todaySummary: TodaySummary = {
  scheduledCount: 4,
  pendingReviewCount: 2,
  failedCount: 1,
}

const profile = { name: "Usuario" }

export function GreetingBanner() {
  const firstName = profile.name.split(" ")[0]
  const today = format(new Date(), "EEEE d 'de' MMMM", { locale: es })

  return (
    <section className="relative overflow-hidden rounded-2xl bg-white border border-primary-light/60 p-6 md:p-8">
      <div
        className="absolute left-0 top-0 h-full w-1.5 rounded-l-2xl bg-primary"
        aria-hidden="true"
      />

      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium capitalize text-muted-foreground">
            {today}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Buenos días, {firstName}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <SummaryPill
              icon={<Clock className="h-3.5 w-3.5" />}
              text={`${todaySummary.scheduledCount} programadas hoy`}
              className="text-primary"
            />
            <SummaryPill
              icon={<AlertTriangle className="h-3.5 w-3.5" />}
              text={`${todaySummary.pendingReviewCount} pendientes de revisión`}
              className="text-amber-600"
            />
            {todaySummary.failedCount > 0 && (
              <SummaryPill
                icon={<AlertTriangle className="h-3.5 w-3.5" />}
                text={`${todaySummary.failedCount} fallida`}
                className="text-red-600"
              />
            )}
          </div>
        </div>

        <Link
          href="/nueva-publicacion"
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-3",
            "text-sm font-bold text-white transition-colors hover:bg-primary/90"
          )}
        >
          <Plus className="h-4 w-4" />
          Nueva Publicación
        </Link>
      </div>
    </section>
  )
}

function SummaryPill({
  icon,
  text,
  className,
}: {
  icon: React.ReactNode
  text: string
  className?: string
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", className)}>
      {icon}
      {text}
    </span>
  )
}
