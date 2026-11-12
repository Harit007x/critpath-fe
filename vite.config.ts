import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv, type Plugin } from "vite"

/**
 * Stamps every build with an id and publishes the same id as `/version.json`,
 * so a tab left open across a deploy can tell it is running old code
 * (`src/lib/version-watch.ts` polls the file and offers a Refresh).
 *
 * A timestamp rather than the commit sha. The host rebuilds without a new commit
 * when an env var changes — `VITE_SIGNALS_ENABLED`, say — and that changes the
 * bundle while the sha stays put; a sha would miss exactly that deploy. The
 * cost runs the other way and is harmless: redeploying identical code asks for
 * one refresh nobody needed. The sha rides along only to make the file
 * readable when someone opens it to ask "which build is live?".
 *
 * Build only. In dev there is no file to poll and HMR already keeps the tab
 * current, so the watcher switches itself off.
 */
function buildVersion(): Plugin {
  const buildId = Date.now().toString(36)
  return {
    name: "critpath-build-version",
    apply: "build",
    config: () => ({
      define: { "import.meta.env.VITE_BUILD_ID": JSON.stringify(buildId) },
    }),
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: JSON.stringify({
          buildId,
          commit: process.env.WORKERS_CI_COMMIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA ?? null,
        }),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // The API pins CORS and better-auth's trustedOrigins to this exact origin
  // (FRONTEND_URL in critpath-be/.env), so the port is part of the contract rather
  // than a preference. Vite's default is to take the next free port when this
  // one is busy, which starts a dev server that looks healthy but has every
  // request rejected as a cross-origin call — the symptom reads as a broken
  // login, not as a port conflict. Failing to start is the more honest outcome.
  server: { port: Number(loadEnv(mode, process.cwd(), "").PORT) || 5173, strictPort: true },
  plugins: [react(), tailwindcss(), buildVersion()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}))
