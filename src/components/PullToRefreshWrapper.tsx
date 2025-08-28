
import PullToRefresh from "react-pull-to-refresh";

interface PullToRefreshWrapperProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
}

export default function PullToRefreshWrapper({ children, onRefresh }: PullToRefreshWrapperProps) {
  return (
    <PullToRefresh onRefresh={onRefresh}>
      <div className="min-h-screen">{children}</div>
    </PullToRefresh>
  );
}
