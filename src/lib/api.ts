import axios from "axios";

import { useAuthStore } from "@/store/auth-store";

/**
 * The API's base URL, always absolute. `VITE_API_BASE_URL` may be relative ("/api") when the
 * API is served from this same origin — on Cloudflare, `worker/index.ts` proxies /api to Railway,
 * which keeps the session cookie first-party in every browser.
 */
export const API_BASE_URL = new URL(
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  window.location.origin,
).href.replace(/\/$/, "");

/**
 * This tab's id, sent on its writes as `X-CritPath-Tab`. The API echoes it in the live-update event
 * for that write (lib/live-updates.ts), so the tab that made a change does not refetch it.
 */
export const TAB_ID = crypto.randomUUID();

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // session cookie
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  // Let the browser set the multipart boundary for FormData bodies.
  if (config.data instanceof FormData) {
    config.headers.setContentType(null);
  }
  // Writes only: a custom header would turn every cross-origin GET into a preflight in dev.
  if (config.method && config.method !== "get") {
    config.headers.set("X-CritPath-Tab", TAB_ID);
  }
  return config;
});

// The server is the authority on the session: a 401 drops the local session too.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

/** A stream that would not start: the API's status, and its error code and message when it sent one. */
export class StreamError extends Error {
  readonly status: number;
  readonly code: string | null;
  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * POSTs to a route that answers server-sent events (an AI response, a long job) and hands
 * each event to `onEvent` as it arrives. EventSource cannot POST, so this reads the body itself.
 * Resolves when the stream ends; rejects with a StreamError when it never started, or when `signal`
 * aborts.
 */
export async function streamPost(
  path: string,
  body: unknown,
  onEvent: (event: string, data: unknown) => void,
  signal: AbortSignal,
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
      "X-CritPath-Tab": TAB_ID,
    },
    body: JSON.stringify(body),
    signal,
  });
  await readEvents(response, onEvent);
}

/** As `streamPost`, for a GET route (following a stream that is already going). */
export async function streamGet(
  path: string,
  onEvent: (event: string, data: unknown) => void,
  signal: AbortSignal,
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: { Accept: "text/event-stream" },
    signal,
  });
  await readEvents(response, onEvent);
}

async function readEvents(response: Response, onEvent: (event: string, data: unknown) => void) {
  if (!response.ok || !response.body) {
    if (response.status === 401) useAuthStore.getState().logout();
    const body = (await response.json().catch(() => null)) as {
      code?: string;
      message?: string;
    } | null;
    throw new StreamError(response.status, body?.code ?? null, body?.message ?? "Request failed");
  }
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    for (let end = buffer.indexOf("\n\n"); end >= 0; end = buffer.indexOf("\n\n")) {
      const block = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      const event = /^event: (.*)$/m.exec(block)?.[1] ?? "message";
      const data = /^data: (.*)$/m.exec(block)?.[1];
      if (data !== undefined) onEvent(event, JSON.parse(data));
    }
  }
}

export default api;
