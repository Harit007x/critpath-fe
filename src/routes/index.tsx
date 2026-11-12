import { Navigate, Outlet, createBrowserRouter, type RouteObject } from "react-router-dom";

import { AUTH_ENABLED } from "@/config/app";

import AppLayout from "@/layouts/app-layout";
import {
  GuestRoute,
  ProtectedRoute,
  RootRedirect,
  SessionWatcher,
} from "@/routes/guards";
import RouteError from "@/routes/route-error";

import LoginPage from "@/pages/login/page";
import SignupPage from "@/pages/signup/page";
import ForgotPasswordPage from "@/pages/forgot-password/page";
import ResetPasswordPage from "@/pages/reset-password/page";
import VerifyEmailPage from "@/pages/verify-email/page";
import HomePage from "@/pages/home/page";
import SettingsPage from "@/pages/settings/page";

// Auth screens. With AUTH_ENABLED they are unreachable while signed in (GuestRoute).
const authPages: RouteObject[] = [
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  // better-auth puts the token on the query string; the :token form is a fallback.
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/reset-password/:token", element: <ResetPasswordPage /> },
];

// The app. With AUTH_ENABLED it needs a session (ProtectedRoute).
const appPages: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { path: "/home", element: <HomePage /> },
      { path: "/settings", element: <SettingsPage /> },
    ],
  },
];

// Email verification: "Check your email", and where the emailed link lands, signed in (on
// to ?next=) or with ?error= for an expired or used link.
const verifyEmail: RouteObject = { path: "/verify-email", element: <VerifyEmailPage /> };

const withAuth: RouteObject[] = [
  { path: "/", element: <RootRedirect /> },
  verifyEmail,
  { element: <GuestRoute />, children: authPages },
  { element: <ProtectedRoute />, children: appPages },
];

// Sign-in disconnected (config/app.ts): every page is public and `/` opens Home.
const withoutAuth: RouteObject[] = [
  { path: "/", element: <Navigate to="/home" replace /> },
  verifyEmail,
  ...authPages,
  ...appPages,
];

export const router = createBrowserRouter([
  {
    element: AUTH_ENABLED ? <SessionWatcher /> : <Outlet />,
    // Any page that throws, including a lazy chunk missing after a deploy (route-error.tsx).
    errorElement: <RouteError />,
    children: [
      ...(AUTH_ENABLED ? withAuth : withoutAuth),
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
