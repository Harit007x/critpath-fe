import { useSideNavStore } from "@/store/store";
import { useEffect, useState } from "react";

export const useSidebarMediaQuery = (minWidth: string) => {
  // Seeded from the current viewport so the first paint is already correct.
  const [isSmallScreen, setIsSmallScreen] = useState(
    () => !window.matchMedia(minWidth).matches,
  );
  const { sidebarOpen, setSidebarOpen } = useSideNavStore();

  useEffect(() => {
    const mediaQuery = window.matchMedia(minWidth);
    const handleMediaQueryChange = (e: MediaQueryListEvent) => {
      setIsSmallScreen(!e.matches);
      setSidebarOpen(e.matches);
    };

    mediaQuery.addEventListener("change", handleMediaQueryChange);
    setSidebarOpen(mediaQuery.matches);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaQueryChange);
    };
  }, [minWidth, setSidebarOpen]);

  return { isSmallScreen, sidebarOpen, setSidebarOpen };
};
