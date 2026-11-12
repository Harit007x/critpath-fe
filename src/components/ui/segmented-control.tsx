"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Switching between views of the same content. Two to four options.
 *
 * Apple's segmented control, so the thumb slides and the track never animates.
 * The thumb is a real positioned element rather than a per-option background,
 * which is the only way to get the slide — a background that cross-fades
 * between two segments reads as two separate things blinking.
 *
 * **The track has its own ground, `track`, and that is what makes the control
 * legible.** It used to take `sunken`, which is three points off `canvas` in
 * light mode and identical to it in dark — so the unselected half vanished into
 * the page, leaving the white thumb reading as a lone button and the option
 * beside it as loose text. A border was the first fix and looked like trim on a
 * control that should read as a groove. `track` steps away from the canvas —
 * down in light, up in dark, the same inversion the sidebar makes — with the
 * thumb on `raised` above it, which says the same thing with no line at all.
 *
 * For more than four options, or options that need a description, use Select
 * or RadioGroup instead.
 */
function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className,
  "aria-label": ariaLabel,
}: {
  options: { value: T; label: string; icon?: React.ReactNode }[]
  value: T
  onChange: (value: T) => void
  size?: "sm" | "md"
  className?: string
  "aria-label": string
}) {
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  )

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "relative isolate inline-grid w-fit rounded-md bg-muted p-0.5",
        // The height of Button size="sm" at every width (h-8, then h-7 from sm), so a toggle and the
        // buttons beside it line up.
        size === "sm" ? "h-8 sm:h-7" : "h-9",
        className
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {/* The thumb. Sized to one column and translated by whole columns, so it
          stays correct whatever the container width turns out to be. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0.5 left-0.5 -z-10 rounded-[6px] bg-popover shadow-xs transition-transform duration-200 ease-out"
        style={{
          width: `calc((100% - 4px) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "z-10 inline-flex items-center justify-center gap-1.5 rounded-[6px] px-3 font-medium outline-none",
              "transition-colors duration-150 ease-out",
              "focus-visible:ring-2 focus-visible:ring-ring/30",
              "[&_svg]:size-4 [&_svg]:shrink-0",
              size === "sm" ? "text-2xs" : "text-xs",
              selected
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.icon}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export { SegmentedControl }
