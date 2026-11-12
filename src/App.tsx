import { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { router } from "@/routes";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/spinner";
import { authService } from "@/services/auth.service";
import { AUTH_ENABLED } from "@/config/app";
import { useVersionWatch, VERSION_TOASTER_ID } from "@/lib/version-watch";

function App() {
  const [loading, setLoading] = useState(AUTH_ENABLED);
  useVersionWatch();

  useEffect(() => {
    if (!AUTH_ENABLED) return;
    authService
      .loadSession()
      .catch((err) => console.error("Failed to load session:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ThemeProvider>
      {loading ? (
        <div className="flex h-svh w-full items-center justify-center bg-background">
          <Spinner className="size-5 text-muted-foreground" />
        </div>
      ) : (
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster />
          <Toaster id={VERSION_TOASTER_ID} position="top-right" />
        </QueryClientProvider>
      )}
    </ThemeProvider>
  );
}

export default App;
