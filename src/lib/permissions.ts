export const SYSTEM_MODULES = ["dashboard","pos","products","inventory","purchases","sales","returns","customers","suppliers","expenses","reports","notifications","users","branches","settings","auditLogs"] as const;
export const SYSTEM_ACTIONS = ["view","create","edit","delete","export"] as const;
export type SystemModule=(typeof SYSTEM_MODULES)[number];export type SystemAction=(typeof SYSTEM_ACTIONS)[number];export type SystemPermission=SystemModule|`${SystemModule}.${SystemAction}`;
export const SYSTEM_PERMISSIONS:SystemPermission[]=[...SYSTEM_MODULES,...SYSTEM_MODULES.flatMap(m=>SYSTEM_ACTIONS.map(a=>`${m}.${a}` as SystemPermission))];
export function normalizePermissions(value:unknown):SystemPermission[]{if(!Array.isArray(value))return[];const allowed=new Set<string>(SYSTEM_PERMISSIONS);return Array.from(new Set(value.map(x=>String(x||"").trim()).filter((x):x is SystemPermission=>allowed.has(x))))}
