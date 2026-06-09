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
import { Mail, CheckCircle2, Trophy, Users, Target } from "lucide-react";

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
  const [isReturningMember, setIsReturningMember] = useState<boolean | null>(null);

  const checkIfReturningMember = async (emailAddress: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', emailAddress)
        .maybeSingle();

      if (error) {
        console.error("[AuthDialog] Error checking user:", error);
        return false;
      }

      return !!data;
    } catch (err) {
      console.error("[AuthDialog] Error:", err);
      return false;
    }
  };

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log("[AuthDialog] Checking if returning member:", email);
      const isReturning = await checkIfReturningMember(email);
      setIsReturningMember(isReturning);

      console.log("[AuthDialog] Sending magic link to:", email, "Returning:", isReturning);

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
    setIsReturningMember(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            {emailSent && isReturningMember 
              ? "Welcome Back, Champion!"
              : "Join the 4Under Club"
            }
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {emailSent 
              ? "Check your email to complete your sign-in"
              : "Fast, Fun and Fair Golf"
            }
          </DialogDescription>
        </DialogHeader>

        {emailSent ? (
          <div className="space-y-6 py-6">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <div className="space-y-3">
                <p className="text-lg font-semibold">
                  {isReturningMember ? "Sign-In Link Sent!" : "Magic Link Sent!"}
                </p>
                <p className="text-sm text-muted-foreground px-4">
                  We sent a secure {isReturningMember ? "sign-in" : "membership"} link to<br />
                  <span className="font-medium text-foreground">{email}</span>
                </p>
                <p className="text-xs text-muted-foreground px-6">
                  {isReturningMember 
                    ? "Click the link to access your account. The link expires in 60 minutes."
                    : "Click the link to complete your membership. The link expires in 60 minutes."
                  }
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
          <div className="space-y-6 py-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-xs text-muted-foreground font-medium">Any Level Can Win</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-xs text-muted-foreground font-medium">Beat Your Target and Win</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-xs text-muted-foreground font-medium">Members Only</p>
              </div>
            </div>

            <form onSubmit={handleMagicLinkSignIn} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="email"
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
                className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                size="lg"
              >
                <Mail className="mr-2 h-5 w-5" />
                {isLoading ? "Checking..." : "Continue"}
              </Button>

              <p className="text-xs text-center text-muted-foreground leading-relaxed">
                By continuing, you agree to our Terms of Service and Privacy Policy.<br />
                No passwords needed — we'll send you a secure sign-in link.
              </p>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}