import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeStatus(value: unknown) {
  return String(value ?? "").trim().toLowerCase() === "inactive"
    ? "Inactive"
    : "Active";
}

function getId(
  params: { id: string } | Promise<{ id: string }>
): Promise<number> {
  return Promise.resolve(params).then((value) =>
    Number(value.id)
  );
}

// ======================================================
// GET SINGLE SUBCATEGORY
// ======================================================

export async function GET(
  _request: NextRequest,
  context: {
    params: { id: string } | Promise<{ id: string }>;
  }
) {
  try {
    const id = await getId(context.params);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          message: "Invalid subcategory ID.",
        },
        { status: 400 }
      );
    }

    const subcategory =
      await db.orm.public.Subcategory.where({
        id,
      }).first();

    if (!subcategory) {
      return NextResponse.json(
        {
          message: "Subcategory not found.",
        },
        { status: 404 }
      );
    }

    const category =
      await db.orm.public.Category.where({
        id: subcategory.categoryId,
      }).first();

    return NextResponse.json({
      ...subcategory,

      categoryName:
        category?.name ?? "",
    });
  } catch (error) {
    console.error(
      "GET /api/subcategories/[id] error:",
      error
    );

    return NextResponse.json(
      {
        message: "Unable to load subcategory.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// UPDATE SUBCATEGORY
// ======================================================

export async function PUT(
  request: NextRequest,
  context: {
    params: { id: string } | Promise<{ id: string }>;
  }
) {
  try {
    const id = await getId(context.params);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          message: "Invalid subcategory ID.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const name = cleanText(body.name);

    const description = cleanText(
      body.description
    );

    const status = normalizeStatus(body.status);

    if (!name) {
      return NextResponse.json(
        {
          message: "Subcategory name is required.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // Existing subcategory
    // ----------------------------------------

    const current =
      await db.orm.public.Subcategory.where({
        id,
      }).first();

    if (!current) {
      return NextResponse.json(
        {
          message: "Subcategory not found.",
        },
        { status: 404 }
      );
    }

    // Allow moving subcategory to another category.
    const categoryId =
      body.categoryId !== undefined
        ? Number(body.categoryId)
        : Number(current.categoryId);

    if (
      !Number.isInteger(categoryId) ||
      categoryId <= 0
    ) {
      return NextResponse.json(
        {
          message: "Valid category is required.",
        },
        { status: 400 }
      );
    }

    const category =
      await db.orm.public.Category.where({
        id: categoryId,
      }).first();

    if (!category) {
      return NextResponse.json(
        {
          message: "Category not found.",
        },
        { status: 404 }
      );
    }

    // ----------------------------------------
    // Duplicate check
    // ----------------------------------------

    const allSubcategories =
      await db.orm.public.Subcategory.all();

    const duplicate = allSubcategories.find(
      (subcategory) =>
        Number(subcategory.id) !== id &&
        Number(subcategory.categoryId) ===
          categoryId &&
        String(subcategory.name)
          .trim()
          .toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      return NextResponse.json(
        {
          message:
            "This subcategory already exists in the selected category.",
        },
        { status: 409 }
      );
    }

    // ----------------------------------------
    // Update + Product synchronization
    // ----------------------------------------

    const result = await db.transaction(
      async (tx) => {
        const updated =
          await tx.orm.public.Subcategory.where({
            id,
          }).update({
            categoryId,
            name,
            description,
            status,
          });

        const products =
          await tx.orm.public.Product.where({
            subcategoryId: id,
          }).all();

        for (const product of products) {
          await tx.orm.public.Product.where({
            id: product.id,
          }).update({
            categoryId: category.id,

            category: category.name,

            categoryName: category.name,

            subcategoryId: id,

            subcategoryName: name,
          });
        }

        return {
          subcategory: updated,
          syncedProducts: products.length,
        };
      }
    );

    return NextResponse.json({
      message:
        "Subcategory updated successfully.",

      subcategory: {
        ...result.subcategory,

        categoryName: category.name,
      },

      syncedProducts: result.syncedProducts,
    });
  } catch (error) {
    console.error(
      "PUT /api/subcategories/[id] error:",
      error
    );

    return NextResponse.json(
      {
        message: "Unable to update subcategory.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// DELETE SUBCATEGORY
// ======================================================

export async function DELETE(
  _request: NextRequest,
  context: {
    params: { id: string } | Promise<{ id: string }>;
  }
) {
  try {
    const id = await getId(context.params);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          message: "Invalid subcategory ID.",
        },
        { status: 400 }
      );
    }

    const subcategory =
      await db.orm.public.Subcategory.where({
        id,
      }).first();

    if (!subcategory) {
      return NextResponse.json(
        {
          message: "Subcategory not found.",
        },
        { status: 404 }
      );
    }

    const result = await db.transaction(
      async (tx) => {
        // ------------------------------------
        // Products using this Subcategory
        // ------------------------------------

        const products =
          await tx.orm.public.Product.where({
            subcategoryId: id,
          }).all();

        // ------------------------------------
        // Remove only Subcategory from Product
        //
        // Category remains unchanged.
        // ------------------------------------

        for (const product of products) {
          await tx.orm.public.Product.where({
            id: product.id,
          }).update({
            subcategoryId: null,
            subcategoryName: "",
          });
        }

        // ------------------------------------
        // Delete Subcategory
        // ------------------------------------

        await tx.orm.public.Subcategory.where({
          id,
        }).delete();

        return {
          affectedProducts: products.length,
        };
      }
    );

    return NextResponse.json({
      message:
        "Subcategory deleted successfully.",

      deletedSubcategory: {
        id: subcategory.id,
        name: subcategory.name,
        categoryId: subcategory.categoryId,
      },

      affectedProducts:
        result.affectedProducts,
    });
  } catch (error) {
    console.error(
      "DELETE /api/subcategories/[id] error:",
      error
    );

    return NextResponse.json(
      {
        message: "Unable to delete subcategory.",
      },
      { status: 500 }
    );
  }
}