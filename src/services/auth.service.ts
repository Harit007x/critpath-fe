import api from "../lib/api";
import { authClient } from "../lib/auth-client";
import { useAuthStore, type AuthUser } from "../store/auth-store";
import { queryClient } from "../lib/query-client";
import { isSignupsClosed, SIGNUPS_CLOSED_MESSAGE } from "../lib/auth-errors";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

const toAuthUser = (user: SessionUser): AuthUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  image: user.image ?? null,
});

const sessionExpiryOf = (payload: unknown): string | number | Date | null =>
  (payload as { session?: { expiresAt?: string | number | Date } } | null)
    ?.session?.expiresAt ?? null;

const SIGNUP_ERRORS: Record<string, string> = {
  USER_ALREADY_EXISTS: "An account with this email already exists.",
};

/** Better Auth's refusal of a sign-in before the email is verified. */
export class EmailNotVerifiedError extends Error {
  constructor() {
    super("Verify your email first. Open the link we sent you.");
  }
}

/**
 * Where the verification link lands after Better Auth checks it: `/verify-email`, which goes on
 * to `next` once signed in, or shows `?error=` (an expired or used link) with a way to resend.
 */
const verifyCallbackURL = (next = "/check") =>
  `${window.location.origin}/verify-email?next=${encodeURIComponent(next)}`;

export const authService = {
  /** Restores the session on a cold load. Returns whether one exists. */
  loadSession: async (): Promise<boolean> => {
    const { data } = await authClient.getSession();
    if (data?.user) {
      useAuthStore
        .getState()
        .setAuth(toAuthUser(data.user), data.session.expiresAt);
      return true;
    }
    useAuthStore.getState().logout();
    return false;
  },

  login: async (email: string, password: string, rememberMe = false) => {
    localStorage.setItem("rememberMeFlag", rememberMe ? "true" : "false");
    // No callbackURL: Better Auth's client would follow it after every successful sign-in, and
    // `next` would be lost. The link an unverified sign-in emails lands on /verify-email anyway
    // (the API's default, lib/auth.ts).
    const { data, error } = await authClient.signIn.email({ email, password });
    if (error?.code === "EMAIL_NOT_VERIFIED") throw new EmailNotVerifiedError();
    if (error) throw new Error(error.message || "Failed to sign in");
    if (data?.user) {
      useAuthStore
        .getState()
        .setAuth(toAuthUser(data.user), sessionExpiryOf(data));
    }
  },

  /**
   * Creates the account, which can't be used until its email is verified: resolves `false` and
   * the person is sent the link (which lands on `next`). If the API marks it verified already,
   * this signs in and resolves `true`. An email that already has an account answers like a new
   * one (the API never says which).
   */
  signup: async (
    name: string,
    email: string,
    password: string,
    { next }: { next?: string } = {},
  ): Promise<boolean> => {
    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name,
      callbackURL: verifyCallbackURL(next),
    });
    if (error) {
      if (error.message && isSignupsClosed(error.message))
        throw new Error(SIGNUPS_CLOSED_MESSAGE);
      throw new Error(
        SIGNUP_ERRORS[error.code ?? ""] ?? error.message ?? "Failed to sign up",
      );
    }
    if (!data?.user.emailVerified) return false;
    await authService.login(email, password);
    return true;
  },

  /** Sends the verification link again. The API answers the same for any email. */
  resendVerification: async (email: string, next?: string) => {
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: verifyCallbackURL(next),
    });
    if (error) throw new Error(error.message || "Could not send the email");
  },

  signInWithGoogle: async (callbackPath = "/") => {
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: `${window.location.origin}${callbackPath}`,
      // Back to this page with ?error=… (useAuthRedirectError toasts it), not Better Auth's page.
      errorCallbackURL: window.location.href,
    });
    if (error)
      throw new Error(error.message || "Google sign-in is unavailable");
  },

  forgotPassword: async (email: string) => {
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error)
      throw new Error(error.message || "Failed to request password reset");
  },

  resetPassword: async (token: string, password: string) => {
    const { error } = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    if (error) throw new Error(error.message || "Failed to reset password");
  },

  logout: async () => {
    const { error } = await authClient.signOut();
    if (error) throw new Error(error.message || "Failed to sign out");
    useAuthStore.getState().logout();
    queryClient.clear();
  },

  updateName: async (name: string) => {
    await api.patch("/users/me", { name });
    useAuthStore.getState().patchUser({ name });
  },

  /**
   * A profile photo, PNG or JPEG up to 2 MB (Settings sends a 256 px square). Every list that
   * shows people carries `image`, so they all refetch.
   */
  setImage: async (image: Blob) => {
    const form = new FormData();
    form.append("image", image, image.type === "image/jpeg" ? "photo.jpg" : "photo.png");
    const { data } = await api.put<{ data: { image: string | null } }>("/users/me/image", form);
    useAuthStore.getState().patchUser({ image: data.data.image });
    void queryClient.invalidateQueries();
  },

  removeImage: async () => {
    await api.delete("/users/me/image");
    useAuthStore.getState().patchUser({ image: null });
    void queryClient.invalidateQueries();
  },
};
