import { NextResponse } from "next/server";
import { getInventoryValue } from "@/src/lib/analytics";

export async function GET() {
  try {
    const data = await getInventoryValue();
    return NextResponse.json({ success: true, inventory: data });
  } catch (error) {
    console.error("GET /api/analytics/inventory-value:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Analytics request failed." },
      { status: 500 }
    );
  }
}
