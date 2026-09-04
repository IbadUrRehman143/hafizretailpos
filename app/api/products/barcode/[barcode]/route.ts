import {
  NextResponse,
} from "next/server";

import {
  db,
} from "@/src/prisma/db";

type BarcodeProduct = {
  id?: number;
  name?: string;
  barcode?: string | null;
  status?: string | null;
};

type RouteContext = {
  params: Promise<{
    barcode: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const {
      barcode: rawBarcode,
    } = await context.params;

    const barcode =
      decodeURIComponent(
        String(
          rawBarcode || ""
        )
      ).trim();

    if (!barcode) {
      return NextResponse.json(
        {
          message:
            "Barcode is required.",
        },
        {
          status: 400,
        }
      );
    }

    const products =
      (await db.orm.public.Product.all()) as BarcodeProduct[];

    const product =
      products.find(
        (item) =>
          String(
            item.barcode || ""
          ).trim() ===
            barcode &&
          String(
            item.status ||
              "Active"
          )
            .trim()
            .toLowerCase() ===
            "active"
      );

    if (!product) {
      return NextResponse.json(
        {
          message:
            "Product not found for this barcode.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      product
    );
  } catch (error) {
    console.error(
      "BARCODE LOOKUP ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Unable to find product by barcode.",
      },
      {
        status: 500,
      }
    );
  }
}
