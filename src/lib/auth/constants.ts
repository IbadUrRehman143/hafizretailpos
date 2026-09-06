/**
 * Canonical role name for the built-in Super Admin role.
 *
 * Source of truth: app/api/auth/setup/route.ts creates the seed
 * Role row with this exact string (both to find an existing row
 * and to create it on first run). Every Super Admin check in the
 * app must compare against this constant — not a literal string —
 * so the three previously-inconsistent comparisons ("Super Admin",
 * "super admin", "SUPER_ADMIN") can never drift apart again.
 */
export const SUPER_ADMIN_ROLE_NAME = "SUPER_ADMIN";

export function isSuperAdminRole(
  roleName: string | null | undefined
): boolean {
  return roleName === SUPER_ADMIN_ROLE_NAME;
}
