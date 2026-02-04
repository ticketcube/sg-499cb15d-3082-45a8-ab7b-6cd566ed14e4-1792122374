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

  static getFanDragonAuthUrl(): string {
    const clientId = process.env.NEXT_PUBLIC_FANDRAGON_CLIENT_ID;
    const redirectUri = this.getRedirectUri();
    const oauthUrl = process.env.NEXT_PUBLIC_FANDRAGON_OAUTH_URL || "https://agyoehyzvergiiwdbzmz.supabase.co/auth/v1/authorize";
    
    const params = new URLSearchParams({
      client_id: clientId || "",
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "profile email"
    });

    const fullUrl = `${oauthUrl}?${params.toString()}`;
    
    console.log("🔵 Building FanDragon Auth URL:");
    console.log("  - Client ID:", clientId);
    console.log("  - Client ID length:", clientId?.length);
    console.log("  - Redirect URI:", redirectUri);
    console.log("  - OAuth URL:", oauthUrl);
    console.log("  - Full URL:", fullUrl);
    console.log("  - URL Parameters:");
    params.forEach((value, key) => {
      console.log(`    * ${key}:`, value);
    });
    
    return fullUrl;
  }

  static async exchangeCodeForTokens(code: string): Promise<FanDragonTokenResponse> {
    const clientId = process.env.NEXT_PUBLIC_FANDRAGON_CLIENT_ID;
    const clientSecret = process.env.FANDRAGON_CLIENT_SECRET;
    const redirectUri = this.getRedirectUri();
    const tokenUrl = process.env.NEXT_PUBLIC_FANDRAGON_TOKEN_URL || "https://agyoehyzvergiiwdbzmz.supabase.co/auth/v1/token";

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
      throw new Error(`Failed to exchange code: ${error}`);
    }

    return response.json();
  }

  static async signInWithFanDragon(tokens: FanDragonTokenResponse) {
    try {
      // Get user info from FanDragon using the access token
      const userInfoResponse = await fetch("https://www.fandragon.com/api/user", {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        throw new Error("Failed to fetch user info from FanDragon");
      }

      const fanDragonUser = await userInfoResponse.json();

      // Call backend API to create/get user and generate session
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

      // Use the magic link URL to establish session
      // Extract the token from the URL
      const url = new URL(auth_url);
      const token = url.searchParams.get("token");
      const type = url.searchParams.get("type");

      if (token && type) {
        // Verify the OTP token to create session
        const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as any,
        });

        if (verifyError) {
          throw new Error(`Failed to verify session: ${verifyError.message}`);
        }

        return sessionData;
      }

      throw new Error("Invalid session URL received");
    } catch (error) {
      console.error("FanDragon sign-in error:", error);
      throw error;
    }
  }

  static async refreshFanDragonToken(refreshToken: string): Promise<FanDragonTokenResponse> {
    const clientId = process.env.NEXT_PUBLIC_FANDRAGON_CLIENT_ID;
    const clientSecret = process.env.FANDRAGON_CLIENT_SECRET;
    const tokenUrl = process.env.NEXT_PUBLIC_FANDRAGON_TOKEN_URL || "https://www.fandragon.com/oauth/token";

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