import { useRoleAccess } from '@/hooks/useRoleAccess';
import { AccessDenied } from './AccessDenied';

interface RoleGuardProps {
  roles: string | string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  roles,
  fallback = <AccessDenied />,
  children,
}) => {
  const { hasAccess } = useRoleAccess(roles);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};
