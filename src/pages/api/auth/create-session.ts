import type { NextApiRequest, NextApiResponse } from "next";
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

    // Check if user exists in Supabase Auth
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing users:", listError);
      return res.status(500).json({ error: "Failed to check user existence" });
    }

    const existingUser = existingUsers.users.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      console.log("Existing user found:", userId);
    } else {
      // Create new user using admin API
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          display_name: fandragon_user?.name || fandragon_user?.email || email,
          fandragon_id: fandragon_user?.id,
          auth_provider: "fandragon",
        },
      });

      if (createError || !newUser.user) {
        console.error("Error creating user:", createError);
        return res.status(500).json({ error: "Failed to create user" });
      }

      userId = newUser.user.id;
      console.log("New user created:", userId);

      // Create profile in profiles table
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: userId,
          email,
          full_name: fandragon_user?.name || email,
          fandragon_id: fandragon_user?.id,
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
      }
    }

    // Generate a session token for the user
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (sessionError || !sessionData) {
      console.error("Error generating session:", sessionError);
      return res.status(500).json({ error: "Failed to generate session" });
    }

    // Store FanDragon tokens in user metadata
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        fandragon_access_token: fandragon_tokens?.access_token,
        fandragon_refresh_token: fandragon_tokens?.refresh_token,
        fandragon_user: fandragon_user,
      },
    });

    if (updateError) {
      console.error("Error updating user metadata:", updateError);
    }

    return res.status(200).json({
      success: true,
      user_id: userId,
      auth_url: sessionData.properties.action_link,
    });
  } catch (error) {
    console.error("Session creation error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}