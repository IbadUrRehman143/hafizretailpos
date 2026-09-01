import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./session";
export async function currentSession(){ const c=await cookies(); return verifySessionToken(c.get(SESSION_COOKIE)?.value); }
