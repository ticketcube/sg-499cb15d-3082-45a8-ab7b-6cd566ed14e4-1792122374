import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

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

// Generate username from email or FanDragon data
function generateUsername(email: string, userInfo?: any): string {
  // First try FanDragon username/display_name if available
  if (userInfo?.username) {
    return userInfo.username;
  }
  if (userInfo?.display_name) {
    return userInfo.display_name.toLowerCase().replace(/\s+/g, "_");
  }
  
  // Otherwise generate from email prefix
  const emailPrefix = email.split("@")[0];
  return emailPrefix || `user_${Date.now()}`;
}

// Ensure username is unique by adding suffix if needed
async function ensureUniqueUsername(baseUsername: string): Promise<string> {
  let username = baseUsername;
  let suffix = 1;
  
  while (true) {
    const { data } = await supabaseAdmin
      .from("user_profiles")
      .select("username")
      .eq("username", username)
      .maybeSingle();
    
    if (!data) {
      // Username is available
      return username;
    }
    
    // Username exists, try with suffix
    username = `${baseUsername}_${suffix}`;
    suffix++;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, redirect_uri } = req.body;

  if (!code || !redirect_uri) {
    return res.status(400).json({ 
      error: "missing_parameters",
      message: "Code and redirect_uri are required" 
    });
  }

  try {
    const fandragonBaseUrl = process.env.NEXT_PUBLIC_FANDRAGON_BASE_URL || "https://fandragon.com";

    console.log("[exchange-token] Starting token exchange for code:", code.substring(0, 10) + "...");

    // Step 1: Exchange authorization code for access token
    const tokenResponse = await fetch(`${fandragonBaseUrl}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code: code,
        client_id: process.env.NEXT_PUBLIC_FANDRAGON_CLIENT_ID,
        client_secret: process.env.FANDRAGON_CLIENT_SECRET,
        redirect_uri: redirect_uri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("[exchange-token] Token exchange failed:", errorData);
      return res.status(tokenResponse.status).json({
        error: "token_exchange_failed",
        message: errorData.error_description || "Failed to exchange authorization code",
        details: errorData,
      });
    }

    const tokenData = await tokenResponse.json();
    console.log("[exchange-token] Token exchange successful");

    // Step 2: Fetch user profile from FanDragon
    const userInfoResponse = await fetch(`${fandragonBaseUrl}/oauth/userinfo`, {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error("[exchange-token] User info fetch failed:", userInfoResponse.status);
      return res.status(userInfoResponse.status).json({
        error: "userinfo_failed",
        message: "Failed to fetch user information",
      });
    }

    const userInfo = await userInfoResponse.json();
    console.log("[exchange-token] User info fetched for:", userInfo.email);

    // Step 3: Create or update user in Supabase
    const email = userInfo.email;
    const fandragonUserId = userInfo.id;

    // Check if user exists in Supabase
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    let supabaseUser = existingUsers?.users?.find(u => u.email === email);

    if (!supabaseUser) {
      console.log("[exchange-token] Creating new user for:", email);
      
      // Create new user via Supabase Admin API
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          full_name: userInfo.name || userInfo.display_name,
          avatar_url: userInfo.avatar_url,
          fandragon_user_id: fandragonUserId,
          fandragon_access_token: tokenData.access_token,
          fandragon_refresh_token: tokenData.refresh_token,
        },
      });

      if (createError) {
        console.error("[exchange-token] User creation failed:", createError);
        return res.status(500).json({
          error: "user_creation_failed",
          message: createError.message,
        });
      }

      supabaseUser = newUser.user;
      console.log("[exchange-token] New user created:", supabaseUser.id);
    } else {
      console.log("[exchange-token] Existing user found:", supabaseUser.id);
      
      // Update user metadata with latest FanDragon tokens
      await supabaseAdmin.auth.admin.updateUserById(supabaseUser.id, {
        user_metadata: {
          ...supabaseUser.user_metadata,
          fandragon_access_token: tokenData.access_token,
          fandragon_refresh_token: tokenData.refresh_token,
          fandragon_user_id: fandragonUserId,
        },
      });
    }

    // Step 4: Update user profile with FanDragon ID (if not already set)
    const { data: existingProfile } = await supabaseAdmin
      .from("user_profiles")
      .select("*")
      .eq("user_id", supabaseUser!.id)
      .maybeSingle();

    if (!existingProfile) {
      console.log("[exchange-token] Creating user profile");
      
      // Generate unique username
      const baseUsername = generateUsername(email, userInfo);
      const uniqueUsername = await ensureUniqueUsername(baseUsername);

      const { error: profileError } = await supabaseAdmin
        .from("user_profiles")
        .insert({
          user_id: supabaseUser!.id,
          username: uniqueUsername,
          email: email,
          display_name: userInfo.display_name || userInfo.name || email.split("@")[0],
          avatar_url: userInfo.avatar_url,
          role: "fan",
        });

      if (profileError) {
        console.error("[exchange-token] Profile creation error:", profileError);
      } else {
        console.log("[exchange-token] Profile created with username:", uniqueUsername);
      }
    } else {
      console.log("[exchange-token] Updating existing profile");
      
      const { error: profileError } = await supabaseAdmin
        .from("user_profiles")
        .update({
          display_name: userInfo.display_name || userInfo.name || existingProfile.display_name,
          avatar_url: userInfo.avatar_url || existingProfile.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", supabaseUser!.id);

      if (profileError) {
        console.error("[exchange-token] Profile update error:", profileError);
      }
    }

    // Step 5: Generate Supabase magic link session
    const { data: magicLinkData, error: magicLinkError } = 
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: email,
      });

    if (magicLinkError || !magicLinkData) {
      console.error("[exchange-token] Session generation failed:", magicLinkError);
      return res.status(500).json({
        error: "session_creation_failed",
        message: "Failed to create session",
      });
    }

    console.log("[exchange-token] Session created successfully for:", email);

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
    console.error("[exchange-token] Token exchange error:", error);
    return res.status(500).json({
      error: "server_error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}