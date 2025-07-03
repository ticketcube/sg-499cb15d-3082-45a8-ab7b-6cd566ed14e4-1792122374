import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-grow flex flex-col overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
