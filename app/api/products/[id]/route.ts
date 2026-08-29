import { NextResponse } from "next/server";
import { db } from "@/src/prisma/db";

type ProductType =
  | "weight"
  | "quantity"
  | "size";

type ProductBody = {
  name?: string;
  category?: string;
  type?: ProductType;
  unit?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  quantity?: number;
  weightEntries?: string;
  size?: string;
  material?: string;
  brand?: string;
  model?: string;
  quality?: string;
  color?: string;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function parseProductId(id: string) {
  const productId = Number(id);

  if (
    !Number.isInteger(productId) ||
    productId <= 0
  ) {
    return null;
  }

  return productId;
}

/* =========================================
   GET ONE PRODUCT
========================================= */

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const productId =
      parseProductId(id);

    if (!productId) {
      return NextResponse.json(
        {
          message: "Invalid product ID.",
        },
        {
          status: 400,
        }
      );
    }

    const product =
      await db.orm.public.Product
        .where({
          id: productId,
        })
        .first();

    if (!product) {
      return NextResponse.json(
        {
          message: "Product not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error(
      "GET PRODUCT ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Unable to load product.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================
   UPDATE PRODUCT
========================================= */

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const productId =
      parseProductId(id);

    if (!productId) {
      return NextResponse.json(
        {
          message: "Invalid product ID.",
        },
        {
          status: 400,
        }
      );
    }

    const existing =
      await db.orm.public.Product
        .where({
          id: productId,
        })
        .first();

    if (!existing) {
      return NextResponse.json(
        {
          message: "Product not found.",
        },
        {
          status: 404,
        }
      );
    }

    const body =
      (await request.json()) as ProductBody;

    const type: ProductType =
      body.type === "weight" ||
      body.type === "quantity" ||
      body.type === "size"
        ? body.type
        : (existing.type as ProductType);

    const name =
      String(
        body.name ?? existing.name
      ).trim();

    if (!name) {
      return NextResponse.json(
        {
          message:
            "Product name is required.",
        },
        {
          status: 400,
        }
      );
    }

    const updated =
      await db.orm.public.Product
        .where({
          id: productId,
        })
        .update({
          name,

          category: String(
            body.category ??
              existing.category
          ),

          type,

          unit:
            type === "weight"
              ? "KG"
              : String(
                  body.unit ??
                    existing.unit ??
                    "PCS"
                ),

          purchasePrice:
            Math.max(
              0,
              Number(
                body.purchasePrice ??
                  existing.purchasePrice
              ) || 0
            ),

          sellingPrice:
            Math.max(
              0,
              Number(
                body.sellingPrice ??
                  existing.sellingPrice
              ) || 0
            ),

          quantity:
            type === "weight"
              ? 0
              : Math.max(
                  0,
                  Number(
                    body.quantity ??
                      existing.quantity
                  ) || 0
                ),

          weightEntries:
            type === "weight"
              ? String(
                  body.weightEntries ??
                    existing.weightEntries ??
                    ""
                )
              : "",

          size: String(
            body.size ??
              existing.size ??
              ""
          ),

          material: String(
            body.material ??
              existing.material ??
              ""
          ),

          brand: String(
            body.brand ??
              existing.brand ??
              ""
          ),

          model: String(
            body.model ??
              existing.model ??
              ""
          ),

          quality: String(
            body.quality ??
              existing.quality ??
              ""
          ),

          color: String(
            body.color ??
              existing.color ??
              ""
          ),
        });

    if (!updated) {
      return NextResponse.json(
        {
          message:
            "Product update failed.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error(
      "UPDATE PRODUCT ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Unable to update product.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================
   DELETE PRODUCT
========================================= */

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const productId =
      parseProductId(id);

    if (!productId) {
      return NextResponse.json(
        {
          message: "Invalid product ID.",
        },
        {
          status: 400,
        }
      );
    }

    const existing =
      await db.orm.public.Product
        .where({
          id: productId,
        })
        .first();

    if (!existing) {
      return NextResponse.json(
        {
          message: "Product not found.",
        },
        {
          status: 404,
        }
      );
    }

    const deleted =
      await db.orm.public.Product
        .where({
          id: productId,
        })
        .delete();

    if (!deleted) {
      return NextResponse.json(
        {
          message:
            "Product delete failed.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      message:
        "Product deleted successfully.",
      product: deleted,
    });
  } catch (error) {
    console.error(
      "DELETE PRODUCT ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Unable to delete product.",
      },
      {
        status: 500,
      }
    );
  }
}