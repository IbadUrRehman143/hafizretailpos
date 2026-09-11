import { NextResponse } from "next/server";
import { getCustomerHistory } from "@/src/lib/analytics";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ success: false, message: "Invalid customer ID." }, { status: 400 });
    }

    return NextResponse.json({ success: true, history: await getCustomerHistory(id) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed.";
    return NextResponse.json(
      { success: false, message },
      { status: message === "Customer not found." ? 404 : 500 }
    );
  }
}
