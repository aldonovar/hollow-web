import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Where to redirect unauthenticated users (default: /login) */
  fallback?: string;
}

/**
 * Route guard that checks for an active Supabase session via the Zustand auth store.
 * While the session is still loading it renders a minimal loading indicator
 * to avoid flash-of-content or premature redirects.
 */
export function ProtectedRoute({ children, fallback = '/login' }: ProtectedRouteProps) {
  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);

  // Defense-in-depth: if the URL still has auth hash tokens, treat as loading
  // so we never redirect before the authStore has consumed them.
  const hashHasAuthTokens = window.location.hash.includes('access_token=');
  const effectiveLoading = isLoading || (!session && hashHasAuthTokens);

  if (effectiveLoading) {
    return (
      <div
        className="page-shell"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          fontFamily: 'Inter, sans-serif',
          color: 'var(--text-2)',
        }}
      >
        Cargando sesión...
      </div>
    );
  }

  if (!session) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
