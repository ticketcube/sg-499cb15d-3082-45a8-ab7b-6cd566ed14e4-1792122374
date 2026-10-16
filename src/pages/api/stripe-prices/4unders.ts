import { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { data, error } = await supabase
      .from("stripe_prices")
      .select("price_id, product_name")
      .eq("member_cat", "4unders")
      .eq("active", true)
      .single();

    if (error || !data) {
      console.error("Error fetching 4unders price:", error);
      return res.status(404).json({ 
        error: "No active 4unders price found in database" 
      });
    }

    return res.status(200).json({ 
      price_id: data.price_id,
      product_name: data.product_name
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}