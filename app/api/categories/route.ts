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

// ======================================================
// GET ALL CATEGORIES
// ======================================================

export async function GET() {
  try {
    const categories = await db.orm.public.Category.all();

    const subcategories = await db.orm.public.Subcategory.all();

    const result = categories
      .map((category) => {
        const children = subcategories
          .filter(
            (subcategory) =>
              Number(subcategory.categoryId) === Number(category.id)
          )
          .sort((a, b) =>
            String(a.name).localeCompare(String(b.name))
          );

        return {
          ...category,
          subcategories: children,
        };
      })
      .sort((a, b) =>
        String(a.name).localeCompare(String(b.name))
      );

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/categories error:", error);

    return NextResponse.json(
      {
        message: "Unable to load categories.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// CREATE CATEGORY
// ======================================================

export async function POST(request: NextRequest) {
  try {
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

    // Prisma 8 RC safe duplicate check.
    const categories = await db.orm.public.Category.all();

    const duplicate = categories.find(
      (category) =>
        String(category.name).trim().toLowerCase() ===
        name.toLowerCase()
    );

    if (duplicate) {
      return NextResponse.json(
        {
          message: "Category already exists.",
          category: duplicate,
        },
        { status: 409 }
      );
    }

    const category = await db.orm.public.Category.create({
      name,
      description,
      status,
    });

    return NextResponse.json(category, {
      status: 201,
    });
  } catch (error) {
    console.error("POST /api/categories error:", error);

    return NextResponse.json(
      {
        message: "Unable to create category.",
      },
      { status: 500 }
    );
  }
}