import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { RiErrorWarningLine, RiMailCheckLine } from "@remixicon/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/input";
import { AuthLayout } from "@/components/auth-layout";
import { authService } from "@/services/auth.service";
import { getApiErrorMessage } from "@/lib/errors";

const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Enter the email address you signed up with")
    .email("That doesn’t look like an email address"),
});

type ForgotPasswordFormValues = z.infer<typeof ForgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  /**
   * The address we sent to.
   *
   * Held in state rather than read back off the input: the success view
   * unmounts the form, so a resend that reaches into the DOM for the field
   * finds nothing and silently fails.
   */
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(ForgotPasswordSchema),
    // Errors appear only when the form is submitted — never on keystroke and
    // never on blur, so tabbing through the form stays quiet.
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: { email: "" },
  });

  const send = async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.forgotPassword(email);
      setSentTo(email);
      return true;
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Could not send the link. Check your connection.")
      );
    } finally {
      setIsLoading(false);
    }
    return false;
  };

  const onSubmit = (values: ForgotPasswordFormValues) => void send(values.email);

  const handleResend = async () => {
    if (!sentTo) return;
    if (await send(sentTo)) toast.success("Sent again");
  };

  if (sentTo) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="The link expires in one hour."
      >
        <div className="flex flex-col gap-5">
          <div className="flex gap-3 rounded-lg border border-border bg-muted p-4">
            <RiMailCheckLine className="mt-px size-5 shrink-0 text-primary-ink" />
            <div>
              <p className="text-xs/relaxed font-medium text-foreground">
                Reset link sent
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                We sent it to{" "}
                <span className="text-3xs tabular-nums text-foreground">{sentTo}</span>. If
                it isn’t there in a minute, check your spam folder.
              </p>
            </div>
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          <Button
            variant="outline"
           
            className="w-full"
            onClick={handleResend}
            loading={isLoading}
          >
            {isLoading ? "Sending again…" : "Send it again"}
          </Button>

          <Button asChild variant="ghost" className="w-full">
            <Link to="/login">Back to sign in</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Send yourself a link."
      subtitle="We’ll email a link that lets you set a new password."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          disabled={isLoading}
          {...register("email")}
        />

        {error && <ErrorNote>{error}</ErrorNote>}

        <Button
          type="submit"
         
          className="mt-1 w-full"
          loading={isLoading}
        >
          {isLoading ? "Sending…" : "Send reset link"}
        </Button>

        <Button asChild variant="ghost" className="w-full">
          <Link to="/login">Back to sign in</Link>
        </Button>
      </form>
    </AuthLayout>
  );
}

/** A failure that needs reading, not a toast that disappears while you read it. */
function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="flex gap-2.5 rounded-lg border border-destructive/35 bg-destructive/10 p-3"
    >
      <RiErrorWarningLine className="mt-px size-4 shrink-0 text-destructive" />
      <p className="text-xs text-destructive">{children}</p>
    </div>
  );
}
