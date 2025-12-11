import { Navigate } from 'react-router-dom';
import { isAppEnabled } from '../utils/appFilter';

interface AppRouteGuardProps {
  appId: string;
  children: React.ReactNode;
}

/**
 * Guards app routes based on magic code settings
 * - Videos app: falls back to disabled if no magic code
 * - Other apps: always enabled unless magic code disables them
 */
export function AppRouteGuard({ appId, children }: AppRouteGuardProps) {
  if (!isAppEnabled(appId)) {
    return (
      <div className="min-h-[calc(100vh-60px)] flex items-center justify-center bg-background">
        <div className="text-center p-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">App Not Available</h1>
          <p className="text-muted-foreground mb-4">
            This app is not enabled for your current settings.
          </p>
          <a
            href="/"
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-full font-semibold text-sm hover:bg-primary/90 transition-all"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
