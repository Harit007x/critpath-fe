import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-md border border-border bg-transparent px-3 py-2 text-base transition-all outline-none sm:min-h-20 sm:px-2.5 sm:py-1.5 sm:text-xs/relaxed",
        "field-sizing-content placeholder:text-muted-foreground",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
        "disabled:pointer-events-none disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        "dark:bg-input/30",
        className
      )}
      {...props}
    />
  )
}

/**
 * Textarea with a character counter. The counter turns red past the limit but
 * never blocks typing — stopping the keystroke loses text already written.
 */
function TextAreaField({
  label,
  hint,
  error,
  maxLength,
  value,
  className,
  id,
  ...props
}: React.ComponentProps<"textarea"> & {
  label: string
  hint?: string
  error?: string
}) {
  const generated = React.useId()
  const fieldId = id ?? generated
  const messageId = `${fieldId}-message`
  const count = typeof value === "string" ? value.length : 0
  const over = maxLength !== undefined && count > maxLength

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={fieldId}
        className="flex items-center gap-1.5 text-xs/relaxed font-medium select-none"
      >
        {label}
      </label>
      <Textarea
        id={fieldId}
        value={value}
        aria-invalid={error || over ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className={className}
        {...props}
      />
      <div className="flex items-start justify-between gap-3">
        {error || hint ? (
          <p
            id={messageId}
            className={cn(
              "text-2xs/relaxed",
              error ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {error || hint}
          </p>
        ) : (
          <span />
        )}
        {maxLength !== undefined && (
          <span
            className={cn(
              "shrink-0 text-3xs tabular-nums",
              over ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {count}/{maxLength}
          </span>
        )}
      </div>
    </div>
  )
}

export { Textarea, TextAreaField }
