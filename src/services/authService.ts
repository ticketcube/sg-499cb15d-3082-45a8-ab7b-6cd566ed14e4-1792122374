import { supabase } from "@/integrations/supabase/client";

interface FanDragonTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: {
    id: string;
    email: string;
    display_name?: string;
  };
}

export class AuthService {
  private static getRedirectUri(): string {
    if (typeof window !== "undefined") {
      const { protocol, host } = window.location;
      return `${protocol}//${host}/auth/callback`;
    }
    return process.env.NEXT_PUBLIC_SITE_URL 
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      : "http://localhost:3000/auth/callback";
  }

  private static generateState(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  static getFanDragonAuthUrl(): string {
    const clientId = process.env.NEXT_PUBLIC_FANDRAGON_CLIENT_ID;
    const redirectUri = this.getRedirectUri();
    const fandragonBaseUrl = process.env.NEXT_PUBLIC_FANDRAGON_BASE_URL || "https://fandragon.com";
    const oauthUrl = `${fandragonBaseUrl}/oauth/consent`;
    const state = this.generateState();
    
    console.log("🔍 Environment Check:");
    console.log("  - NEXT_PUBLIC_FANDRAGON_CLIENT_ID exists:", !!process.env.NEXT_PUBLIC_FANDRAGON_CLIENT_ID);
    console.log("  - NEXT_PUBLIC_FANDRAGON_BASE_URL:", fandragonBaseUrl);
    
    if (!clientId) {
      console.error("❌ CRITICAL: NEXT_PUBLIC_FANDRAGON_CLIENT_ID is not set!");
      throw new Error("FanDragon Client ID is not configured");
    }
    
    if (typeof window !== "undefined") {
      sessionStorage.setItem("oauth_state", state);
    }
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state: state
    });

    const fullUrl = `${oauthUrl}?${params.toString()}`;
    
    console.log("🔵 Building FanDragon Auth URL:");
    console.log("  - Client ID:", clientId);
    console.log("  - Redirect URI:", redirectUri);
    console.log("  - OAuth URL:", oauthUrl);
    console.log("  - State:", state);
    console.log("  - Full URL:", fullUrl);
    
    return fullUrl;
  }

  static async exchangeCodeForTokens(code: string): Promise<FanDragonTokenResponse> {
    const clientId = process.env.NEXT_PUBLIC_FANDRAGON_CLIENT_ID;
    const clientSecret = process.env.FANDRAGON_CLIENT_SECRET;
    const redirectUri = this.getRedirectUri();
    const fandragonBaseUrl = process.env.NEXT_PUBLIC_FANDRAGON_BASE_URL || "https://fandragon.com";
    const tokenUrl = `${fandragonBaseUrl}/oauth/token`;

    console.log("🟢 Exchanging code for tokens:");
    console.log("  - Token URL:", tokenUrl);
    console.log("  - Redirect URI:", redirectUri);

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Token exchange failed:", error);
      throw new Error(`Failed to exchange code: ${error}`);
    }

    const tokens = await response.json();
    console.log("✅ Token exchange successful");
    return tokens;
  }

  static async signInWithFanDragon(tokens: FanDragonTokenResponse) {
    try {
      console.log("🟡 Fetching user info from FanDragon...");
      const fandragonBaseUrl = process.env.NEXT_PUBLIC_FANDRAGON_BASE_URL || "https://fandragon.com";
      
      const userInfoResponse = await fetch(`${fandragonBaseUrl}/oauth/userinfo`, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        throw new Error("Failed to fetch user info from FanDragon");
      }

      const fanDragonUser = await userInfoResponse.json();
      console.log("✅ User info fetched:", fanDragonUser.email);

      console.log("🟡 Creating session...");
      const response = await fetch("/api/auth/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: fanDragonUser.email,
          fandragon_tokens: tokens,
          fandragon_user: fanDragonUser,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create session");
      }

      const { auth_url } = await response.json();
      console.log("✅ Session created");

      const url = new URL(auth_url);
      const token = url.searchParams.get("token");
      const type = url.searchParams.get("type");

      if (token && type) {
        console.log("🟡 Verifying OTP...");
        const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as any,
        });

        if (verifyError) {
          throw new Error(`Failed to verify session: ${verifyError.message}`);
        }

        console.log("✅ Session verified successfully");
        return sessionData;
      }

      throw new Error("Invalid session URL received");
    } catch (error) {
      console.error("❌ FanDragon sign-in error:", error);
      throw error;
    }
  }

  static async refreshFanDragonToken(refreshToken: string): Promise<FanDragonTokenResponse> {
    const clientId = process.env.NEXT_PUBLIC_FANDRAGON_CLIENT_ID;
    const clientSecret = process.env.FANDRAGON_CLIENT_SECRET;
    const fandragonBaseUrl = process.env.NEXT_PUBLIC_FANDRAGON_BASE_URL || "https://fandragon.com";
    const tokenUrl = `${fandragonBaseUrl}/oauth/token`;

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    return response.json();
  }
}