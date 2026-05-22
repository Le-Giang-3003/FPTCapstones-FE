import type { Role } from '../types';

// BE serialize [Flags] enum thành string: single role "Admin" hoặc multi "Admin, Lecturer".
// Tách thành Set để check O(1).
const parseRoles = (roleString: string | undefined | null): Set<string> => {
  if (!roleString) return new Set();
  return new Set(roleString.split(',').map((r) => r.trim()).filter(Boolean));
};

// User có chứa flag role này không (vd "Admin, Lecturer" có "Lecturer" → true)
export const hasRole = (roleString: string | undefined | null, role: Role): boolean => {
  return parseRoles(roleString).has(role);
};

// User có chứa BẤT KỲ role nào trong list (OR)
export const hasAnyRole = (roleString: string | undefined | null, roles: Role[]): boolean => {
  const set = parseRoles(roleString);
  return roles.some((r) => set.has(r));
};

// User có chứa TẤT CẢ role trong list (AND)
export const hasAllRoles = (roleString: string | undefined | null, roles: Role[]): boolean => {
  const set = parseRoles(roleString);
  return roles.every((r) => set.has(r));
};
