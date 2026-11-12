/**
 * The web app on Cloudflare: what `vercel.json`'s rewrites did. The app and the API share
 * one origin so the session cookie is first-party everywhere; `wrangler.jsonc`
 * sends only `/api/*` and `/.well-known/*` here, and everything else is a free static-asset request.
 */

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> }
  /** The Railway API's own URL, e.g. `https://critpath-be-production.up.railway.app`. */
  API_ORIGIN: string
  /** A secret (`wrangler secret put`), the same value as the API's EDGE_PROXY_SECRET. */
  EDGE_PROXY_SECRET?: string
}

const PROXIED = /^\/(api|\.well-known)(\/|$)/

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    // Only the paths above are routed here, but an unmatched non-navigation request reaches the
    // Worker too; it gets the SPA, as it did on Vercel, not the API.
    if (!PROXIED.test(url.pathname)) return env.ASSETS.fetch(request)

    const headers = new Headers(request.headers)
    // Railway's edge replaces X-Forwarded-For with Cloudflare's address, so the API keys rate
    // limits and Better Auth on this header instead, believed only with the key beside it
    // (`clientIp`, critpath-be/src/lib/rate-limit.ts). Both are set, never passed on from the visitor.
    headers.delete("x-critpath-visitor-ip")
    headers.delete("x-critpath-proxy-key")
    const visitor = request.headers.get("cf-connecting-ip")
    if (visitor && env.EDGE_PROXY_SECRET) {
      headers.set("x-critpath-visitor-ip", visitor)
      headers.set("x-critpath-proxy-key", env.EDGE_PROXY_SECRET)
    }
    headers.set("x-forwarded-host", url.host)
    headers.set("x-forwarded-proto", url.protocol.replace(":", ""))

    return fetch(new URL(url.pathname + url.search, env.API_ORIGIN), {
      method: request.method,
      headers,
      body: request.body,
      // Attachment downloads are a 302 to R2 and sign-in answers with redirects: the browser
      // must follow them, not the Worker.
      redirect: "manual",
    })
  },
}
