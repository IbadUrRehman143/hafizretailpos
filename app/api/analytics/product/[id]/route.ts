import { NextResponse } from "next/server";

import { getProductHistory } from "@/src/lib/analytics";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID.",
        },
        {
          status: 400,
        }
      );
    }

    const history = await getProductHistory(id);

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error(
      "GET /api/analytics/product/[id]:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to load product history.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status:
          message === "Product not found."
            ? 404
            : 500,
      }
    );
  }
}
