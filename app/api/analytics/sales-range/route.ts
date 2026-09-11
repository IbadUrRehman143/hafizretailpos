import { NextRequest, NextResponse } from "next/server";
import { getSalesByDateRange } from "@/src/lib/analytics";

export async function GET(request: NextRequest) {
  try {
    const start = request.nextUrl.searchParams.get("start");
    const end = request.nextUrl.searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json(
        { success: false, message: "start and end are required." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      sales: await getSalesByDateRange(start, end),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed." },
      { status: 500 }
    );
  }
}
