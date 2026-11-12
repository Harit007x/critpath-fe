# CritPath: XER schedule checker (web app)

Upload a Primavera P6 schedule export (`.xer`) and see what's wrong with it: broken rows,
missing links, negative float and high float. You can see the activities behind each finding
and a total-float chart.

**Live demo:** https://critpath-fe.harit-ptl-business.workers.dev

The project is split into two repos:

| Repo                                                    | What it is                                                 |
| ------------------------------------------------------- | ---------------------------------------------------------- |
| [critpath-be](https://github.com/Harit007x/critpath-be) | The API: parser, checks, storage, **the two sample files** |
| **critpath-fe** (this one)                              | The web app                                                |

How each check works and why is explained in
[critpath-be's README](https://github.com/Harit007x/critpath-be#the-checks).

**Stack:** Vite, React 19, TypeScript, Tailwind CSS 4 with shadcn/ui, React Router 7, TanStack
Query, TanStack Table, Axios.

## Screens

**`/check`: start screen** (`/` opens it)

- Drop in a `.xer` file, or try one of the two samples.
- Recent uploads are listed below. You can search, filter them by clean or flagged, and click
  one to reopen its report.

**`/check/files/:id` and `/check/samples/:id`: one file's report**

- **Header:** the project name, data date and a download link.
- **Four tiles:** missing links, negative float, high float and broken rows. The first one with
  problems is open to start with.
- **Table:** the activities or rows behind the selected tile. You can search, filter, sort and
  page through them.
- **Schedule details:** the file's counts and a total-float chart.

Uploading a file that's already stored opens the saved report instead of storing a copy.

## Code

```
src/pages/check/
  page.tsx            Start screen: data loading and the upload
  library-view.tsx    Start screen UI: dropzone, samples, recent uploads table
  labels.ts           Display labels, date format, the screens' paths
  facets.ts           Filter options for the tables
  report/
    page.tsx          Report screen: loads one file's report
    report-view.tsx   Header, finding tiles, schedule details
    findings.ts       The four findings from a report
    finding-tables.tsx  Activity and broken-row tables
    float-chart.tsx   Total-float histogram
src/services/xer.service.ts   API calls and response types
src/components/data-table/    Table with search, filters, sorting and pagination
worker/index.ts               Cloudflare Worker that forwards /api to the API
```

Sign-in is switched off (`AUTH_ENABLED` in `src/config/app.ts`), so every page opens without an
account. The sign-in screens are still in the repo for when it's turned back on.

## Run locally

Start the API first ([critpath-be](https://github.com/Harit007x/critpath-be), on
http://localhost:5000), then:

```sh
pnpm install
cp .env.example .env   # the defaults point at the local API
pnpm dev               # http://localhost:5173
```

| Command          | Purpose                                                      |
| ---------------- | ------------------------------------------------------------ |
| `pnpm dev`       | Start the dev server (port 5173)                             |
| `pnpm test`      | Unit tests (vitest)                                          |
| `pnpm typecheck` | Type-check                                                   |
| `pnpm lint`      | ESLint                                                       |
| `pnpm build`     | Type-check and build for production                          |
| `pnpm deploy:cf` | Build with `VITE_API_BASE_URL=/api` and deploy to Cloudflare |

## Deployment

The app runs on Cloudflare Workers (`wrangler.jsonc`).

- **Static files:** served directly by Cloudflare.
- **API requests:** `/api/*` goes through `worker/index.ts` to the API on Railway (`API_ORIGIN`).
  The browser only ever talks to one origin, so there is no CORS setup.
- **Rate limits:** the Worker passes the visitor's IP to the API with a shared secret
  (`EDGE_PROXY_SECRET`, set with `wrangler secret put`), so limits count real visitors.
