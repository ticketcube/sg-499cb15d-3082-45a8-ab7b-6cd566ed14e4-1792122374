import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { LogIn, LogOut, User } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, loading } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/4logo.png"
                alt="4Points Logo"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </Link>
          </div>
          
          {/* Auth Button */}
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="w-8 h-8 animate-pulse bg-gray-200 rounded"></div>
            ) : user ? (
              <div className="flex items-center gap-2">
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="gap-2 text-red-800 hover:text-red-900 hover:bg-red-50">
                    <User className="h-4 w-4" />
                    Profile
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="gap-2 text-red-800 hover:text-red-900 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="gap-2 text-red-800 hover:text-red-900 hover:bg-red-50">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow flex flex-col overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
