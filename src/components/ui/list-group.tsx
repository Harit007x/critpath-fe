import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Apple's inset grouped list.
 *
 * A titled group of rows on one rounded surface, with hairlines *between* rows
 * only — never above the first or below the last, which is the detail that
 * separates this from a stack of bordered divs. The heading sits outside the
 * surface, in uppercase mono, because it labels the group rather than living
 * in it.
 */
function ListGroup({
  title,
  footnote,
  className,
  children,
  ...props
}: React.ComponentProps<"section"> & {
  title?: string
  footnote?: string
}) {
  return (
    <section className={cn("flex flex-col gap-2", className)} {...props}>
      {title && <h3 className="text-3xs font-medium uppercase tracking-wider tabular-nums px-1 text-muted-foreground">{title}</h3>}
      {/* `grow`, not `flex-1`: it takes free space when the section has been
          stretched to a grid row's height — which is what keeps two groups side
          by side sharing a bottom edge — but keeps its natural content height
          when there is none. `flex-1` would set `flex-basis: 0` and let the card
          collapse in an auto-height column. */}
      <div className="grow overflow-hidden rounded-lg border border-border bg-card">
        {children}
      </div>
      {footnote && (
        <p className="px-4 text-2xs text-muted-foreground">{footnote}</p>
      )}
    </section>
  )
}

/**
 * One row: leading media, stacked text, trailing value or control.
 *
 * 13px rows rather than Apple's 18px. Density here is balanced, not fully
 * airy — a settings screen still has to be scannable in one screenful.
 */
function ListRow({
  leading,
  inset,
  title,
  description,
  trailing,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  leading?: React.ReactNode
  /**
   * Reserve the leading column without drawing anything in it.
   *
   * Set this on the rows of a group where *some* other row has a `leading`
   * glyph. Without it those rows pull their text 44px to the left of their
   * neighbours' and the group gets a ragged left edge — which is the one thing
   * an inset grouped list is meant to prevent.
   */
  inset?: boolean
  title: React.ReactNode
  description?: React.ReactNode
  trailing?: React.ReactNode
}) {
  return (
    <div
      data-slot="list-row"
      className={cn(
        // The separator lives on the row and is suppressed on the last one, so
        // a group never ends on a stray hairline.
        "flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0",
        className
      )}
      {...props}
    >
      {leading ? (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary-ink [&_svg]:size-4">
          {leading}
        </span>
      ) : inset ? (
        // Same box, nothing in it — the gap between flex children does the rest,
        // so the text column lands exactly where a glyph row's does.
        <span aria-hidden="true" className="size-8 shrink-0" />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="text-xs/relaxed font-medium text-foreground">{title}</div>
        {description && (
          <div className="mt-0.5 text-xs text-muted-foreground">
            {description}
          </div>
        )}
        {children}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  )
}

export { ListGroup, ListRow }
