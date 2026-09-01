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
// GET SINGLE CATEGORY
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
          message: "Invalid category ID.",
        },
        { status: 400 }
      );
    }

    const category =
      await db.orm.public.Category.where({
        id,
      }).first();

    if (!category) {
      return NextResponse.json(
        {
          message: "Category not found.",
        },
        { status: 404 }
      );
    }

    const subcategories =
      await db.orm.public.Subcategory.where({
        categoryId: id,
      }).all();

    return NextResponse.json({
      ...category,
      subcategories: subcategories.sort((a, b) =>
        String(a.name).localeCompare(String(b.name))
      ),
    });
  } catch (error) {
    console.error("GET /api/categories/[id] error:", error);

    return NextResponse.json(
      {
        message: "Unable to load category.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// UPDATE CATEGORY
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
          message: "Invalid category ID.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const name = cleanText(body.name);
    const description = cleanText(body.description);
    const status = normalizeStatus(body.status);

    if (!name) {
      return NextResponse.json(
        {
          message: "Category name is required.",
        },
        { status: 400 }
      );
    }

    const current =
      await db.orm.public.Category.where({
        id,
      }).first();

    if (!current) {
      return NextResponse.json(
        {
          message: "Category not found.",
        },
        { status: 404 }
      );
    }

    const allCategories =
      await db.orm.public.Category.all();

    const duplicate = allCategories.find(
      (category) =>
        Number(category.id) !== id &&
        String(category.name).trim().toLowerCase() ===
          name.toLowerCase()
    );

    if (duplicate) {
      return NextResponse.json(
        {
          message:
            "Another category with this name already exists.",
        },
        { status: 409 }
      );
    }

    const result = await db.transaction(async (tx) => {
      // ----------------------------------------
      // Update category
      // ----------------------------------------

      const updatedCategory =
        await tx.orm.public.Category.where({
          id,
        }).update({
          name,
          description,
          status,
        });

      // ----------------------------------------
      // Find linked products
      // ----------------------------------------

      const products =
        await tx.orm.public.Product.where({
          categoryId: id,
        }).all();

      // ----------------------------------------
      // Synchronize Product snapshots
      // ----------------------------------------

      for (const product of products) {
        await tx.orm.public.Product.where({
          id: product.id,
        }).update({
          categoryId: id,
          category: name,
          categoryName: name,
        });
      }

      return {
        category: updatedCategory,
        syncedProducts: products.length,
      };
    });

    return NextResponse.json({
      message: "Category updated successfully.",
      category: result.category,
      syncedProducts: result.syncedProducts,
    });
  } catch (error) {
    console.error("PUT /api/categories/[id] error:", error);

    return NextResponse.json(
      {
        message: "Unable to update category.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// DELETE CATEGORY
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
          message: "Invalid category ID.",
        },
        { status: 400 }
      );
    }

    const category =
      await db.orm.public.Category.where({
        id,
      }).first();

    if (!category) {
      return NextResponse.json(
        {
          message: "Category not found.",
        },
        { status: 404 }
      );
    }

    if (
      String(category.name).trim().toLowerCase() === "other"
    ) {
      return NextResponse.json(
        {
          message:
            'Default "Other" category cannot be deleted.',
        },
        { status: 400 }
      );
    }

    const result = await db.transaction(async (tx) => {
      // ----------------------------------------
      // Products currently using this category
      // ----------------------------------------

      const products =
        await tx.orm.public.Product.where({
          categoryId: id,
        }).all();

      // ----------------------------------------
      // Move products safely to Other
      // ----------------------------------------

      let otherCategory =
        await tx.orm.public.Category.where({
          name: "Other",
        }).first();

      // RC-safe fallback because string equality
      // can be inconsistent in some contracts.
      if (!otherCategory) {
        const categories =
          await tx.orm.public.Category.all();

        otherCategory = categories.find(
          (item) =>
            String(item.name).trim().toLowerCase() ===
            "other"
        );
      }

      if (!otherCategory) {
        otherCategory =
          await tx.orm.public.Category.create({
            name: "Other",
            description: "Default category",
            status: "Active",
          });
      } else if (otherCategory.status !== "Active") {
        otherCategory =
          await tx.orm.public.Category.where({
            id: otherCategory.id,
          }).update({
            status: "Active",
          });
      }

      // ----------------------------------------
      // Remove Product → Subcategory relation
      // before category/subcategories deletion.
      // ----------------------------------------

      for (const product of products) {
        await tx.orm.public.Product.where({
          id: product.id,
        }).update({
          categoryId: otherCategory.id,
          category: "Other",
          categoryName: "Other",

          subcategoryId: null,
          subcategoryName: "",
        });
      }

      // ----------------------------------------
      // Explicitly delete subcategories
      //
      // Even though schema has Cascade,
      // explicit delete keeps behavior clear.
      // ----------------------------------------

      const subcategories =
        await tx.orm.public.Subcategory.where({
          categoryId: id,
        }).all();

      for (const subcategory of subcategories) {
        await tx.orm.public.Subcategory.where({
          id: subcategory.id,
        }).delete();
      }

      // ----------------------------------------
      // Delete category
      // ----------------------------------------

      await tx.orm.public.Category.where({
        id,
      }).delete();

      return {
        movedProducts: products.length,
        deletedSubcategories: subcategories.length,
      };
    });

    return NextResponse.json({
      message:
        "Category and its subcategories deleted successfully.",

      deletedCategory: {
        id: category.id,
        name: category.name,
      },

      deletedSubcategories:
        result.deletedSubcategories,

      movedProducts: result.movedProducts,
    });
  } catch (error) {
    console.error(
      "DELETE /api/categories/[id] error:",
      error
    );

    return NextResponse.json(
      {
        message: "Unable to delete category.",
      },
      { status: 500 }
    );
  }
}