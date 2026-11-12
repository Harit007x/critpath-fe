import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { nextPath, verifyEmailPath } from "@/lib/next-path";
import { useAuthRedirectError } from "@/hooks/use-auth-redirect-error";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/errors";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/input";
import { AuthDivider, AuthLayout, GoogleButton } from "@/components/auth-layout";
import { AgreeToTerms } from "@/components/legal-links";

const SignupSchema = z.object({
  firstName: z.string().min(1, "Enter your first name"),
  lastName: z.string().min(1, "Enter your last name"),
  email: z
    .string()
    .min(1, "Enter the email you want to sign in with")
    .email("That doesn’t look like an email address"),
  password: z.string().min(1, "Choose a password").min(8, "Use at least 8 characters"),
});

type SignupFormValues = z.infer<typeof SignupSchema>;

export default function SignupPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  // After signing in, back to where the user was sent from (e.g. an Authorize page).
  const next = nextPath(search);
  const [isLoading, setIsLoading] = useState(false);
  useAuthRedirectError();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(SignupSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const onSubmit = async (values: SignupFormValues) => {
    setIsLoading(true);
    try {
      // Resolves true only when the account is usable at once (already verified).
      const signedIn = await authService.signup(
        `${values.firstName} ${values.lastName}`,
        values.email,
        values.password,
        { next },
      );
      if (signedIn) {
        toast.success("Account created");
        navigate(next);
      } else navigate(verifyEmailPath(values.email, next));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not create that account."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await authService.signInWithGoogle(next);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Google sign-up failed."));
      setIsLoading(false);
    }
  };
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Create your account to get started."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="First name"
            autoComplete="given-name"
            placeholder="Jane"
            error={errors.firstName?.message}
            disabled={isLoading}
            {...register("firstName")}
          />
          <TextField
            label="Last name"
            autoComplete="family-name"
            placeholder="Doe"
            error={errors.lastName?.message}
            disabled={isLoading}
            {...register("lastName")}
          />
        </div>

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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={errors.password?.message}
          disabled={isLoading}
          {...register("password")}
        />

        <Button type="submit" className="mt-1 w-full" loading={isLoading}>
          {isLoading ? "Creating account…" : "Create account"}
        </Button>

        <AuthDivider />

        <GoogleButton onClick={handleGoogleLogin} disabled={isLoading} />

        <AgreeToTerms />

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link
            to={`/login${search}`}
            className="text-primary-ink hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
