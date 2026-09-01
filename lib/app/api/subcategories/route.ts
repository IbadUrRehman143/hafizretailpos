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
// GET SUBCATEGORIES
//
// Examples:
//
// /api/subcategories
//
// /api/subcategories?categoryId=1
//
// /api/subcategories?categoryId=1&status=active
// ======================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams =
      request.nextUrl.searchParams;

    const categoryIdValue =
      searchParams.get("categoryId");

    const statusValue = cleanText(
      searchParams.get("status")
    ).toLowerCase();

    let subcategories =
      await db.orm.public.Subcategory.all();

    // ----------------------------------------
    // Filter by category
    // ----------------------------------------

    if (categoryIdValue) {
      const categoryId = Number(categoryIdValue);

      if (
        !Number.isInteger(categoryId) ||
        categoryId <= 0
      ) {
        return NextResponse.json(
          {
            message: "Invalid category ID.",
          },
          { status: 400 }
        );
      }

      subcategories = subcategories.filter(
        (item) =>
          Number(item.categoryId) === categoryId
      );
    }

    // ----------------------------------------
    // Filter status
    // ----------------------------------------

    if (statusValue === "active") {
      subcategories = subcategories.filter(
        (item) =>
          String(item.status).toLowerCase() ===
          "active"
      );
    }

    if (statusValue === "inactive") {
      subcategories = subcategories.filter(
        (item) =>
          String(item.status).toLowerCase() ===
          "inactive"
      );
    }

    subcategories.sort((a, b) =>
      String(a.name).localeCompare(String(b.name))
    );

    return NextResponse.json(subcategories);
  } catch (error) {
    console.error(
      "GET /api/subcategories error:",
      error
    );

    return NextResponse.json(
      {
        message: "Unable to load subcategories.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// CREATE SUBCATEGORY
// ======================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const categoryId = Number(body.categoryId);

    const name = cleanText(body.name);

    const description = cleanText(
      body.description
    );

    const status = normalizeStatus(body.status);

    // ----------------------------------------
    // Validation
    // ----------------------------------------

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

    if (!name) {
      return NextResponse.json(
        {
          message: "Subcategory name is required.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // Category exists?
    // ----------------------------------------

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

    if (
      String(category.status).toLowerCase() !==
      "active"
    ) {
      return NextResponse.json(
        {
          message:
            "Cannot add a subcategory to an inactive category.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // Duplicate check
    // ----------------------------------------

    const existing =
      await db.orm.public.Subcategory.all();

    const duplicate = existing.find(
      (subcategory) =>
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

          subcategory: duplicate,
        },
        { status: 409 }
      );
    }

    // ----------------------------------------
    // Create
    // ----------------------------------------

    const subcategory =
      await db.orm.public.Subcategory.create({
        categoryId,
        name,
        description,
        status,
      });

    return NextResponse.json(
      {
        ...subcategory,

        categoryName: category.name,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/subcategories error:",
      error
    );

    return NextResponse.json(
      {
        message: "Unable to create subcategory.",
      },
      { status: 500 }
    );
  }
}