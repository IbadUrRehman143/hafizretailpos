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

/* =========================================
   GET ALL PRODUCTS
========================================= */

export async function GET() {
  try {
    const products =
      await db.orm.public.Product.all();

    return NextResponse.json(
      products
    );
  } catch (error) {
    console.error(
      "GET PRODUCTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Unable to load products.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================
   CREATE PRODUCT
========================================= */

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as ProductBody;

    const name =
      String(
        body.name || ""
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

    const type: ProductType =
      body.type === "weight" ||
      body.type === "size"
        ? body.type
        : "quantity";

    const product =
      await db.orm.public.Product.create({
        name,

        category:
          String(
            body.category ||
              "Other"
          ),

        type,

        unit:
          type === "weight"
            ? "KG"
            : String(
                body.unit ||
                  "PCS"
              ),

        purchasePrice:
          Math.max(
            0,
            Number(
              body.purchasePrice
            ) || 0
          ),

        sellingPrice:
          Math.max(
            0,
            Number(
              body.sellingPrice
            ) || 0
          ),

        quantity:
          type === "weight"
            ? 0
            : Math.max(
                0,
                Number(
                  body.quantity
                ) || 0
              ),

        weightEntries:
          type === "weight"
            ? String(
                body.weightEntries ||
                  ""
              )
            : "",

        size:
          String(
            body.size || ""
          ),

        material:
          String(
            body.material ||
              ""
          ),

        brand:
          String(
            body.brand || ""
          ),

        model:
          String(
            body.model || ""
          ),

        quality:
          String(
            body.quality || ""
          ),

        color:
          String(
            body.color || ""
          ),
      });

    return NextResponse.json(
      product,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE PRODUCT ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Unable to create product.",
      },
      {
        status: 500,
      }
    );
  }
}