import { NextResponse } from "next/server";
import { currentSession } from "@/src/lib/auth/currentUser";
import { hasPermission } from "@/src/lib/auth/access";
import { getBusinessIntelligence } from "@/src/lib/business-intelligence";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await currentSession();
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

    if (!hasPermission(session.permissions, "reports", "view", session.role)) {
      return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
    }

    const url = new URL(request.url);
    const start = url.searchParams.get("start") || undefined;
    const end = url.searchParams.get("end") || undefined;
    const data = await getBusinessIntelligence({ start, end });

    return NextResponse.json({ success: true, verified: true, phase: 7, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unable to load business intelligence." },
      { status: 500 }
    );
  }
}
