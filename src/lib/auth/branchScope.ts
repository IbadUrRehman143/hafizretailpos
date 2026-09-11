import { isSuperAdminRole } from "./constants";
import type { SessionPayload } from "./session";

export function canAccessBranchRow(session: SessionPayload, rowBranchId: unknown) {
  if (isSuperAdminRole(session.role)) return true;
  if (session.branchId === null) return rowBranchId === null || rowBranchId === undefined;
  return Number(rowBranchId) === Number(session.branchId);
}

export function scopeRowsToBranch<T extends { branchId?: number | null }>(session: SessionPayload, rows: T[]) {
  return isSuperAdminRole(session.role) ? rows : rows.filter((row) => canAccessBranchRow(session, row.branchId));
}
