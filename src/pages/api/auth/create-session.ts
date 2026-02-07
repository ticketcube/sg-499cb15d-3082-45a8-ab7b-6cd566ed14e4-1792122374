import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

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
function generateUsername(email: string, fandragonUser?: any): string {
  // First try FanDragon username if available
  if (fandragonUser?.username) {
    return fandragonUser.username;
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
      .single();
    
    if (!data) {
      // Username is available
      return username;
    }
    
    // Username exists, try with suffix
    username = `${baseUsername}_${suffix}`;
    suffix++;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, fandragon_tokens, fandragon_user } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    console.log("[create-session] Processing FanDragon auth for:", email);

    // Check if user exists in Supabase Auth
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("[create-session] Error listing users:", listError);
      return res.status(500).json({ error: "Failed to check user existence" });
    }

    const users: User[] = existingUsers?.users || [];
    const existingUser = users.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      console.log("[create-session] Existing user found:", userId);
      
      // Update user metadata with latest FanDragon tokens
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          fandragon_access_token: fandragon_tokens?.access_token,
          fandragon_refresh_token: fandragon_tokens?.refresh_token,
          fandragon_user: fandragon_user,
        },
      });
    } else {
      // Create new user using admin API
      const displayName = fandragon_user?.display_name || fandragon_user?.name || email;
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          display_name: displayName,
          fandragon_id: fandragon_user?.id,
          auth_provider: "fandragon",
          fandragon_access_token: fandragon_tokens?.access_token,
          fandragon_refresh_token: fandragon_tokens?.refresh_token,
          fandragon_user: fandragon_user,
        },
      });

      if (createError || !newUser.user) {
        console.error("[create-session] Error creating user:", createError);
        return res.status(500).json({ error: "Failed to create user" });
      }

      userId = newUser.user.id;
      console.log("[create-session] New user created:", userId);

      // Generate unique username
      const baseUsername = generateUsername(email, fandragon_user);
      const uniqueUsername = await ensureUniqueUsername(baseUsername);

      // Create profile in user_profiles table
      const { error: profileError } = await supabaseAdmin
        .from("user_profiles")
        .insert({
          user_id: userId,
          username: uniqueUsername,
          email,
          display_name: displayName,
          avatar_url: fandragon_user?.avatar_url || null,
          role: "fan",
        });

      if (profileError) {
        console.error("[create-session] Error creating user profile:", profileError);
        console.error("[create-session] Profile error details:", JSON.stringify(profileError, null, 2));
        return res.status(500).json({ error: "Failed to create user profile" });
      }

      console.log("[create-session] User profile created successfully with username:", uniqueUsername);
    }

    // Generate a session token for the user
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (sessionError || !sessionData) {
      console.error("[create-session] Error generating session:", sessionError);
      return res.status(500).json({ error: "Failed to generate session" });
    }

    console.log("[create-session] Session created successfully for:", email);

    return res.status(200).json({
      success: true,
      user_id: userId,
      auth_url: sessionData.properties.action_link,
    });
  } catch (error) {
    console.error("[create-session] Session creation error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}