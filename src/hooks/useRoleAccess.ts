import { useAuthStore } from '@/store/authStore';

export const useRoleAccess = (requiredRoles: string | string[]) => {
  const { userInfo, hasRole } = useAuthStore();

  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  const hasAccess = hasRole(...roles);

  return {
    hasAccess,
    userRoles: userInfo?.roles || [],
  };
};
