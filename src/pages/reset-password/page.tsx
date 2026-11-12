import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { RiCheckboxCircleLine, RiErrorWarningLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/input";
import { AuthLayout } from "@/components/auth-layout";
import { authService } from "@/services/auth.service";
import { getApiErrorMessage } from "@/lib/errors";

const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, "Choose a new password")
      .min(6, "Use at least 6 characters"),
    confirmPassword: z.string().min(1, "Type the same password again"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "These two don’t match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof ResetPasswordSchema>;

export default function ResetPasswordPage() {
  const { token: pathToken } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // better-auth puts the token on the query string; the path form is only for
  // links that were sent before that was true.
  const token = pathToken ?? searchParams.get("token") ?? null;
  // It also redirects here with ?error=… rather than a token when the link has
  // already been used or has expired.
  const linkError = searchParams.get("error");

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(ResetPasswordSchema),
    // Errors appear only when the form is submitted — never on keystroke and
    // never on blur, so tabbing through the form stays quiet.
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      await authService.resetPassword(token, values.password);
      setIsSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Could not reset your password. The link may have expired."
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * No token, or better-auth sent us back with an error instead of one: the
   * link is spent. Showing the form here would only produce a password the
   * server has no way to accept, so the screen offers the one thing that can
   * still work.
   */
  if (!token || linkError) {
    return (
      <AuthLayout
        title="This link has expired"
        subtitle="Reset links work once, and only for a short while."
      >
        <div className="flex flex-col gap-5">
          <div
            role="alert"
            className="flex gap-2.5 rounded-lg border border-destructive/35 bg-destructive/10 p-3"
          >
            <RiErrorWarningLine className="mt-px size-4 shrink-0 text-destructive" />
            <p className="text-xs text-destructive">
              Request a new one and it will be the only link that works.
            </p>
          </div>

          <Button asChild className="w-full">
            <Link to="/forgot-password">Send a new link</Link>
          </Button>

          <Button asChild variant="ghost" className="w-full">
            <Link to="/login">Back to sign in</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (isSuccess) {
    return (
      <AuthLayout
        title="Password changed"
        subtitle="Taking you to sign in."
      >
        <div className="flex flex-col gap-5">
          <div className="flex gap-3 rounded-lg border border-border bg-muted p-4">
            <RiCheckboxCircleLine className="mt-px size-5 shrink-0 text-primary-ink" />
            <p className="text-xs text-muted-foreground">
              Your password has been updated. Every other session has been
              signed out.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link to="/login">Sign in now</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="This signs out every other device."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 6 characters"
          error={errors.password?.message}
          disabled={isLoading}
          {...register("password")}
        />

        <TextField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          placeholder="Type it again"
          error={errors.confirmPassword?.message}
          disabled={isLoading}
          {...register("confirmPassword")}
        />

        {error && (
          <div
            role="alert"
            className="flex gap-2.5 rounded-lg border border-destructive/35 bg-destructive/10 p-3"
          >
            <RiErrorWarningLine className="mt-px size-4 shrink-0 text-destructive" />
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        <Button
          type="submit"
         
          className="mt-1 w-full"
          loading={isLoading}
        >
          {isLoading ? "Updating…" : "Update password"}
        </Button>

        <Button asChild variant="ghost" className="w-full">
          <Link to="/login">Back to sign in</Link>
        </Button>
      </form>
    </AuthLayout>
  );
}
