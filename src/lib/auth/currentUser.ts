import { cookies } from "next/headers";

import {
  SESSION_COOKIE,
  verifySessionToken,
} from "./session";

export async function currentSession() {
  const cookieStore = await cookies();

  const cookie = cookieStore.get(SESSION_COOKIE);

  const token = cookie?.value || "";

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}