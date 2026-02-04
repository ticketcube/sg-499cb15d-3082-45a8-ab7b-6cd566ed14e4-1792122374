import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AuthService } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthCallback() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const { code, state, error: oauthError } = router.query;

      if (oauthError) {
        setError(oauthError as string);
        return;
      }

      if (!code || typeof code !== "string") {
        return;
      }

      try {
        // Validate state parameter to prevent CSRF attacks
        if (typeof window !== "undefined") {
          const storedState = sessionStorage.getItem("oauth_state");
          if (!state || state !== storedState) {
            throw new Error("Invalid state parameter - possible CSRF attack");
          }
          // Clear the state after validation
          sessionStorage.removeItem("oauth_state");
        }

        // Exchange code for tokens
        const tokens = await AuthService.exchangeCodeForTokens(code);

        // Sign in with FanDragon tokens
        await AuthService.signInWithFanDragon(tokens);

        // Refresh the user profile in context
        await refreshProfile();

        // Redirect to home page
        router.push("/");
      } catch (err) {
        console.error("Auth callback error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
      }
    };

    if (router.isReady) {
      handleCallback();
    }
  }, [router, refreshProfile]);

  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="max-w-md mx-auto w-full">
        <CardHeader className="text-center">
          <CardTitle>
            {error ? "Authentication Error" : "Authenticating with FanDragon"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {error ? (
            <div className="space-y-4">
              <p className="text-destructive">{error}</p>
              <p className="text-sm text-muted-foreground">
                Redirecting to login page...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-muted-foreground">{status}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}