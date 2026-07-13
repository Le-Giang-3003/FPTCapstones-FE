import type { Role } from '../types';

export const hasAnyRole = (userRole: Role, allowedRoles: Role[]): boolean => {
  return allowedRoles.includes(userRole);
};
