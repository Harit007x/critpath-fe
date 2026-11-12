import { useEffect } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { RiErrorWarningLine } from "@remixicon/react";

import BrandMark from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/**
 * A tab opened before a deploy still runs the old bundle, and its lazy chunks (the task
 * description editor, the docs page) are gone from Vercel once the new build is live. The import
 * then fails with one of these messages, which differ per browser.
 */
const STALE_BUILD =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i;

const RELOAD_KEY = "critpath:stale-build-reload";
// One automatic reload per window: if the chunk is still missing after it, the problem is not a
// stale tab, and reloading again would loop.
const RELOAD_WINDOW_MS = 30_000;

const isStaleBuild = (error: unknown) =>
  error instanceof Error && STALE_BUILD.test(error.message);

const reloadedRecently = () => {
  try {
    return Date.now() - Number(sessionStorage.getItem(RELOAD_KEY) ?? 0) < RELOAD_WINDOW_MS;
  } catch {
    return true; // storage blocked: never risk a loop
  }
};

/** The router's error screen, in place of React Router's developer page. */
export default function RouteError() {
  const error = useRouteError();
  const stale = isStaleBuild(error) && !reloadedRecently();

  useEffect(() => {
    if (!stale) return;
    try {
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    } catch {
      // Unreachable in practice: reloadedRecently() treats blocked storage as "just reloaded".
    }
    window.location.reload();
  }, [stale]);

  if (stale)
    return (
      <div className="flex min-h-svh items-center justify-center gap-2 bg-background text-xs text-muted-foreground">
        <Spinner className="size-4" />
        Loading the new version of CritPath…
      </div>
    );

  if (!isRouteErrorResponse(error)) console.error(error);
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : null;

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-6">
      <div className="flex w-full max-w-md flex-col gap-4">
        <BrandMark />
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground">
          <div className="flex items-center gap-2">
            <RiErrorWarningLine className="size-5 text-destructive" />
            <h1 className="font-heading text-base font-medium">Something went wrong</h1>
          </div>
          <p className="text-xs/relaxed text-muted-foreground">
            This page hit an error. Reloading usually fixes it.
          </p>
          {detail && (
            <p className="break-words rounded-md bg-muted/60 p-2.5 font-mono text-2xs text-muted-foreground">
              {detail}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button onClick={() => window.location.assign("/")} variant="outline">
              Go home
            </Button>
            <Button onClick={() => window.location.reload()}>Reload</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
