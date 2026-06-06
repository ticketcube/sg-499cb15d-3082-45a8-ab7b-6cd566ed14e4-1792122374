import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Dynamic URL Helper (Vercel-compatible)
const getURL = () => {
  let url = process?.env?.NEXT_PUBLIC_SITE_URL ??
    process?.env?.NEXT_PUBLIC_VERCEL_URL ??
    'http://localhost:3000'

  if (!url) {
    url = 'http://localhost:3000';
  }

  url = url.startsWith('http') ? url : `https://${url}`
  url = url.endsWith('/') ? url : `${url}/`

  return url
}

const FanDragonIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
  </svg>
);

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState < string | null > (null);

  const handleFanDragonSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);

      sessionStorage.setItem("auth_redirect", window.location.pathname);

      console.log("🔄 [AuthDialog] Starting FanDragon OAuth sign in");
      console.log("🔍 [AuthDialog] Current page:", window.location.pathname);

      // ✅ Validate required environment variables FIRST
      const clientId = process.env.NEXT_PUBLIC_FANDRAGON_CLIENT_ID;
      const fandragonBaseUrl = process.env.NEXT_PUBLIC_FANDRAGON_BASE_URL || 'https://fandragon.com';

      if (!clientId) {
        const errorMsg = "FanDragon Client ID is not configured. Please contact support.";
        console.error("❌ [AuthDialog] Missing NEXT_PUBLIC_FANDRAGON_CLIENT_ID");
        setError(errorMsg);
        setIsLoading(false);
        return;
      }

      console.log("✅ [AuthDialog] Client ID validated:", clientId);

      // ✅ Store actual browser path for redirect after auth
      const redirectPath = window.location.pathname + window.location.search;
      sessionStorage.setItem("auth_redirect", redirectPath);
      console.log("✅ [AuthDialog] Stored redirect path in sessionStorage:", redirectPath);

      // ✅ Use getURL() for consistent redirect_uri across environments
      const baseUrl = getURL();
      const redirectUri = `${baseUrl}auth/callback`;
      console.log("✅ [AuthDialog] Base URL:", baseUrl);
      console.log("✅ [AuthDialog] Redirect URI:", redirectUri);

      // Build OAuth URL with proper parameters
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state: crypto.randomUUID(), // CSRF protection
      });

      const fandragonOAuthUrl = `${fandragonBaseUrl}/oauth/consent?${params}`;

      console.log("🚀 [AuthDialog] Redirecting to FanDragon OAuth:", fandragonOAuthUrl);
      console.log("🔍 [AuthDialog] OAuth Parameters:", Object.fromEntries(params));

      window.location.href = fandragonOAuthUrl;

    } catch (err) {
      console.error("❌ [AuthDialog] OAuth error:", err);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign In to Golf4Points</DialogTitle>
          <DialogDescription>
            Continue with your FanDragon account to play and track your scores
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Button
            onClick={handleFanDragonSignIn}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            <svg
              className="mr-2 h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
            </svg>
            {isLoading ? "Redirecting..." : "Continue with FanDragon"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}