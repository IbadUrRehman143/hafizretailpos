import { NextResponse } from "next/server";
import { getDashboardAnalytics } from "@/src/lib/analytics";

export async function GET() {
  try {
    const data = await getDashboardAnalytics();
    return NextResponse.json({ success: true, analytics: data });
  } catch (error) {
    console.error("GET /api/analytics/summary:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Analytics request failed." },
      { status: 500 }
    );
  }
}
