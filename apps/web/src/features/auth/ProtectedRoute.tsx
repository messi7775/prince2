import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LoadingState } from '../../components/ui/loading-state';

/**
 * ProtectedRoute — يحمي المسارات خلف تسجيل الدخول.
 *
 * - isLoading → LoadingState.
 * - !isAuthenticated → /login مع state.from.
 * - otherwise → <Outlet />.
 */
export function ProtectedRoute() {
  const { isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <LoadingState message="جارٍ التحقق من الجلسة..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: { pathname: location.pathname } }}
        replace
      />
    );
  }

  return <Outlet />;
}