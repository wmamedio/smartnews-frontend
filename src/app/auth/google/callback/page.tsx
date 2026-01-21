"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleGoogleCallback } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams?.get("code");
      const state = searchParams?.get("state");
      const errorParam = searchParams?.get("error");

      // Handle user canceling OAuth flow
      if (errorParam === "access_denied") {
        setError("Google authentication was canceled. Please try again.");
        setIsProcessing(false);
        return;
      }

      // Check for required parameters
      if (!code || !state) {
        setError("Invalid OAuth callback. Missing required parameters.");
        setIsProcessing(false);
        return;
      }

      try {
        console.log("Processing unified SSO callback with code:", code?.substring(0, 20) + "...");
        console.log("State parameter (raw from Google):", state);

        // Process the unified SSO callback - calls /auth/sso/callback with state EXACTLY as received from Google
        await handleGoogleCallback(code, state);

        console.log("OAuth callback successful, checking user data...");

        // Wait a moment for the user data to be available
        setTimeout(() => {
          const currentUser = useAuthStore.getState().user;
          console.log("Current user after OAuth:", currentUser);

          // Get stored redirect URL (set before OAuth flow)
          const storedRedirectUrl = sessionStorage.getItem("oauth_redirect_url");
          sessionStorage.removeItem("oauth_redirect_url");

          // Check if redirect URL is a valid subscriber page
          const isValidSubscriberRedirect = (url: string | null): boolean => {
            if (!url) return false;
            return url.startsWith("/discover") || url.startsWith("/feed/");
          };

          if (currentUser?.user_type === "creator") {
            console.log("Redirecting to creator dashboard");
            router.push("/dashboard");
          } else if (currentUser?.user_type === "subscriber") {
            // Use stored redirect URL if valid subscriber page, otherwise /subscriptions
            const redirectTo = isValidSubscriberRedirect(storedRedirectUrl)
              ? storedRedirectUrl!
              : "/subscriptions";
            console.log("Redirecting subscriber to:", redirectTo);
            router.push(redirectTo);
          } else {
            console.log("User type not set, redirecting to default dashboard");
            router.push("/dashboard");
          }
        }, 100);
      } catch (err: any) {
        // Log error with helpful context
        if (err.response?.status === 404) {
          console.error("❌ Backend Error: /auth/google/callback endpoint not found (404)");
          console.error("   → The backend needs to implement this endpoint");
        } else if (err.response) {
          const errorDetails = {
            status: err.response.status,
            statusText: err.response.statusText,
            url: err.response.config?.url,
            data: err.response.data || "No error details from server",
          };
          console.error("❌ OAuth callback failed:", errorDetails);
        } else if (err.message) {
          console.error("❌ OAuth error:", err.message);
        } else {
          console.error("❌ Unknown OAuth error:", err);
        }

        // Check if we should auto-redirect based on error type
        const redirectPath = sessionStorage.getItem("oauth_error_redirect");
        if (redirectPath) {
          console.log(`Auto-redirecting to ${redirectPath} after 2 seconds...`);
          const authError = useAuthStore.getState().error;
          setError(authError || "Redirecting...");
          setIsProcessing(false);
          setIsRedirecting(true);

          // Show error briefly, then redirect
          setTimeout(() => {
            sessionStorage.removeItem("oauth_error_redirect");
            router.push(redirectPath);
          }, 2000);
          return;
        }

        // Get error message from auth store (which has better formatting)
        const authError = useAuthStore.getState().error;
        setError(
          authError || err.message || "Failed to complete Google authentication. Please try again."
        );
        setIsProcessing(false);
      }
    };

    if (searchParams) {
      processCallback();
    }
  }, [searchParams, handleGoogleCallback, router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-6"
              >
                <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
              </svg>
            </div>
            <span className="text-xl font-bold">SmartNews</span>
          </Link>
        </div>

        {/* Processing State */}
        {isProcessing && !error && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Completing authentication...</h2>
              <p className="text-muted-foreground">Please wait while we sign you in with Google.</p>
            </div>
          </div>
        )}

        {/* Error State with Auto-Redirect */}
        {error && (
          <div className="space-y-4">
            {/* Show different UI based on whether we're auto-redirecting */}
            {isRedirecting ? (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Redirecting...</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <div className="flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              </>
            ) : (
              <>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Authentication Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>

                <div className="flex flex-col gap-2">
                  <Button onClick={() => router.push("/login")} className="w-full">
                    Return to Login
                  </Button>
                  <Button
                    onClick={() => router.push("/register")}
                    variant="outline"
                    className="w-full"
                  >
                    Create an Account
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="flex justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
