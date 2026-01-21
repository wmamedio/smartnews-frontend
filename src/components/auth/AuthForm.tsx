"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Sparkles, BookOpen, ArrowRight, Newspaper } from "lucide-react";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { calculatePasswordStrength } from "@/lib/utils/password-strength";
import { Logo } from "@/components/common/Logo";

// Schemas
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[!@#$%^&*]/, "Password must contain at least one special character"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

// Combined form data type - firstName and lastName are optional for login mode
type FormData = {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
};

interface AuthFormProps {
  mode: "login" | "register";
  userType: "creator" | "subscriber";
}

const config = {
  creator: {
    icon: Sparkles,
    iconBg: "bg-primary/10 text-primary",
    registerTitle: "Become a Creator",
    switchTypeLink: {
      register: { href: "/register/subscriber", text: "Looking to subscribe to feeds instead?" },
    },
    testimonial: {
      quote:
        "SmartNews has transformed how I share content with my audience. The revenue model is transparent and fair, and I love having control over my content curation.",
      author: "Sofia Davis - Content Creator",
    },
  },
  subscriber: {
    icon: BookOpen,
    iconBg: "bg-secondary/10 text-secondary",
    registerTitle: "Become a Subscriber",
    switchTypeLink: {
      register: { href: "/register/creator", text: "Want to become a creator instead?" },
    },
    testimonial: {
      quote:
        "Subscribing to curated feeds on SmartNews has saved me hours of scrolling. I now get the best content from my favorite creators delivered right to my inbox.",
      author: "Alex Johnson - Subscriber",
    },
  },
};

function AuthFormContent({ mode, userType }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const { login, register: registerUser, isLoading, error, clearError } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const cfg = config[userType];
  const isLogin = mode === "login";

  // Select schema based on mode
  const schema = isLogin ? loginSchema : registerSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    mode: "onChange",
  });

  const password = watch("password") || "";
  const passwordStrength = !isLogin ? calculatePasswordStrength(password) : null;

  // Check if redirect URL is a valid subscriber page
  const isValidSubscriberRedirect = (url: string | null): boolean => {
    if (!url) return false;
    return url.startsWith("/discover") || url.startsWith("/feed/");
  };

  const onSubmit = async (data: FormData) => {
    clearError();
    try {
      if (isLogin) {
        await login({
          email: data.email,
          password: data.password,
          rememberMe: false,
        });
        // Get user type from auth store after login
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.user_type === "subscriber") {
          // Subscribers: use redirect URL if valid subscriber page, otherwise /subscriptions
          router.push(isValidSubscriberRedirect(redirectUrl) ? redirectUrl! : "/subscriptions");
        } else {
          // Creators: use redirect URL or default to /dashboard
          router.push(redirectUrl || "/dashboard");
        }
      } else {
        const registerData = data as RegisterFormData;
        await registerUser({
          email: registerData.email,
          password: registerData.password,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          user_type: userType,
        });
        router.push(userType === "creator" ? "/dashboard" : redirectUrl || "/subscriptions");
      }
    } catch {
      // Error is handled in the store
    }
  };

  const title = isLogin ? "Dive Back In" : cfg.registerTitle;
  const switchModeLink = isLogin
    ? { href: "/register/creator", text: "Sign up" }
    : { href: "/login", text: "Sign in" };
  const switchModeText = isLogin ? "Don't have an account?" : "Already have an account?";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        {/* Header */}
        <div className="flex justify-between items-center">
          <Logo href="/" size="md" />
          <Button variant="outline" size="sm" asChild>
            <Link href="/discover">
              Discover Feeds
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Form */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
              {/* Title Section */}
              <div className="flex flex-col items-center gap-2 text-center">
                {isLogin ? (
                  <div className="p-3 rounded-lg bg-primary/10 text-primary mb-2">
                    <Newspaper className="h-6 w-6" />
                  </div>
                ) : (
                  <div className={`p-3 rounded-lg ${cfg.iconBg} mb-2`}>
                    {userType === "creator" ? (
                      <Sparkles className="h-6 w-6" />
                    ) : (
                      <BookOpen className="h-6 w-6" />
                    )}
                  </div>
                )}
                <h1 className="text-2xl font-bold">{title}</h1>
                {isLogin && (
                  <p className="text-sm text-muted-foreground">Your curated feeds await</p>
                )}
                {!isLogin && (
                  <Link
                    href={cfg.switchTypeLink.register.href}
                    className="text-sm text-primary hover:underline underline-offset-4"
                  >
                    {cfg.switchTypeLink.register.text}
                  </Link>
                )}
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {typeof error === "string" ? error : `An error occurred during ${mode}`}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4">
                {/* Google OAuth */}
                <GoogleOAuthButton mode={mode} userType={userType} redirectUrl={redirectUrl} />

                <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                  <span className="relative z-10 bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>

                {/* Name Fields (register only) */}
                {!isLogin && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        disabled={isLoading}
                        autoFocus
                        {...register("firstName")}
                      />
                      {errors.firstName && (
                        <p className="text-sm text-destructive">{errors.firstName.message}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        disabled={isLoading}
                        {...register("lastName")}
                      />
                      {errors.lastName && (
                        <p className="text-sm text-destructive">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Email Field */}
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    disabled={isLoading}
                    autoFocus={isLogin}
                    {...register("email", {
                      onBlur: () => setEmailTouched(true),
                    })}
                  />
                  {emailTouched && errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="grid gap-2">
                  {isLogin ? (
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        href="/forgot-password"
                        className="ml-auto text-sm underline-offset-4 hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  ) : (
                    <Label htmlFor="password">Password</Label>
                  )}
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={isLogin ? "Enter your password" : "Create a strong password"}
                      disabled={isLoading}
                      className="pr-8"
                      {...register("password")}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {/* Password Strength Indicator (register only) */}
                  {!isLogin && password && passwordStrength && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Strength:</span>
                        <span className={`text-xs font-medium ${passwordStrength.color}`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        {[0, 1, 2, 3, 4].map((level) => {
                          let barColor = "bg-muted";
                          if (level < passwordStrength.score) {
                            if (passwordStrength.score <= 2) barColor = "bg-destructive";
                            else if (passwordStrength.score <= 3) barColor = "bg-secondary";
                            else barColor = "bg-primary";
                          }
                          return (
                            <div key={level} className={`h-1 flex-1 rounded-full ${barColor}`} />
                          );
                        })}
                      </div>
                      {passwordStrength.suggestions.length > 0 && (
                        <ul
                          className={`text-xs space-y-1 ${passwordFocused ? "text-muted-foreground" : "text-destructive"}`}
                        >
                          {passwordStrength.suggestions.slice(0, 2).map((suggestion, index) => (
                            <li key={index} className="flex items-center">
                              <span className="w-1 h-1 bg-current rounded-full mr-2" />
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isLoading ||
                    (!isLogin && !!passwordStrength && passwordStrength.suggestions.length > 0)
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isLogin ? "Signing in..." : "Creating account..."}
                    </>
                  ) : isLogin ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </Button>

                {/* Terms Text (register only) */}
                {!isLogin && (
                  <p className="text-xs text-center text-muted-foreground whitespace-nowrap">
                    By signing up, you agree to our{" "}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms
                    </Link>{" "}
                    &{" "}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy
                    </Link>
                  </p>
                )}
              </div>

              {/* Switch Mode Link */}
              <div className="text-center text-sm">
                {switchModeText}{" "}
                <Link href={switchModeLink.href} className="underline underline-offset-4">
                  {switchModeLink.text}
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right Panel - Testimonial */}
      <div className="relative hidden lg:block bg-muted">
        <div className="absolute inset-0 bg-gradient-to-t from-primary to-secondary" />
        <div className="relative h-full p-10 text-white flex flex-col justify-end">
          <blockquote className="space-y-2">
            <p className="text-lg">&quot;{cfg.testimonial.quote}&quot;</p>
            <footer className="text-sm">{cfg.testimonial.author}</footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}

export function AuthForm(props: AuthFormProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AuthFormContent {...props} />
    </Suspense>
  );
}
