import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Upasana's badge: a small square-cornered tag, tinted rather than solid. The
 * status names (`neutral`, `success`, `info`, `warning`, `danger`) are what
 * the workspace's meta tables hand in; `solidDanger` is the one state loud
 * enough to be filled.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 overflow-hidden rounded-sm border px-1.5 py-0.5 text-3xs font-medium whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary-ink",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-muted-foreground",
        destructive: "border-transparent bg-destructive/10 text-destructive",
        neutral: "border-border text-muted-foreground",
        accent: "border-transparent bg-primary/10 text-primary-ink",
        success: "border-transparent bg-primary/15 text-primary-ink",
        warning:
          "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400",
        info: "border-sky-600/40 bg-sky-500/10 text-sky-800 dark:border-sky-400/40 dark:text-sky-300",
        danger: "border-transparent bg-destructive/10 text-destructive",
        solidDanger: "border-transparent bg-destructive text-white",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
