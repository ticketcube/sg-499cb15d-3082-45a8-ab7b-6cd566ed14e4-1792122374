import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";

export default function OAuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get("code");
        const errorParam = urlParams.get("error");
        const errorDescription = urlParams.get("error_description");

        // Handle OAuth errors from FanDragon
        if (errorParam) {
          console.error("OAuth error:", errorParam, errorDescription);
          setError(errorDescription || errorParam);
          return;
        }

        // Handle FanDragon OAuth authorization code
        if (authCode) {
          console.log("Processing FanDragon OAuth code...");

          // Call token exchange endpoint
          const exchangeResponse = await fetch("/api/auth/exchange-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: authCode,
              redirect_uri: `${window.location.origin}/auth/callback`,
            }),
          });

          if (!exchangeResponse.ok) {
            const errorData = await exchangeResponse.json();
            console.error("Token exchange failed:", errorData);
            setError(errorData.message || "Authentication failed");
            return;
          }

          const exchangeData = await exchangeResponse.json();

          // Use session URL to authenticate with Supabase
          if (exchangeData.session_url) {
            window.location.href = exchangeData.session_url;
            return;
          }
        }

        // Handle Supabase magic link (email auth)
        const { error: supabaseError } = await supabase.auth.getSession();
        if (supabaseError) {
          console.error("Session error:", supabaseError);
          setError("Failed to establish session");
          return;
        }

        // Get redirect path
        const redirectTo = sessionStorage.getItem("auth_redirect") || "/game";
        sessionStorage.removeItem("auth_redirect");

        // Redirect to original destination
        router.push(redirectTo);

      } catch (err) {
        console.error("Callback error:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      }
    };

    if (router.isReady) {
      handleCallback();
    }
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Completing sign in...</h2>
        <p className="text-gray-600 mt-2">Please wait while we set up your account</p>
      </div>
    </div>
  );
}