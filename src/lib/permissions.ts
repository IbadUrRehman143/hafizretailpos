export const SYSTEM_PERMISSIONS = [
  "dashboard",
  "pos",
  "products",
  "inventory",
  "purchases",
  "sales",
  "returns",
  "customers",
  "suppliers",
  "expenses",
  "reports",
  "notifications",
  "users",
  "branches",
  "settings",
  "auditLogs",
] as const;

export type SystemPermission =
  (typeof SYSTEM_PERMISSIONS)[number];

export function normalizePermissions(
  value: unknown
): SystemPermission[] {
  if (!Array.isArray(value)) return [];

  const allowed =
    new Set<string>(SYSTEM_PERMISSIONS);

  return Array.from(
    new Set(
      value
        .map((item) =>
          String(item || "").trim()
        )
        .filter(
          (item): item is SystemPermission =>
            allowed.has(item)
        )
    )
  );
}
