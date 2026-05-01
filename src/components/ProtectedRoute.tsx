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

  if (isLoading) {
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
