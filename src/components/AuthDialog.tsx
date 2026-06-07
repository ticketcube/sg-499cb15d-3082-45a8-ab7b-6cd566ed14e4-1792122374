import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Mail, CheckCircle2 } from "lucide-react";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log("[AuthDialog] Sending magic link to:", email);

      const redirectPath = window.location.pathname + window.location.search;
      sessionStorage.setItem("auth_redirect", redirectPath);

      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${getURL()}auth/callback`,
        },
      });

      if (signInError) {
        console.error("[AuthDialog] Magic link error:", signInError);
        setError(signInError.message);
        return;
      }

      console.log("[AuthDialog] Magic link sent successfully");
      setEmailSent(true);

    } catch (err) {
      console.error("[AuthDialog] Error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setEmail("");
    setEmailSent(false);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign In to Golf4Points</DialogTitle>
          <DialogDescription>
            {emailSent 
              ? "Check your email for the sign-in link"
              : "Enter your email to receive a magic link"
            }
          </DialogDescription>
        </DialogHeader>

        {emailSent ? (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Magic link sent to {email}
                </p>
                <p className="text-xs text-muted-foreground">
                  Click the link in your email to sign in. You can close this window.
                </p>
              </div>
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full"
              >
                Use a different email
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleMagicLinkSignIn} className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-12"
                autoComplete="email"
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email}
              className="w-full"
              size="lg"
            >
              <Mail className="mr-2 h-5 w-5" />
              {isLoading ? "Sending..." : "Send Magic Link"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}