import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Every screen opens with a title and a subtitle.
 *
 * Page-level actions sit on the title row, never in the top bar — an action
 * belongs next to the thing it acts on, and the top bar belongs to the app
 * rather than to the page currently in it.
 *
 * Titles are sentence case. Product-named surfaces keep their own casing:
 * "My Videos" stays "My Videos".
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  badge,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  /** Beside the title — a Beta tag, not a status. */
  badge?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="flex items-center gap-2.5 font-heading text-lg font-medium text-foreground">
          {title}
          {badge}
        </h1>
        {subtitle && (
          <p className="mt-1 max-w-[68ch] text-xs/relaxed text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export default PageHeader;
