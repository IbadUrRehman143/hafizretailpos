import { NextResponse } from "next/server";
import { db } from "@/src/prisma/db";

type ProductType =
  | "weight"
  | "quantity"
  | "size";

type ProductBody = {
  name?: string;
  categoryId?: number | null;
  categoryName?: string;
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
  status?: string;
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

async function resolveCategory(
  body: ProductBody,
  existing: {
    categoryId?: number | null;
    categoryName?: string | null;
  }
) {
  const requestedId =
    body.categoryId ??
    existing.categoryId ??
    null;

  if (
    requestedId &&
    Number.isInteger(requestedId)
  ) {
    const category =
      await db.orm.public.Category
        .where({
          id: requestedId,
        })
        .first();

    if (!category) {
      throw new Error(
        "Selected category does not exist."
      );
    }

    return category;
  }

  const name =
    String(
      body.categoryName ??
        existing.categoryName ??
        "Other"
    ).trim() || "Other";

  const categories =
    await db.orm.public.Category.all();

  const found =
    categories.find(
      (item) =>
        item.name.toLowerCase() ===
        name.toLowerCase()
    );

  if (found) return found;

  return await db.orm.public.Category.create({
    name,
    description: "",
    status: "Active",
  });
}

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
          message:
            "Invalid product ID.",
        },
        { status: 400 }
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
          message:
            "Product not found.",
        },
        { status: 404 }
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
      { status: 500 }
    );
  }
}

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
          message:
            "Invalid product ID.",
        },
        { status: 400 }
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
          message:
            "Product not found.",
        },
        { status: 404 }
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
        { status: 400 }
      );
    }

    const category =
      await resolveCategory(
        body,
        existing
      );

    const updated =
      await db.orm.public.Product
        .where({
          id: productId,
        })
        .update({
          name,
          category: category.name,
          categoryId:
            category.id,
          categoryName:
            category.name,
          status:
            body.status === "Archived"
              ? "Archived"
              : "Active",
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
          // Stock is not edited from Product Edit. Use Purchase or Inventory Adjustment.
          quantity: type === "weight" ? 0 : Math.max(0, Number(existing.quantity) || 0),
          weightEntries: type === "weight" ? String(existing.weightEntries || "") : "",
          size:
            String(
              body.size ??
                existing.size ??
                ""
            ),
          material:
            String(
              body.material ??
                existing.material ??
                ""
            ),
          brand:
            String(
              body.brand ??
                existing.brand ??
                ""
            ),
          model:
            String(
              body.model ??
                existing.model ??
                ""
            ),
          quality:
            String(
              body.quality ??
                existing.quality ??
                ""
            ),
          color:
            String(
              body.color ??
                existing.color ??
                ""
            ),
        });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(
      "UPDATE PRODUCT ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to update product.",
      },
      { status: 500 }
    );
  }
}

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
          message:
            "Invalid product ID.",
        },
        { status: 400 }
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
          message:
            "Product not found.",
        },
        { status: 404 }
      );
    }

    const invoiceItems =
      await db.orm.public.InvoiceItem
        .where({
          productId,
        })
        .all();

    const purchaseItems =
      await db.orm.public.PurchaseItem
        .where({
          productId,
        })
        .all();

    const inventoryTransactions =
      await db.orm.public.InventoryTransaction
        .where({
          productId,
        })
        .all();

    const returnItems =
      await db.orm.public.ReturnItem
        .where({
          productId,
        })
        .all();

    const hasHistory =
      invoiceItems.length > 0 ||
      purchaseItems.length > 0 ||
      inventoryTransactions.length > 0 ||
      returnItems.length > 0;

    if (hasHistory) {
      const archived =
        await db.orm.public.Product
          .where({
            id: productId,
          })
          .update({
            status: "Archived",
          });

      return NextResponse.json({
        message:
          "Product has business history, so it was archived instead of permanently deleted.",
        mode: "archived",
        product: archived,
      });
    }

    const deleted =
      await db.orm.public.Product
        .where({
          id: productId,
        })
        .delete();

    return NextResponse.json({
      message:
        "Product deleted successfully.",
      mode: "deleted",
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
      { status: 500 }
    );
  }
}
