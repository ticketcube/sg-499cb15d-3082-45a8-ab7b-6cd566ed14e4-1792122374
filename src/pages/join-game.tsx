
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Calendar, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";

export default function JoinGamePage() {
  const { user, loading } = useAuth();
  const [gameCode, setGameCode] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-md mx-auto p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Join the Game</h1>
          <p className="text-gray-500">
            You need to purchase entry to join the game.
          </p>
        </div>
      </div>
    </div>
  );
}