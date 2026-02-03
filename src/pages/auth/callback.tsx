import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AuthService } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent multiple executions
      if (processing) return;

      try {
        const { code, error: oauthError } = router.query;

        if (oauthError) {
          setError(`OAuth error: ${oauthError}`);
          setTimeout(() => router.push("/auth/login"), 3000);
          return;
        }

        if (!code || typeof code !== "string") {
          return; // Still loading
        }

        setProcessing(true);

        console.log("Exchanging code for tokens...");
        // Exchange code for tokens
        const tokens = await AuthService.exchangeCodeForTokens(code);
        console.log("Tokens received:", { hasAccessToken: !!tokens.access_token });

        console.log("Signing in with FanDragon...");
        // Sign in with Supabase using FanDragon credentials
        const sessionData = await AuthService.signInWithFanDragon(tokens);
        console.log("Session created:", { hasSession: !!sessionData });

        // Wait a moment for auth state to propagate
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Refresh the auth context to pick up the new session
        console.log("Refreshing profile...");
        await refreshProfile();

        console.log("Redirecting to home...");
        // Redirect to home
        router.push("/");
      } catch (err) {
        console.error("Callback error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
        setTimeout(() => router.push("/auth/login"), 3000);
      } finally {
        setProcessing(false);
      }
    };

    if (router.isReady && !processing) {
      handleCallback();
    }
  }, [router, router.isReady, router.query, refreshProfile, processing]);

  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="max-w-md mx-auto w-full">
        <CardHeader className="text-center">
          <CardTitle>
            {error ? "Authentication Error" : "Authenticating..."}
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
              <p className="text-muted-foreground">
                Completing your sign in with FanDragon...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}