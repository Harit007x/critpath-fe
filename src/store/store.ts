import type { SideNavState } from "@/utils/types";
import { create } from "zustand";

export const useSideNavStore = create<SideNavState>()((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (val: boolean) => set(() => ({ sidebarOpen: val })),
}));
