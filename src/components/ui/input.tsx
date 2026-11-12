import * as React from "react"
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react"

import { cn } from "@/lib/utils"

/**
 * Fields are 16px on phones. Anything smaller and iOS Safari zooms the whole
 * page in when the field is tapped, and leaves it zoomed.
 */
const inputClasses = cn(
  "flex h-10 w-full min-w-0 rounded-md border border-border bg-transparent px-3 py-1 text-base transition-all outline-none sm:h-8 sm:px-2.5 sm:text-xs/relaxed pointer-coarse:text-base",
  "selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground",
  "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs/relaxed file:font-medium file:text-foreground",
  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
  "disabled:pointer-events-none disabled:opacity-50",
  "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
  "dark:bg-input/30"
)

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  const [revealed, setRevealed] = React.useState(false)

  if (type === "password") {
    // The box (border, fill, focus ring) is the wrapper, so the input inside
    // can carry a mask: a long value fades out before the eye instead of
    // stopping at a hard edge. A mask on a bordered input would fade the
    // border and clip the focus ring with it.
    return (
      <div
        className={cn(
          inputClasses,
          "items-center gap-1 py-0 pr-1 sm:pr-1",
          "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30",
          "has-[input:disabled]:pointer-events-none has-[input:disabled]:opacity-50",
          "has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:ring-2 has-[input[aria-invalid=true]]:ring-destructive/20",
          className
        )}
      >
        <input
          type={revealed ? "text" : "password"}
          data-slot="input"
          // Edge's own reveal would be a second eye.
          className="h-full min-w-0 flex-1 bg-transparent outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground [mask-image:linear-gradient(to_left,transparent,black_1.5rem)] [&::-ms-reveal]:hidden"
          {...props}
        />
        <button
          type="button"
          // The field is the tab stop; the reveal is a pointer affordance, and
          // in the tab order it would sit between the field and Submit.
          tabIndex={-1}
          onClick={() => setRevealed((prev) => !prev)}
          aria-label={revealed ? "Hide password" : "Show password"}
          className="shrink-0 rounded-sm p-1 text-muted-foreground outline-none transition-colors hover:text-foreground"
        >
          {revealed ? (
            <RiEyeOffLine className="size-4 sm:size-3.5" />
          ) : (
            <RiEyeLine className="size-4 sm:size-3.5" />
          )}
        </button>
      </div>
    )
  }

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputClasses, className)}
      {...props}
    />
  )
}

/**
 * Input with its label, hint and error wired together, so `aria-describedby`,
 * `aria-invalid` and the hint/error swap are right at every call site.
 */
function TextField({
  label,
  hint,
  error,
  className,
  id,
  ...props
}: React.ComponentProps<"input"> & {
  label: string
  hint?: string
  error?: string
}) {
  const generated = React.useId()
  const fieldId = id ?? generated
  const messageId = `${fieldId}-message`

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={fieldId}
        className="flex items-center gap-1.5 text-xs/relaxed font-medium select-none"
      >
        {label}
      </label>
      <Input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className={className}
        {...props}
      />
      {(error || hint) && (
        <p
          id={messageId}
          className={cn(
            "text-2xs/relaxed",
            error ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {error || hint}
        </p>
      )}
    </div>
  )
}

export { Input, TextField, inputClasses }
