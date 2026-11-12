import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";

/**
 * A confirm's destructive button. It never takes focus on open: Cancel does (first in the
 * footer), and ← / → reach this one (`moveFocusWithArrows`, wired into `DialogFooter`).
 */
export function DeleteConfirmButton({
  children,
  ...props
}: Omit<ComponentProps<typeof Button>, "asChild" | "autoFocus">) {
  return (
    <Button type="button" variant="destructive" {...props}>
      {children}
    </Button>
  );
}
