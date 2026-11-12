import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * A KPI tile.
 *
 * At most one filled tile per row — that is the single point of emphasis
 * orange is allowed per view, and two of them means neither works. The filled
 * tile takes shadow-md and a 1px white inset highlight at its top edge, which
 * is Apple's key-light trick, instead of a border.
 *
 * The label is uppercase mono because it is data *about* the number rather
 * than the number itself. The caption explains the number and never repeats
 * it: "Total active users" under 34, not "34 users".
 */
function StatTile({
  label,
  value,
  caption,
  icon,
  filled = false,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  label: string
  value: string
  caption?: string
  icon?: React.ReactNode
  filled?: boolean
}) {
  return (
    <div
      data-slot="stat-tile"
      data-filled={filled || undefined}
      className={cn(
        "flex flex-col gap-3 rounded-lg p-5",
        filled
          ? "shadow-sm bg-primary text-primary-foreground"
          : "border border-border bg-card shadow-sm",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            "text-3xs font-medium uppercase tracking-wider tabular-nums",
            filled ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {label}
        </p>
        {icon && (
          <span
            aria-hidden="true"
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-md [&_svg]:size-4",
              filled ? "bg-primary-foreground/12 text-primary-foreground" : "bg-primary/10 text-primary-ink"
            )}
          >
            {icon}
          </span>
        )}
      </div>

      <div>
        <p
          className={cn(
            "font-heading text-xl font-medium tabular-nums",
            filled ? "text-primary-foreground" : "text-foreground"
          )}
        >
          {value}
        </p>
        {caption && (
          <p
            className={cn(
              "mt-1 text-xs",
              filled ? "text-primary-foreground/75" : "text-muted-foreground"
            )}
          >
            {caption}
          </p>
        )}
      </div>
    </div>
  )
}

export { StatTile }
