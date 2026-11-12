import { cn } from "@/lib/utils";
import { APP_NAME } from "@/config/app";

/* The emblem is a green rounded triangle with a pale inner triangle, drawn on
   a transparent ground. It reads on both the light and the dark canvas, so a
   single file serves every scheme. It lives in `public/`, so it is referenced
   by URL and never bundled; `favicon.svg` is a copy of the same artwork. */
const MARK = "/critpath-mark.svg";

/** The typographic lockup: the emblem beside the wordmark. */
export function BrandMark({
  tone = "neutral",
  showWordmark = true,
  className,
}: {
  /**
   * Governs the wordmark only — the emblem is artwork with its own palette.
   */
  tone?: "neutral" | "brand";
  showWordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <img
        src={MARK}
        alt=""
        aria-hidden="true"
        width={28}
        height={28}
        draggable={false}
        className="size-7 shrink-0 select-none"
      />
      {showWordmark && (
        <span
          className={cn(
            "truncate font-heading text-sm font-medium",
            tone === "brand" ? "text-primary" : "text-foreground"
          )}
        >
          {APP_NAME}
        </span>
      )}
    </span>
  );
}

export default BrandMark;
