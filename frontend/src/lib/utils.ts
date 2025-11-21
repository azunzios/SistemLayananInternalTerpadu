import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { User, UserRole } from "../types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the primary (active) role for a user.
 * Prefers roles array, falls back to role property for backward compatibility.
 */
export function getUserPrimaryRole(user: User): UserRole {
  if (user.roles && user.roles.length > 0) {
    return user.roles[0];
  }
  return user.role || 'pegawai';
}

/**
 * Check if a user has a specific role.
 */
export function userHasRole(user: User, role: UserRole): boolean {
  if (user.roles && user.roles.length > 0) {
    return user.roles.includes(role);
  }
  return user.role === role;
}

/**
 * Get all roles for a user as an array.
 */
export function getUserRoles(user: User): UserRole[] {
  if (user.roles && user.roles.length > 0) {
    return user.roles;
  }
  return user.role ? [user.role] : ['pegawai'];
}

