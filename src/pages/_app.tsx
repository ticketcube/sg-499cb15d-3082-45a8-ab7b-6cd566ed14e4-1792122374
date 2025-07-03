import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/contexts/AuthContext";
import { GameProvider } from "@/contexts/GameContext";
import { Toaster } from "@/components/ui/toaster";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <GameProvider>
        <Component {...pageProps} />
        <Toaster />
      </GameProvider>
    </AuthProvider>
  );
}
