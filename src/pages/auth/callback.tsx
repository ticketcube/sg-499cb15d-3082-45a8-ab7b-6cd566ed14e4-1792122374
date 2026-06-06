import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                console.log('🔄 [AuthCallback] Starting OAuth callback processing');
                console.log('🔍 [AuthCallback] Current URL:', window.location.href);
                console.log('🔍 [AuthCallback] URL Hash:', window.location.hash);
                console.log('🔍 [AuthCallback] URL Search:', window.location.search);

                // Parse URL parameters
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const urlParams = new URLSearchParams(window.location.search);

                console.log('🔍 [AuthCallback] Hash params:', Object.fromEntries(hashParams));
                console.log('🔍 [AuthCallback] URL params:', Object.fromEntries(urlParams));

                // Check for OAuth provider errors
                const errorParam = hashParams.get('error') || urlParams.get('error');
                const errorDescription = hashParams.get('error_description') || urlParams.get('error_description');

                if (errorParam) {
                    console.error('❌ [AuthCallback] OAuth provider error:', errorParam);
                    console.error('❌ [AuthCallback] Error description:', errorDescription);
                    setError(`OAuth error: ${errorDescription || errorParam}`);
                    return;
                }

                // ✅ NEW: Check for FanDragon OAuth authorization code
                const authCode = urlParams.get('code');
                
                if (authCode) {
                    console.log('🔄 [AuthCallback] FanDragon authorization code received');
                    console.log('🔍 [AuthCallback] Code (first 10 chars):', authCode.substring(0, 10) + '...');

                    // Call our token exchange endpoint
                    console.log('🔄 [AuthCallback] Calling token exchange endpoint');
                    const exchangeResponse = await fetch('/api/auth/exchange-token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            code: authCode,
                            redirect_uri: `${window.location.origin}/auth/callback`,
                        }),
                    });

                    if (!exchangeResponse.ok) {
                        const errorData = await exchangeResponse.json();
                        console.error('❌ [AuthCallback] Token exchange failed:', errorData);
                        setError(errorData.error || 'Failed to exchange authorization code');
                        return;
                    }

                    const exchangeData = await exchangeResponse.json();
                    console.log('✅ [AuthCallback] Token exchange successful');
                    console.log('✅ [AuthCallback] User ID:', exchangeData.user.id);

                    // Use the session URL to authenticate with Supabase
                    if (exchangeData.session_url) {
                        console.log('🔄 [AuthCallback] Using magic link session URL');
                        window.location.href = exchangeData.session_url;
                        return;
                    }
                }

                // ✅ FALLBACK: Check for existing Supabase session (email auth or magic link)
                const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

                console.log('🔍 [AuthCallback] Session data:', sessionData);
                console.log('🔍 [AuthCallback] Session error:', sessionError);

                if (sessionError) {
                    console.error('❌ [AuthCallback] Session error:', sessionError);
                    setError('Authentication failed. Please try again.');
                    return;
                }

                if (!sessionData.session || !sessionData.session.user) {
                    console.error('❌ [AuthCallback] No session found');

                    // Check if we have OAuth params but no session yet
                    if (hashParams.get('access_token') || urlParams.get('code')) {
                        console.log('🔄 [AuthCallback] OAuth params found, waiting for session...');
                        // Wait a bit longer for session to be established
                        setTimeout(handleAuthCallback, 1500);
                        return;
                    }

                    console.error('❌ [AuthCallback] No OAuth params and no session');
                    setError('No authentication session found. Please try signing in again.');
                    return;
                }

                const user = sessionData.session.user;
                console.log('✅ [AuthCallback] User authenticated:', user.id);
                console.log('✅ [AuthCallback] User email:', user.email);
                console.log('✅ [AuthCallback] User provider:', user.app_metadata?.provider);

                // Get redirect path from sessionStorage
                const redirectPath = sessionStorage.getItem("auth_redirect") || "/my-cubes";
                console.log('✅ [AuthCallback] Redirecting to:', redirectPath);
                
                // Clear the stored redirect
                sessionStorage.removeItem("auth_redirect");

                // Redirect to original destination
                router.replace(redirectPath);

            } catch (error) {
                console.error('❌ [AuthCallback] Error in auth callback:', error);
                setError('Something went wrong. Please try signing in again.');
            } finally {
                setLoading(false);
            }
        };

        handleAuthCallback();
    }, [router]);

    const handleRetryAuth = () => {
        router.replace('/');
    };

    if (loading) {
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

    return null;
}