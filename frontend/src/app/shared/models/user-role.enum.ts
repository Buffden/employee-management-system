/**
 * User role enumeration
 * Defines all available roles in the system
 */
export enum UserRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  HR_MANAGER = 'HR_MANAGER',
  DEPARTMENT_MANAGER = 'DEPARTMENT_MANAGER',
  EMPLOYEE = 'EMPLOYEE'
}

/**
 * Check if a string is a valid role
 */
export function isValidRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

/**
 * Get all available roles
 */
export function getAllRoles(): UserRole[] {
  return Object.values(UserRole);
}

/**
 * Get roles that can be created by System Admin
 */
export function getAdminCreatableRoles(): UserRole[] {
  return [UserRole.SYSTEM_ADMIN, UserRole.HR_MANAGER];
}

