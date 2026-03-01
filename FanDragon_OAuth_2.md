# FanDragon OAuth 2.0 Integration Guide

## Overview

This guide shows you how to add "Sign in with FanDragon" to your partner applications using the **OAuth 2.0 Authorization Code flow**.

FanDragon provides secure OAuth 2.0 authorization, allowing users to sign in once and access all partner apps seamlessly. Users can authenticate with Google, Apple, or email through FanDragon, and your app receives a verified user session.

---

## Prerequisites

Before integrating, you need:

1. **OAuth Client Registration** - Your app must be registered in FanDragon's `oauth_clients` database table
2. **Client Credentials** - You'll receive:
   - `client_id` - Your unique identifier (format: `appname_client_uuid`)
   - `client_secret` - Secret key for token exchange (keep secure!)
3. **Redirect URI** - Your app's OAuth callback endpoint (must be pre-registered)
4. **Supabase Project** - FanDragon OAuth integrates with Supabase authentication

---

## Quick Start (4 Steps)

### Step 1: Environment Variables Setup

Add these to your `.env.local` file:

```bash
# FanDragon OAuth Configuration
NEXT_PUBLIC_FANDRAGON_CLIENT_ID=your_app_client_uuid
FANDRAGON_CLIENT_SECRET=your_secret_key_here
NEXT_PUBLIC_FANDRAGON_BASE_URL=https://fandragon.com

# Supabase Configuration (for session management)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**⚠️ CRITICAL SECURITY NOTES:**
- `FANDRAGON_CLIENT_SECRET` - Server-side only, NEVER expose in client code
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side only, NEVER expose in client code
- `NEXT_PUBLIC_*` variables are safe to use in browser
- For sandbox/testing, use `NEXT_PUBLIC_FANDRAGON_BASE_URL=https://fandragon.softgen.dev`

---

### Step 2: Create Server-Side Token Exchange Endpoint

