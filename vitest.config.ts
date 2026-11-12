import path from "path";
import { defineConfig } from "vitest/config";

/**
 * Unit tests only — no component rendering, no dev server, no API.
 *
 * A separate config rather than a `test` block on `vite.config.ts`: that file
 * loads the Tailwind and React plugins, and neither has anything to do with
 * running a pure function. The `@` alias is the one thing worth repeating,
 * because every import in `src/` uses it.
 */
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // jsdom, because the store persists through localStorage/sessionStorage and
    // the video probe builds a <video> element. Both are the behaviour under
    // test, not incidental.
    environment: "jsdom",
  },
});
