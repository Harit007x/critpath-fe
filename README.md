# Web app starter

The front end of a SaaS starter: sign-up with email verification, sign-in (email +
optional Google), password reset, a profile page, and the app shell (collapsible sidebar,
top bar, light/dark theme) built on the design system. Add your product's pages on top.

**Stack:** Vite, React 19, TypeScript, Tailwind CSS 4 with the shadcn/ui kit restyled
to the design system (tokens in `src/index.css`), React Router 7, React Hook Form + Zod,
Zustand, Axios, TanStack Table, Better Auth client, Sonner.

## Schedule checker

Two screens, so each has one job
([critpath-be](https://github.com/Harit007x/critpath-be) checks the files, holds the two samples
and explains each rule):

- **`/check`** (where `/` opens): drop in a `.xer` file, try a bundled sample, or reopen a recent
  upload. Every upload is stored by the API with its report.
- **`/check/files/:id`** and **`/check/samples/:id`**: one file's report. Four tiles (missing
  links, negative float, high float, broken rows) open the list behind each, starting on the first that found problems; then
  a chat about the file, answered by [critpath-ai](https://github.com/Harit007x/critpath-ai)
  through the API; then the file's counts and a total-float chart.

Code: `src/pages/check/page.tsx` and `library-view.tsx` (the start screen),
`src/pages/check/report/` (the report screen, its tables, chart and chat), API calls and types in
`src/services/xer.service.ts`. Sign-in is switched off (`AUTH_ENABLED` in `src/config/app.ts`),
so every page opens without an account.

## Run locally

Start the API first (`../critpath-be`, http://localhost:5000), then:

```sh
pnpm install
pnpm dev        # http://localhost:5173
```

The API URL defaults to `http://localhost:5000/api`; override it with
`VITE_API_BASE_URL` in `.env` if needed.

| Script           | Description                         |
| ---------------- | ----------------------------------- |
| `pnpm dev`       | Start the dev server (port 5173)    |
| `pnpm build`     | Type-check and build for production |
| `pnpm preview`   | Preview the production build        |
| `pnpm lint`      | Run ESLint                          |
| `pnpm test`      | Run tests (vitest)                  |
| `pnpm typecheck` | Type-check                          |

## Project structure

```
src/
  components/ui/        Design-system primitives (shadcn/ui, restyled)
  components/data-table TanStack Table wrapper
  components/side-nav   Collapsible sidebar shell
  components/theme-provider  Light / dark / system theme
  config/app.ts         App name
  layouts/app-layout    Sidebar navigation + page outlet
  lib/api.ts            Axios instance (cookies, 401 handling)
  lib/auth-client.ts    Better Auth client
  pages/                Auth screens, home (placeholder), settings
  routes/               Route tree and guards
  services/             API calls
  store/                Zustand stores
```

## Adding a page

1. Create it under `src/pages/<name>/page.tsx`.
2. Add a route inside the `AppLayout` children in `src/routes/index.tsx`.
3. Add a sidebar entry in `src/layouts/app-layout.tsx`.

The app's name lives in `src/config/app.ts`; the logo is `public/critpath-mark.svg`
(`src/components/brand-mark.tsx`).
