import { NextResponse } from "next/server";
import { currentSession } from "./currentUser";
import { hasPermission, type Action } from "./access";

export async function requireApiPermission(moduleName: string, action: Action) {
  const session = await currentSession();
  if (!session) {
    return { ok: false as const, response: NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 }) };
  }
  if (!hasPermission(session.permissions ?? [], moduleName, action, session.role ?? "")) {
    return { ok: false as const, response: NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 }) };
  }
  return { ok: true as const, session };
}
