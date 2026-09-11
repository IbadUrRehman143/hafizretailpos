import { NextResponse } from "next/server";
import { getLowStockProducts } from "@/src/lib/analytics";

export async function GET() {
  try {
    const data = await getLowStockProducts();
    return NextResponse.json({ success: true, products: data });
  } catch (error) {
    console.error("GET /api/analytics/low-stock:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Analytics request failed." },
      { status: 500 }
    );
  }
}
