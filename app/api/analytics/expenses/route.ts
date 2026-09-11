import { NextRequest, NextResponse } from "next/server";
import { getExpenses } from "@/src/lib/analytics";

export async function GET(request: NextRequest) {
  try {
    const start = request.nextUrl.searchParams.get("start") || undefined;
    const end = request.nextUrl.searchParams.get("end") || undefined;
    return NextResponse.json({ success: true, ...(await getExpenses(start, end)) });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Failed." }, { status: 500 });
  }
}
