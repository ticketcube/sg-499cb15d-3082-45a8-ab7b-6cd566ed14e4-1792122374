import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthService } from "@/services/authService";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleFanDragonSignIn = async () => {
    setLoading(true);
    try {
      const authUrl = AuthService.getFanDragonAuthUrl();
      console.log("🔵 Redirecting to FanDragon:", authUrl);
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error initiating FanDragon sign-in:", error);
      setLoading(false);
    }
  };

  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="max-w-md mx-auto w-full">
        <CardHeader className="text-center">
          <CardTitle>Sign In to Golf4Points</CardTitle>
          <p className="text-muted-foreground">Continue with your FanDragon account</p>
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
            {loading ? "Redirecting..." : "Sign in with FanDragon"}
          </Button>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}