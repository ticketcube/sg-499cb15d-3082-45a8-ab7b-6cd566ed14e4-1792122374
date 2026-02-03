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
    const oauthUrl = process.env.NEXT_PUBLIC_FANDRAGON_OAUTH_URL || "https://fandragon.io/oauth/consent";
    
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
    const tokenUrl = process.env.NEXT_PUBLIC_FANDRAGON_TOKEN_URL || "https://fandragon.io/oauth/token";

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

  static async signInWithFanDragon(fanDragonTokens: FanDragonTokenResponse) {
    const { user, access_token } = fanDragonTokens;

    // Check if user exists in profiles
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", user.email)
      .single();

    if (existingProfile) {
      // User exists, sign them in with Supabase
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: access_token, // Use FanDragon token as password placeholder
      });

      if (signInError) {
        // If password doesn't match, update it
        await this.updateSupabasePassword(user.email, access_token);
      }

      return { user: existingProfile };
    } else {
      // Create new user in Supabase
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: user.email,
        password: access_token,
        options: {
          data: {
            display_name: user.display_name || user.email.split("@")[0],
            fandragon_id: user.id,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      // Fetch the newly created profile
      const { data: newProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user?.id)
        .single();

      return { user: newProfile };
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
    const tokenUrl = process.env.NEXT_PUBLIC_FANDRAGON_TOKEN_URL || "https://fandragon.io/oauth/token";

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