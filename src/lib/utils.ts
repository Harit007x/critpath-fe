import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge only knows Tailwind's stock scales, and index.css adds two
 * font sizes below `xs` (`text-2xs`, `text-3xs`). Unregistered, they read as
 * *colours* and silently drop the real colour class from the same cn() call.
 * Keep this list in step with the `--text-*` steps in index.css.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["2xs", "3xs"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
