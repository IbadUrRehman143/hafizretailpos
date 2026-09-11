import { NextResponse } from "next/server";

import { currentSession } from "@/src/lib/auth/currentUser";
import { hasPermission } from "@/src/lib/auth/access";
import { getInventoryIntelligence } from "@/src/lib/inventory-intelligence";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await currentSession();

  if (!session) {
    return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  }

  if (!hasPermission(session.permissions, "inventory", "view", session.role)) {
    return NextResponse.json(
      { success: false, error: "You do not have permission to view inventory intelligence." },
      { status: 403 }
    );
  }

  try {
    const url = new URL(request.url);
    const targetDays = Number(url.searchParams.get("targetDays") || 30);
    const data = await getInventoryIntelligence(targetDays);
    return NextResponse.json({ success: true, verified: true, data });
  } catch (error) {
    console.error("INVENTORY INTELLIGENCE ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load inventory intelligence." },
      { status: 500 }
    );
  }
}
