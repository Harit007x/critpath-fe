import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { authService, EmailNotVerifiedError } from "@/services/auth.service";
import { getApiErrorMessage } from "@/lib/errors";
import { AuthDivider, AuthLayout, GoogleButton } from "@/components/auth-layout";
import { AgreeToTerms } from "@/components/legal-links";
import { APP_NAME } from "@/config/app";
import { nextPath, verifyEmailPath } from "@/lib/next-path";
import { useAuthRedirectError } from "@/hooks/use-auth-redirect-error";

const LoginSchema = z.object({
  email: z
    .string()
    .min(1, "Enter the email address you signed up with")
    .email("That doesn’t look like an email address"),
  password: z.string().min(1, "Enter your password"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  // After signing in, back to where the user was sent from (e.g. an Authorize page).
  const next = nextPath(search);
  const [isLoading, setIsLoading] = useState(false);
  useAuthRedirectError();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const rememberMe = watch("rememberMe");

  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    if (savedEmail) {
      setValue("email", savedEmail);
      setValue("rememberMe", true);
    }
  }, [setValue]);

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      if (values.rememberMe) localStorage.setItem("savedEmail", values.email);
      else localStorage.removeItem("savedEmail");

      await authService.login(values.email, values.password, values.rememberMe);
      toast.success("Signed in");
      navigate(next);
    } catch (error) {
      if (error instanceof EmailNotVerifiedError) {
        navigate(verifyEmailPath(values.email, next, "signin"));
        return;
      }
      toast.error(getApiErrorMessage(error, "That email and password don’t match."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await authService.signInWithGoogle(next);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Google sign-in failed."));
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back."
      subtitle={`Sign in to pick up where you left off in ${APP_NAME}.`}
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

        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          error={errors.password?.message}
          disabled={isLoading}
          {...register("password")}
        />

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Switch
              id="remember-me"
              size="sm"
              checked={rememberMe}
              onCheckedChange={(checked) => setValue("rememberMe", checked)}
              disabled={isLoading}
            />
            <Label htmlFor="remember-me">Remember me</Label>
          </div>

          <Link
            to="/forgot-password"
            className="text-xs text-primary-ink hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="mt-1 w-full" loading={isLoading}>
          {isLoading ? "Signing in…" : "Sign in"}
        </Button>

        <AuthDivider />

        <GoogleButton onClick={handleGoogleLogin} disabled={isLoading} />

        <AgreeToTerms />

        <p className="text-center text-xs text-muted-foreground">
          No account yet?{" "}
          <Link
            to={`/signup${search}`}
            className="text-primary-ink hover:underline"
          >
            Create one
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
