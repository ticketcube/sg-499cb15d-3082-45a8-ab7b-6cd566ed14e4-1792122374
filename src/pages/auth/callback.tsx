import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        let timeoutId: NodeJS.Timeout;

        const handleAuthCallback = async () => {
            try {
                console.log("[AuthCallback] Starting auth callback flow");
                console.log("[AuthCallback] URL:", window.location.href);

                // Set a timeout in case auth state change never fires
                timeoutId = setTimeout(() => {
                    if (mounted) {
                        console.error("[AuthCallback] Auth timeout - no session after 10 seconds");
                        setError("Authentication timed out. Please try signing in again.");
                    }
                }, 10000);

                // Wait for Supabase to process the magic link tokens and fire auth state change
                const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                    console.log("[AuthCallback] Auth event:", event);
                    
                    if (!mounted) return;

                    if (event === "SIGNED_IN" && session) {
                        console.log("[AuthCallback] User signed in:", session.user.id);
                        console.log("[AuthCallback] User email:", session.user.email);

                        // Clear the timeout since we got a successful sign in
                        clearTimeout(timeoutId);

                        // Get redirect path from sessionStorage
                        const redirectPath = sessionStorage.getItem("auth_redirect") || "/game";
                        console.log("[AuthCallback] Redirecting to:", redirectPath);
                        
                        sessionStorage.removeItem("auth_redirect");
                        
                        // Unsubscribe before redirecting
                        subscription.unsubscribe();
                        
                        // Small delay to ensure auth state is fully settled
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        router.replace(redirectPath);
                    } else if (event === "SIGNED_OUT" || event === "USER_DELETED") {
                        console.error("[AuthCallback] Unexpected event:", event);
                        clearTimeout(timeoutId);
                        subscription.unsubscribe();
                        setError("Authentication failed. Please try again.");
                    }
                });

            } catch (error) {
                console.error("[AuthCallback] Error:", error);
                setError("Something went wrong. Please try signing in again.");
                clearTimeout(timeoutId);
            }
        };

        handleAuthCallback();

        return () => {
            mounted = false;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [router]);

    const handleRetryAuth = () => {
        router.replace("/");
    };

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
                <div className="max-w-md w-full mx-4">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 text-center space-y-6 border border-white/20">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white mb-2">Authentication Error</h2>
                            <p className="text-gray-300">{error}</p>
                        </div>
                        <button
                            onClick={handleRetryAuth}
                            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                        >
                            Return to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
            <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                <div className="space-y-2">
                    <p className="text-white text-lg font-medium">Completing sign in...</p>
                    <p className="text-gray-400 text-sm">Setting up your account</p>
                </div>
            </div>
        </div>
    );
}