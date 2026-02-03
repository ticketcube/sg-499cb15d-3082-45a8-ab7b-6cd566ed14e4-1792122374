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
    const oauthUrl = process.env.NEXT_PUBLIC_FANDRAGON_OAUTH_URL || "https://fandragon.com/oauth/consent";
    
    const params = new URLSearchParams({
      client_id: clientId || "",
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "profile email"
    });

    return `${oauthUrl}?${params.toString()}`;
  }

  static async exchangeCodeForTokens(code: string): Promise<FanDragonTokenResponse> {
    const clientId = process.env.NEXT_PUBLIC_FANDRAGON_CLIENT_ID;
    const clientSecret = process.env.FANDRAGON_CLIENT_SECRET;
    const redirectUri = this.getRedirectUri();
    const tokenUrl = process.env.NEXT_PUBLIC_FANDRAGON_TOKEN_URL || "https://fandragon.com/oauth/token";

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
      // First, get user info from FanDragon using the access token
      const userInfoResponse = await fetch("https://fandragon.com/api/user", {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        throw new Error("Failed to fetch user info from FanDragon");
      }

      const fanDragonUser = await userInfoResponse.json();

      // Check if user exists in Supabase profiles
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", fanDragonUser.email)
        .single();

      if (existingProfile) {
        // User exists - sign them in with a custom token approach
        // Store FanDragon tokens in local storage for now
        localStorage.setItem("fandragon_tokens", JSON.stringify(tokens));
        localStorage.setItem("fandragon_user", JSON.stringify(fanDragonUser));
        
        // Create a Supabase session using email-based authentication
        // This is a workaround since we can't directly inject FanDragon tokens into Supabase
        const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
          email: fanDragonUser.email,
          password: tokens.access_token, // Use access token as password for OAuth users
        });

        if (signInError) {
          // If password sign-in fails, user might need to reset password or we need to create them
          throw new Error("Failed to establish Supabase session");
        }

        return sessionData;
      } else {
        // New user - create profile and sign them up
        localStorage.setItem("fandragon_tokens", JSON.stringify(tokens));
        localStorage.setItem("fandragon_user", JSON.stringify(fanDragonUser));

        // Sign up the user with Supabase using FanDragon credentials
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: fanDragonUser.email,
          password: tokens.access_token, // Use access token as password
          options: {
            data: {
              display_name: fanDragonUser.name || fanDragonUser.email,
              fandragon_id: fanDragonUser.id,
            },
          },
        });

        if (signUpError) {
          throw new Error(`Failed to create Supabase user: ${signUpError.message}`);
        }

        return signUpData;
      }
    } catch (error) {
      console.error("FanDragon sign-in error:", error);
      throw error;
    }
  }

  private static async updateSupabasePassword(email: string, newPassword: string) {
    // This is a workaround - in production, you'd want a more secure flow
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: newPassword,
    });

    if (error) {
      console.error("Failed to update password:", error);
    }
  }

  static async refreshFanDragonToken(refreshToken: string): Promise<FanDragonTokenResponse> {
    const clientId = process.env.NEXT_PUBLIC_FANDRAGON_CLIENT_ID;
    const clientSecret = process.env.FANDRAGON_CLIENT_SECRET;
    const tokenUrl = process.env.NEXT_PUBLIC_FANDRAGON_TOKEN_URL || "https://fandragon.com/oauth/token";

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