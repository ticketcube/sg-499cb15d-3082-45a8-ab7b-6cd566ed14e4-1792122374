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
      // Scroll to top immediately when route change starts
      window.scrollTo(0, 0);
    };

    const handleRouteChangeComplete = () => {
      // Ensure we're at the top after route change completes
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 0);
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    // On initial load, scroll to top as well
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
    
