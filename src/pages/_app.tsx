
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
    // Pages that should NOT have the header
    const noLayoutRoutes = ['/4unders', '/mvg', '/'];
    const shouldHideLayout = noLayoutRoutes.includes(router.pathname);

  useEffect(() => {
    // Disable browser restoration so it doesn't fight our scroll
    let prev: ScrollRestoration | undefined;
    if ("scrollRestoration" in window.history) {
      prev = window.history.scrollRestoration;
      window.history.scrollRestoration = "manual";
    }

    const docEl = document.documentElement;
    const prevScrollBehavior = docEl.style.scrollBehavior;
    const disableSmooth = () => { docEl.style.scrollBehavior = "auto"; };
    const restoreSmooth = () => { docEl.style.scrollBehavior = prevScrollBehavior; };

    const scrollTopNextFrame = () => {
      requestAnimationFrame(() => {
        disableSmooth();
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        setTimeout(restoreSmooth, 50);
      });
    };

    const handleRouteChangeComplete = () => {
      // Only handle scroll for non-auth routes to prevent interference with OAuth flow
      if (!router.pathname.startsWith('/auth/')) {
        if (location.hash) {
          history.replaceState(null, "", location.pathname + location.search);
        }
        scrollTopNextFrame();
      }
    };

    router.events.on("routeChangeComplete", handleRouteChangeComplete);
    router.events.on("hashChangeComplete", handleRouteChangeComplete);

    // Handle initial load
    handleRouteChangeComplete();

    return () => {
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
      router.events.off("hashChangeComplete", handleRouteChangeComplete);
      if (prev) window.history.scrollRestoration = prev;
      restoreSmooth();
    };
  }, [router]);

  return (
    <AuthProvider>
          <GameProvider>
              {shouldHideLayout ? (
                  <>
                      <Component {...pageProps} />
                      <Toaster />
                  </>
              ) : (
                  <Layout>
                      <Component {...pageProps} />
                      <Toaster />
                  </Layout>
              )}
          </GameProvider>
    </AuthProvider>
  )
}
