
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/gamestart');
      } else {
        router.push('/survey');
      }
    }
  }, [loading, user, router]);

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
      </div>
    </Layout>
  );
}
