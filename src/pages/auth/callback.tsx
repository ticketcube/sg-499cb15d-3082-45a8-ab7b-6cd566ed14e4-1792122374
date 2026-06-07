import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>("Completing sign in...");

    useEffect(() => {
        let mounted = true;
        let authTimeoutId: NodeJS.Timeout;
        let pollIntervalId: NodeJS.Timeout;

        const pollForProfile = async (userId: string): Promise<boolean> => {
            console.log("[AuthCallback] Polling for profile:", userId);
            
            const { data, error } = await supabase
                .from("user_profiles")
                .select("id")
                .eq("user_id", userId)
                .maybeSingle();

            if (error) {
                console.error("[AuthCallback] Profile fetch error:", error);
                return false;
            }

            const exists = !!data;
            console.log("[AuthCallback] Profile exists:", exists);
            return exists;
        };

        const waitForProfile = async (userId: string): Promise<boolean> => {
            const maxAttempts = 10; // 10 attempts over 5 seconds
            const delayMs = 500;
            
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                if (!mounted) return false;
                
                console.log(`[AuthCallback] Profile check attempt ${attempt}/${maxAttempts}`);
                const exists = await pollForProfile(userId);
                
                if (exists) {
                    console.log("[AuthCallback] Profile found!");
                    return true;
                }
                
                if (attempt < maxAttempts) {
                    setStatus(`Setting up your account... (${attempt}/${maxAttempts})`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            }
            
            console.error("[AuthCallback] Profile not found after polling");
            return false;
        };

        const handleAuthCallback = async () => {
            try {
                console.log("[AuthCallback] Starting auth callback flow");
                console.log("[AuthCallback] URL:", window.location.href);

                // Set a timeout in case auth state change never fires
                authTimeoutId = setTimeout(() => {
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
                        clearTimeout(authTimeoutId);

                        // Wait for profile to be created by the database trigger
                        setStatus("Setting up your account...");
                        const profileExists = await waitForProfile(session.user.id);

                        if (!mounted) return;

                        if (!profileExists) {
                            console.error("[AuthCallback] Profile creation failed or timed out");
                            setError("Account setup incomplete. Please contact support or try signing in again.");
                            subscription.unsubscribe();
                            return;
                        }

                        // Get redirect path from sessionStorage
                        const redirectPath = sessionStorage.getItem("auth_redirect") || "/game";
                        console.log("[AuthCallback] Redirecting to:", redirectPath);
                        
                        sessionStorage.removeItem("auth_redirect");
                        
                        // Unsubscribe before redirecting
                        subscription.unsubscribe();
                        
                        // Small final delay to ensure state is fully settled
                        setStatus("Complete! Redirecting...");
                        await new Promise(resolve => setTimeout(resolve, 300));
                        
                        router.replace(redirectPath);
                    } else if (event === "SIGNED_OUT" || event === "USER_DELETED") {
                        console.error("[AuthCallback] Unexpected event:", event);
                        clearTimeout(authTimeoutId);
                        subscription.unsubscribe();
                        setError("Authentication failed. Please try again.");
                    }
                });

            } catch (error) {
                console.error("[AuthCallback] Error:", error);
                setError("Something went wrong. Please try signing in again.");
                clearTimeout(authTimeoutId);
            }
        };

        handleAuthCallback();

        return () => {
            mounted = false;
            if (authTimeoutId) clearTimeout(authTimeoutId);
            if (pollIntervalId) clearInterval(pollIntervalId);
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
                    <p className="text-white text-lg font-medium">{status}</p>
                    <p className="text-gray-400 text-sm">This usually takes just a moment</p>
                </div>
            </div>
        </div>
    );
}