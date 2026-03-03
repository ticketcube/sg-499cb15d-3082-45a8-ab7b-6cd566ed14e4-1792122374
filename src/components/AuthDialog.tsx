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

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleFanDragonSignIn = async () => {
    try {
      setIsLoading(true);

      // Save current page for redirect after auth
      sessionStorage.setItem("auth_redirect", window.location.pathname);

      // Build FanDragon OAuth URL
      const fandragonBaseUrl = process.env.NEXT_PUBLIC_FANDRAGON_BASE_URL || "https://fandragon.com";
      const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_FANDRAGON_CLIENT_ID!,
        redirect_uri: `${window.location.origin}/auth/callback`,
        response_type: "code",
        scope: "openid email profile",
        state: crypto.randomUUID(), // CSRF protection
      });

      const fandragonOAuthUrl = `${fandragonBaseUrl}/oauth/consent?${params}`;

      console.log("🔵 [AuthDialog] Redirecting to FanDragon:", fandragonOAuthUrl);

      // Redirect to FanDragon
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