
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from "@/components/ui/toaster"
import { GameProvider } from '@/contexts/GameContext'
import { Layout } from '@/components/layout/Layout'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChangeStart = () => {
      window.scrollTo(0, 0);
    };

    const handleRouteChangeComplete = () => {
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 0);
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    window.scrollTo(0, 0);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router.events]);

  return (
    <AuthProvider>
      <GameProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
        <Toaster />
      </GameProvider>
    </AuthProvider>
  )
}
