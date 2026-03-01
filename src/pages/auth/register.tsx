import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthService } from "@/services/authService";
import { useRouter } from "next/router";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log("✅ User already logged in, redirecting to home");
        router.push("/");
      }
    };
    
    checkAuth();
  }, [router]);

  const handleFanDragonSignIn = async () => {
    setLoading(true);
    try {
      const authUrl = AuthService.getFanDragonAuthUrl();
      console.log("🔵 [Register Page] Redirecting to FanDragon:", authUrl);
      
      // Small delay to ensure state is set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      window.location.href = authUrl;
    } catch (error) {
      console.error("❌ [Register Page] Error initiating FanDragon sign-in:", error);
      setLoading(false);
    }
  };

  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="max-w-md mx-auto w-full">
        <CardHeader className="text-center">
          <CardTitle>Create Account</CardTitle>
          <p className="text-muted-foreground">Sign up with your FanDragon account</p>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            className="w-full"
            size="lg"
            onClick={handleFanDragonSignIn}
            disabled={loading}
          >
            <svg
              className="mr-2 h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
            </svg>
            {loading ? "Redirecting..." : "Sign up with FanDragon"}
          </Button>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account? The sign-in process is the same!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}