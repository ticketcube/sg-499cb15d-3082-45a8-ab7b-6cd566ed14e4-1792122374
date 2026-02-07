import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push("/game");
    }
  }, [user, loading, router]);

  const handleLogin = async () => {
    const authUrl = await authService.getFanDragonAuthUrl();
    window.location.href = authUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>4Points Golf - Play Golf with FanDragon</title>
        <meta name="description" content="Play competitive golf games with FanDragon authentication" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 p-4">
        <Card className="max-w-md w-full border-2 border-emerald-700 shadow-2xl bg-white/95 backdrop-blur">
          <CardContent className="pt-12 pb-10 px-8 text-center">
            <div className="mb-8">
              <Image 
                src="/full-4unders-logo-mddg489f.png" 
                alt="4Points Golf Logo" 
                width={200} 
                height={80}
                className="h-24 w-auto mx-auto"
              />
            </div>

            <h1 className="text-3xl font-bold mb-4 text-gray-900">
              Play Golf4Points
            </h1>

            <p className="text-lg text-gray-600 mb-8">
              Login with FanDragon to start playing
            </p>

            <Button 
              onClick={handleLogin}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg font-semibold"
              size="lg"
            >
              Sign in with FanDragon
            </Button>

            <p className="text-sm text-gray-500 mt-6">
              New to 4Points? Your account will be created automatically
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}