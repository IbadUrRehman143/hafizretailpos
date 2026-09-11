import { NextRequest, NextResponse } from "next/server";
import { getTopCustomers } from "@/src/lib/analytics";

export async function GET(request: NextRequest) {
  try {
    const raw = Number(request.nextUrl.searchParams.get("limit") || 10);
    const limit = Math.max(1, Math.min(100, Number.isFinite(raw) ? raw : 10));
    return NextResponse.json({ success: true, customers: await getTopCustomers(limit) });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Failed." }, { status: 500 });
  }
}