**File:** `src/pages/api/auth/exchange-token.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin client (server-side only)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { code, redirect_uri } = req.body;

    if (!code || !redirect_uri) {
        return res.status(400).json({ 
            error: 'missing_parameters',
            message: 'Code and redirect_uri are required' 
        });
    }

    try {
        const fandragonBaseUrl = process.env.NEXT_PUBLIC_FANDRAGON_BASE_URL || 'https://fandragon.com';

        // Step 1: Exchange authorization code for access token
        const tokenResponse = await fetch(`${fandragonBaseUrl}/oauth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code: code,
                client_id: process.env.NEXT_PUBLIC_FANDRAGON_CLIENT_ID,
                client_secret: process.env.FANDRAGON_CLIENT_SECRET,
                redirect_uri: redirect_uri,
            }),
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            return res.status(tokenResponse.status).json({
                error: 'token_exchange_failed',
                message: errorData.error_description || 'Failed to exchange authorization code',
                details: errorData,
            });
        }

        const tokenData = await tokenResponse.json();

        // Step 2: Fetch user profile from FanDragon
        const userInfoResponse = await fetch(`${fandragonBaseUrl}/oauth/userinfo`, {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
            },
        });

        if (!userInfoResponse.ok) {
            return res.status(userInfoResponse.status).json({
                error: 'userinfo_failed',
                message: 'Failed to fetch user information',
            });
        }

        const userInfo = await userInfoResponse.json();

        // Step 3: Create or update user in Supabase
        const email = userInfo.email;
        const fandragonUserId = userInfo.id;

        // Check if user exists in Supabase
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        let supabaseUser = existingUsers?.users?.find(u => u.email === email);

        if (!supabaseUser) {
            // Create new user via Supabase Admin API
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                email_confirm: true,
                user_metadata: {
                    full_name: userInfo.name || userInfo.display_name,
                    avatar_url: userInfo.avatar_url,
                    fandragon_user_id: fandragonUserId,
                },
            });

            if (createError) {
                return res.status(500).json({
                    error: 'user_creation_failed',
                    message: createError.message,
                });
            }

            supabaseUser = newUser.user;
        }

        // Step 4: Update user profile with FanDragon ID (if not already set)
        const { error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .upsert({
                id: supabaseUser!.id,
                fandragon_user_id: fandragonUserId,
                display_name: userInfo.display_name || userInfo.name,
                avatar_url: userInfo.avatar_url,
                email: email,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'id',
            });

        if (profileError) {
            console.error('Profile update error:', profileError);
        }

        // Step 5: Generate Supabase magic link session
        const { data: magicLinkData, error: magicLinkError } = 
            await supabaseAdmin.auth.admin.generateLink({
                type: 'magiclink',
                email: email,
            });

        if (magicLinkError || !magicLinkData) {
            return res.status(500).json({
                error: 'session_creation_failed',
                message: 'Failed to create session',
            });
        }

        // Step 6: Return session URL for client-side authentication
        return res.status(200).json({
            success: true,
            session_url: magicLinkData.properties.action_link,
            user: {
                id: supabaseUser!.id,
                email: email,
                display_name: userInfo.display_name || userInfo.name,
                avatar_url: userInfo.avatar_url,
                fandragon_user_id: fandragonUserId,
            },
        });

    } catch (error) {
        console.error('Token exchange error:', error);
        return res.status(500).json({
            error: 'server_error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
```

---

### Step 3: Create OAuth Callback Page

**File:** `src/pages/auth/callback.tsx`

```typescript
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
                const authCode = urlParams.get('code');
                const errorParam = urlParams.get('error');
                const errorDescription = urlParams.get('error_description');

                // Handle OAuth errors from FanDragon
                if (errorParam) {
                    console.error('OAuth error:', errorParam, errorDescription);
                    setError(errorDescription || errorParam);
                    return;
                }

                // Handle FanDragon OAuth authorization code
                if (authCode) {
                    console.log('Processing FanDragon OAuth code...');

                    // Call token exchange endpoint
                    const exchangeResponse = await fetch('/api/auth/exchange-token', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            code: authCode,
                            redirect_uri: `${window.location.origin}/auth/callback`,
                        }),
                    });

                    if (!exchangeResponse.ok) {
                        const errorData = await exchangeResponse.json();
                        console.error('Token exchange failed:', errorData);
                        setError(errorData.message || 'Authentication failed');
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
                    console.error('Session error:', supabaseError);
                    setError('Failed to establish session');
                    return;
                }

                // Get redirect path
                const redirectTo = sessionStorage.getItem('auth_redirect') || '/';
                sessionStorage.removeItem('auth_redirect');

                // Redirect to original destination
                router.push(redirectTo);

            } catch (err) {
                console.error('Callback error:', err);
                setError(err instanceof Error ? err.message : 'An unexpected error occurred');
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
                            onClick={() => router.push('/')}
                            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
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
                <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">Completing sign in...</h2>
                <p className="text-gray-600 mt-2">Please wait while we set up your account</p>
            </div>
        </div>
    );
}
```

---

### Step 4: Add "Sign in with FanDragon" Button

**File:** `src/components/AuthDialog.tsx` (or your login component)

```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AuthDialog() {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);

            // Save current page for redirect after auth
            sessionStorage.setItem('auth_redirect', window.location.pathname);

            // Build FanDragon OAuth URL
            const fandragonBaseUrl = process.env.NEXT_PUBLIC_FANDRAGON_BASE_URL || 'https://fandragon.com';
            const params = new URLSearchParams({
                client_id: process.env.NEXT_PUBLIC_FANDRAGON_CLIENT_ID!,
                redirect_uri: `${window.location.origin}/auth/callback`,
                response_type: 'code',
                scope: 'openid email profile',
                state: crypto.randomUUID(), // CSRF protection
            });

            const fandragonOAuthUrl = `${fandragonBaseUrl}/oauth/consent?${params}`;

            // Redirect to FanDragon
            window.location.href = fandragonOAuthUrl;

        } catch (err) {
            console.error('OAuth error:', err);
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <Button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full"
            >
                {isLoading ? 'Redirecting...' : 'Continue with Google'}
            </Button>
        </div>
    );
}
```

---

## Complete Integration Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. User clicks "Continue with Google" (or Apple)                    │
│    → Saves current page path in sessionStorage                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. Redirects to fandragon.com/oauth/consent                         │
│    ?client_id=xxx&redirect_uri=xxx&scope=xxx&state=xxx              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. FanDragon handles authentication                                 │
│    - User logs in with Google/Apple/Email                           │
│    - User approves consent (or auto-approves if already authorized) │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. FanDragon redirects back with authorization code                 │
│    https://your-app.com/auth/callback?code=xxx&state=xxx            │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. Your callback page calls /api/auth/exchange-token                │
│    POST with { code, redirect_uri }                                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. Server exchanges code with FanDragon                             │
│    - Calls fandragon.com/oauth/token                                │
│    - Receives access_token                                          │
│    - Fetches user profile from /oauth/userinfo                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 7. Server creates/updates Supabase user                             │
│    - Creates user if doesn't exist                                  │
│    - Links FanDragon ID to user profile                             │
│    - Generates Supabase session (magic link)                        │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 8. Returns session URL to callback page                             │
│    Callback redirects to session URL → Establishes Supabase session │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 9. User redirected to original page (from sessionStorage)           │
│    → Fully authenticated with both FanDragon and Supabase           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Requirements

Your Supabase project needs a `user_profiles` table to store FanDragon user mappings:

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  fandragon_user_id TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);
```

---

## API Response Reference

### Token Exchange Success Response

