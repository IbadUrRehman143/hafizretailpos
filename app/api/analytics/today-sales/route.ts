import { NextResponse } from "next/server";
import { getTodaySales } from "@/src/lib/analytics";

export async function GET() {
  try {
    const data = await getTodaySales();
    return NextResponse.json({ success: true, sales: data });
  } catch (error) {
    console.error("GET /api/analytics/today-sales:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Analytics request failed." },
      { status: 500 }
    );
  }
}
