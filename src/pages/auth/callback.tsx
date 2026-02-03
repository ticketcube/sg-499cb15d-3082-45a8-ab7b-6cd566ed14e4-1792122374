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

  useEffect(() => {
    const handleCallback = async () => {
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

        // Exchange code for tokens
        const tokens = await AuthService.exchangeCodeForTokens(code);

        // Sign in with Supabase using FanDragon credentials
        await AuthService.signInWithFanDragon(tokens);

        // Refresh the auth context
        await refreshProfile();

        // Redirect to home
        setTimeout(() => router.push("/"), 500);
      } catch (err) {
        console.error("Callback error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
        setTimeout(() => router.push("/auth/login"), 3000);
      }
    };

    if (router.isReady) {
      handleCallback();
    }
  }, [router, router.isReady, router.query, refreshProfile]);

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