
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { StripePrice } from "@/types";

export default function JoinGamePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [price, setPrice] = useState<StripePrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        // 🔄 NEW: fetch priceId from Supabase (null safe)
        const { data: priceRow, error: priceError } = await supabase
          .from("stripe_prices")
          .select("*")
          .eq("active", true)
          .eq("member_cat", "aug31_paid")
          .single();

        if (priceError || !priceRow) {
          throw new Error("Could not find a valid price. Please contact support.");
        }
        
        setPrice(priceRow);
      } catch (e: any) {
        setError(e.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
  }, []);


  const handleJoin = async () => {
    if (!user || !price) return;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-md mx-auto p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Join the Game</h1>
          <p className="text-gray-500">
            You need to purchase entry to join the game.
          </p>
        </div>
        {loading && <p>Loading price information...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {price && !error && (
            <Button onClick={handleJoin} className="w-full" disabled={!user || authLoading || !price}>
            {authLoading ? "Loading..." : `Join ${price.product_name}`}
            </Button>
        )}
      </div>
    </div>
  );
}