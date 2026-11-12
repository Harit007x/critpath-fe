import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { StateStorage } from "zustand/middleware";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  expiresAt: number | null;
  setAuth: (user: AuthUser | null, expiresAt?: string | number | Date | null) => void;
  patchUser: (fields: Partial<AuthUser>) => void;
  logout: () => void;
}

export const isSessionActive = (state: AuthState): boolean =>
  state.isAuthenticated && (state.expiresAt === null || state.expiresAt > Date.now());

const parseExpiry = (value: string | number | Date | null | undefined): number | null => {
  if (value == null) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
};

// "Remember me" keeps the session snapshot in localStorage; otherwise it lives
// only as long as the tab (sessionStorage).
const customStorage: StateStorage = {
  getItem: (name) => localStorage.getItem(name) || sessionStorage.getItem(name) || null,
  setItem: (name, value) => {
    if (localStorage.getItem("rememberMeFlag") === "true") {
      localStorage.setItem(name, value);
      sessionStorage.removeItem(name);
    } else {
      sessionStorage.setItem(name, value);
      localStorage.removeItem(name);
    }
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
    sessionStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      expiresAt: null,
      setAuth: (user, expiresAt = null) =>
        set({
          user,
          isAuthenticated: !!user,
          expiresAt: user ? parseExpiry(expiresAt) : null,
        }),
      patchUser: (fields) =>
        set((state) => (state.user ? { user: { ...state.user, ...fields } } : state)),
      logout: () => set({ user: null, isAuthenticated: false, expiresAt: null }),
    }),
    {
      name: "critpath-auth",
      storage: createJSONStorage(() => customStorage),
    },
  ),
);
