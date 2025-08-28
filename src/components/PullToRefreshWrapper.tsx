
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

interface PullToRefreshWrapperProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
}

// Dynamically import PullToRefresh to avoid SSR issues
const PullToRefresh = dynamic(() => import("react-pull-to-refresh"), {
  ssr: false,
  loading: () => <div className="min-h-screen">{null}</div>
});

export default function PullToRefreshWrapper({ children, onRefresh }: PullToRefreshWrapperProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // On server-side or before hydration, render children without pull-to-refresh
  if (!isClient) {
    return <div className="min-h-screen">{children}</div>;
  }

  // On client-side, render with pull-to-refresh functionality
  return (
    <PullToRefresh onRefresh={onRefresh}>
      <div className="min-h-screen">{children}</div>
    </PullToRefresh>
  );
}