```json
{
  "success": true,
  "session_url": "https://your-project.supabase.co/auth/v1/verify?token=...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "display_name": "John Doe",
    "avatar_url": "https://...",
    "fandragon_user_id": "fd_user_abc123"
  }
}
```

### Token Exchange Error Response

```json
{
  "error": "token_exchange_failed",
  "message": "Authorization code is invalid or expired",
  "details": {
    "error": "invalid_grant",
    "error_description": "Authorization code has expired"
  }
}
```

---

## Security Best Practices

### 1. **Protect Secrets**
```bash
# ✅ Server-side only (API routes)
FANDRAGON_CLIENT_SECRET=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# ✅ Public (safe in browser)
NEXT_PUBLIC_FANDRAGON_CLIENT_ID=xxx
NEXT_PUBLIC_FANDRAGON_BASE_URL=xxx
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### 2. **Always Use HTTPS**
- Production redirect URIs must use `https://`
- Localhost exempt for development (`http://localhost:3000`)

### 3. **Validate Redirect URIs**
FanDragon validates that the `redirect_uri` matches your registered URLs exactly.

### 4. **CSRF Protection**
Use the `state` parameter (the example uses `crypto.randomUUID()`). While this implementation doesn't verify state on callback, you can add verification by storing state in sessionStorage before redirect and comparing on callback.

### 5. **Token Storage**
- **Server-side**: Use Supabase session management (handled automatically)
- **Client-side**: Never store `client_secret` or `service_role_key`

---

## Testing Your Integration

### Test Checklist

- [ ] **Environment variables set correctly**
  - Verify `NEXT_PUBLIC_FANDRAGON_CLIENT_ID`
  - Verify `FANDRAGON_CLIENT_SECRET` is server-side only
  - Verify `NEXT_PUBLIC_FANDRAGON_BASE_URL` points to correct environment

- [ ] **Authorization flow works**
  - Click "Continue with Google" button
  - Redirects to FanDragon consent page
  - Can authenticate with Google/Apple/Email
  - Redirects back to your app

- [ ] **Token exchange succeeds**
  - Check browser network tab for `/api/auth/exchange-token` call
  - Verify 200 response
  - Check server logs for detailed flow

- [ ] **User session created**
  - User is logged into Supabase
  - User profile created/updated with FanDragon ID
  - User redirected to original page

- [ ] **Error handling works**
  - Try with invalid credentials (should show error)
  - Try declining consent (should handle gracefully)

---

## Troubleshooting

### "Invalid client credentials"
- Verify `NEXT_PUBLIC_FANDRAGON_CLIENT_ID` and `FANDRAGON_CLIENT_SECRET` are correct
- Check that your OAuth client is active in FanDragon database

### "Redirect URI not allowed"
- Ensure your callback URL is registered in FanDragon's `oauth_clients.redirect_uris`
- Check for exact match (trailing slashes, http vs https)

### "Token exchange failed"
- Check server logs for detailed error messages
- Verify `FANDRAGON_CLIENT_SECRET` is set correctly
- Ensure authorization code hasn't expired (10-minute lifetime)

### "Session creation failed"
- Verify Supabase credentials are correct
- Check that `SUPABASE_SERVICE_ROLE_KEY` is set
- Ensure user email is valid

### User not redirected after auth
- Check browser console for errors
- Verify `sessionStorage.getItem('auth_redirect')` has a value
- Check that callback page completes without errors

---

## Environment-Specific Configuration

### Production
```bash
NEXT_PUBLIC_FANDRAGON_BASE_URL=https://fandragon.com
NEXT_PUBLIC_FANDRAGON_CLIENT_ID=your_production_client_id
FANDRAGON_CLIENT_SECRET=your_production_secret
```

### Sandbox/Testing
```bash
NEXT_PUBLIC_FANDRAGON_BASE_URL=https://fandragon.softgen.dev
NEXT_PUBLIC_FANDRAGON_CLIENT_ID=your_sandbox_client_id
FANDRAGON_CLIENT_SECRET=your_sandbox_secret
```

---

## Support

For integration assistance, contact the FanDragon team with:
- Your `client_id`
- Detailed error messages from server logs
- Network request/response logs (browser dev tools)
- Steps to reproduce the issue

---

## Summary

This integration provides:
- ✅ Secure OAuth 2.0 authorization flow
- ✅ Google, Apple, and email authentication via FanDragon
- ✅ Automatic Supabase user creation/linking
- ✅ Session management with magic links
- ✅ Graceful error handling
- ✅ Production-ready security practices

The key components are:
1. **Environment variables** - Client ID, secret, base URL
2. **Token exchange endpoint** - Server-side OAuth code exchange
3. **Callback page** - Handles OAuth redirect and session creation
4. **Login button** - Initiates OAuth flow

All secrets remain server-side, and the flow integrates seamlessly with Supabase authentication.