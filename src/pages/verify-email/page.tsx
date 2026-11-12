import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { RiErrorWarningLine, RiMailCheckLine } from "@remixicon/react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/errors";
import { nextPath } from "@/lib/next-path";
import { authService } from "@/services/auth.service";
import { isSessionActive, useAuthStore } from "@/store/auth-store";

/** The API sends one email to an address a minute at most, so the button waits as long. */
const RESEND_WAIT_S = 60;

const EmailSchema = z.object({
  email: z
    .string()
    .min(1, "Enter the email you signed up with")
    .email("That doesn’t look like an email address"),
});

/**
 * Email verification, open signed in or out. Three ways in: after signing up or signing
 * in unverified (`?email=`, "Check your email"); from the link itself, which Better Auth checks
 * and then redirects here signed in (on to `?next=`) or with `?error=` (expired, used); and
 * without either, a form to have the link sent again.
 */
export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const signedIn = useAuthStore(isSessionActive);
  const next = nextPath(`?${params}`);
  const error = params.get("error");
  // A bad link's `?error=` wins over `?email=` until a new link is sent from the form.
  const [sentTo, setSentTo] = useState(error ? null : params.get("email"));

  if (signedIn && !error) return <Navigate to={next} replace />;

  if (sentTo)
    return (
      <CheckEmail
        email={sentTo}
        fromSignIn={params.get("from") === "signin"}
        next={next}
      />
    );

  return (
    <AuthLayout
      title={error ? linkTitle(error) : "Verify your email"}
      subtitle={
        error
          ? "Send yourself a new one. It works for 24 hours."
          : "Enter the email you signed up with and we’ll send the link again."
      }
    >
      <ResendForm next={next} onSent={setSentTo} />
    </AuthLayout>
  );
}

const linkTitle = (code: string) =>
  code === "TOKEN_EXPIRED" ? "This link has expired" : "This link can’t be used";

function CheckEmail({
  email,
  fromSignIn,
  next,
}: {
  email: string;
  fromSignIn: boolean;
  next: string;
}) {
  const [wait, setWait] = useState(RESEND_WAIT_S);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const resend = async () => {
    setSending(true);
    try {
      await authService.resendVerification(email, next);
      toast.success("Sent again");
      setWait(RESEND_WAIT_S);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not send the email. Try again in a minute."));
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthLayout
      title={fromSignIn ? "Verify your email first" : "Check your email"}
      subtitle="Open the link in it to finish signing up. It works for 24 hours."
    >
      <div className="flex flex-col gap-5">
        <div className="flex gap-3 rounded-lg border border-border bg-muted p-4">
          <RiMailCheckLine className="mt-px size-5 shrink-0 text-primary-ink" />
          <div className="min-w-0">
            <p className="text-xs/relaxed font-medium text-foreground">
              {fromSignIn ? "Your email isn’t verified yet" : "Verification link sent"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              We sent it to{" "}
              <span className="break-all text-3xs tabular-nums text-foreground">{email}</span>.
              If it isn’t there in a minute, check your spam folder.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={resend}
          loading={sending}
          disabled={wait > 0}
        >
          {sending ? "Sending again…" : wait > 0 ? `Send it again in ${wait}s` : "Send it again"}
        </Button>

        <div className="flex flex-col gap-1">
          <Button asChild variant="ghost" className="w-full">
            <Link to="/login">Back to sign in</Link>
          </Button>
          <p className="text-center text-2xs text-muted-foreground">
            Wrong email?{" "}
            <Link to="/signup" className="text-primary-ink hover:underline">
              Sign up again
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

function ResendForm({ next, onSent }: { next: string; onSent: (email: string) => void }) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof EmailSchema>>({
    resolver: zodResolver(EmailSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: { email: "" },
  });

  const onSubmit = async ({ email }: { email: string }) => {
    setSending(true);
    setError(null);
    try {
      await authService.resendVerification(email, next);
      onSent(email);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not send the email. Try again in a minute."));
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        disabled={sending}
        {...register("email")}
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

      <Button type="submit" className="mt-1 w-full" loading={sending}>
        {sending ? "Sending…" : "Send a new link"}
      </Button>

      <Button asChild variant="ghost" className="w-full">
        <Link to="/login">Back to sign in</Link>
      </Button>
    </form>
  );
}
