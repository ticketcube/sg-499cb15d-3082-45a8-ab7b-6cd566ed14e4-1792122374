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
  const [status, setStatus] = useState<string>("Initializing...");

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
          return;
        }

        setStatus("Exchanging authorization code...");
        console.log("Exchanging code for tokens...");
        const tokens = await AuthService.exchangeCodeForTokens(code);
        console.log("Tokens received:", { hasAccessToken: !!tokens.access_token });

        setStatus("Creating secure session...");
        console.log("Creating Supabase session...");
        const sessionData = await AuthService.signInWithFanDragon(tokens);
        console.log("Session created:", { hasSession: !!sessionData });

        setStatus("Loading your profile...");
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log("Refreshing profile...");
        await refreshProfile();

        setStatus("Redirecting to home...");
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log("Authentication complete, redirecting...");
        router.push("/");
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