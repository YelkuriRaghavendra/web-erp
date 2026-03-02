// import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
// import { ALLOWED_ROLES } from '@/lib/constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore();

  const location = useLocation();
  // const hasValidRole = hasRole(...ALLOWED_ROLES);
  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-lg'>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }
  // if (!hasValidRole) {
  //   return <Navigate to='/admin-contact' replace />;
  // }
  return <>{children}</>;
}

export default ProtectedRoute;
