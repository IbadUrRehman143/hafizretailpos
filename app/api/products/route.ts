import { NextResponse } from "next/server";
import { db } from "@/src/prisma/db";

/* =====================================================
   TYPES
===================================================== */

type ProductType =
  | "weight"
  | "quantity"
  | "size";

type ProductBody = {
  name?: string;

  barcode?: string;

  categoryId?: number | null;
  categoryName?: string;

  subcategoryId?: number | null;
  subcategoryName?: string;

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

  openingStockConfirmed?: boolean;
};

type ProductWithBarcode = {
  id: number;
  name: string;
  barcode?: string | null;
};

/* =====================================================
   NORMALIZE TEXT

   Icon
   icon
    ICON

   All become:
   icon
===================================================== */

function normalizeText(
  value: unknown
) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/* =====================================================
   NUMBER
===================================================== */

function numberValue(
  value: unknown
) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

/* =====================================================
   PRODUCT TYPE
===================================================== */

function normalizeProductType(
  value: unknown
): ProductType {
  if (value === "weight") {
    return "weight";
  }

  if (value === "size") {
    return "size";
  }

  return "quantity";
}

/* =====================================================
   PARSE WEIGHTS

   Example:
   82+115+67+94

   Result:
   [82, 115, 67, 94]
===================================================== */

function parseWeights(
  value: unknown
) {
  return String(value || "")
    .split("+")
    .map((item) =>
      Number(
        item.trim()
      )
    )
    .filter(
      (item) =>
        Number.isFinite(
          item
        ) &&
        item > 0
    );
}

/* =====================================================
   RESOLVE CATEGORY
===================================================== */

async function resolveCategory(
  categoryId:
    | number
    | null
    | undefined,

  categoryName:
    | string
    | undefined
) {
  const numericCategoryId =
    Number(categoryId);

  /* ===============================================
     CATEGORY ID PROVIDED
  =============================================== */

  if (
    Number.isInteger(
      numericCategoryId
    ) &&
    numericCategoryId > 0
  ) {
    const category =
      await db.orm.public.Category
        .where({
          id: numericCategoryId,
        })
        .first();

    if (!category) {
      throw new Error(
        "Selected category does not exist."
      );
    }

    return category;
  }

  /* ===============================================
     FALLBACK CATEGORY NAME
  =============================================== */

  const name =
    String(
      categoryName ||
        "Other"
    ).trim() ||
    "Other";

  const categories =
    await db.orm.public.Category.all();

  const existing =
    categories.find(
      (item) =>
        normalizeText(
          item.name
        ) ===
        normalizeText(name)
    );

  if (existing) {
    return existing;
  }

  /* ===============================================
     CREATE CATEGORY IF REQUIRED
  =============================================== */

  const created =
    await db.orm.public.Category.create({
      name,
      description: "",
      status: "Active",
    });

  return created;
}

/* =====================================================
   RESOLVE SUBCATEGORY
===================================================== */

async function resolveSubcategory(
  subcategoryId:
    | number
    | null
    | undefined,

  categoryId: number
) {
  const numericSubcategoryId =
    Number(subcategoryId);

  if (
    !Number.isInteger(
      numericSubcategoryId
    ) ||
    numericSubcategoryId <= 0
  ) {
    return null;
  }

  const subcategory =
    await db.orm.public.Subcategory
      .where({
        id: numericSubcategoryId,
      })
      .first();

  if (!subcategory) {
    throw new Error(
      "Selected subcategory does not exist."
    );
  }

  if (
    Number(
      subcategory.categoryId
    ) !==
    Number(categoryId)
  ) {
    throw new Error(
      "Selected subcategory does not belong to the selected category."
    );
  }

  if (
    normalizeText(
      subcategory.status
    ) === "inactive"
  ) {
    throw new Error(
      "Selected subcategory is inactive."
    );
  }

  return subcategory;
}

/* =====================================================
   SAME PRODUCT CHECK

   Product identity:

   Name
   + Category
   + Subcategory
   + Type
   + Brand
   + Model

   Case-insensitive.

   Example:
   Icon
   icon
   ICON

   Same category/details = SAME PRODUCT
===================================================== */

function isSameProduct(
  product: any,
  input: {
    name: string;
    categoryId: number;
    subcategoryId:
      | number
      | null;
    type: ProductType;
    brand: string;
    model: string;
  }
) {
  return (
    normalizeText(
      product.name
    ) ===
      normalizeText(
        input.name
      ) &&

    Number(
      product.categoryId || 0
    ) ===
      Number(
        input.categoryId || 0
      ) &&

    Number(
      product.subcategoryId ||
        0
    ) ===
      Number(
        input.subcategoryId ||
          0
      ) &&

    normalizeText(
      product.type
    ) ===
      normalizeText(
        input.type
      ) &&

    normalizeText(
      product.brand
    ) ===
      normalizeText(
        input.brand
      ) &&

    normalizeText(
      product.model
    ) ===
      normalizeText(
        input.model
      )
  );
}

/* =====================================================
   GET PRODUCTS
===================================================== */

export async function GET(
  request: Request
) {
  try {
    const url =
      new URL(
        request.url
      );

    const requestedStatus =
      normalizeText(
        url.searchParams.get(
          "status"
        ) || "active"
      );

    /*
      IMPORTANT:

      Prisma RC mein status equality filters
      problem de sakte hain.

      Isliye all() load karke JS filtering.
    */

    const allProducts =
      await db.orm.public.Product.all();

    let products =
      allProducts;

    if (
      requestedStatus ===
      "active"
    ) {
      products =
        allProducts.filter(
          (product) =>
            normalizeText(
              product.status
            ) ===
            "active"
        );
    }

    if (
      requestedStatus ===
      "archived"
    ) {
      products =
        allProducts.filter(
          (product) =>
            normalizeText(
              product.status
            ) ===
            "archived"
        );
    }

    products =
      [...products].sort(
        (a, b) =>
          Number(b.id) -
          Number(a.id)
      );

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

/* =====================================================
   CREATE PRODUCT
===================================================== */

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as ProductBody;

    /* ===============================================
       PRODUCT NAME
    =============================================== */

    const name =
      String(
        body.name || ""
      )
        .trim()
        .replace(
          /\s+/g,
          " "
        );

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

    /* ===============================================
       BARCODE
    =============================================== */

    const barcode =
      String(
        body.barcode || ""
      ).trim();

    if (barcode) {
      const barcodeProducts =
        (await db.orm.public.Product.all()) as unknown as ProductWithBarcode[];

      const barcodeExists =
        barcodeProducts.find(
          (product) =>
            String(
              product.barcode ||
                ""
            ).trim() ===
            barcode
        );

      if (barcodeExists) {
        return NextResponse.json(
          {
            message:
              `Barcode "${barcode}" is already assigned to "${barcodeExists.name}".`,
            code:
              "BARCODE_ALREADY_EXISTS",
          },
          {
            status: 409,
          }
        );
      }
    }

    /* ===============================================
       PRODUCT TYPE
    =============================================== */

    const type =
      normalizeProductType(
        body.type
      );

    /* ===============================================
       CATEGORY
    =============================================== */

    const category =
      await resolveCategory(
        body.categoryId,
        body.categoryName
      );

    if (
      normalizeText(
        category.status
      ) === "inactive"
    ) {
      return NextResponse.json(
        {
          message:
            "Selected category is inactive.",
        },
        {
          status: 400,
        }
      );
    }

    /* ===============================================
       SUBCATEGORY
    =============================================== */

    const subcategory =
      await resolveSubcategory(
        body.subcategoryId,
        Number(
          category.id
        )
      );

    /* ===============================================
       PRODUCT DETAILS
    =============================================== */

    const brand =
      String(
        body.brand || ""
      ).trim();

    const model =
      String(
        body.model || ""
      ).trim();

    const size =
      String(
        body.size || ""
      ).trim();

    const material =
      String(
        body.material || ""
      ).trim();

    const quality =
      String(
        body.quality || ""
      ).trim();

    const color =
      String(
        body.color || ""
      ).trim();

    /* ===============================================
       DUPLICATE PRODUCT PROTECTION
    =============================================== */

    const allProducts =
      await db.orm.public.Product.all();

    const duplicateProduct =
      allProducts.find(
        (product) =>
          isSameProduct(
            product,
            {
              name,

              categoryId:
                Number(
                  category.id
                ),

              subcategoryId:
                subcategory
                  ? Number(
                      subcategory.id
                    )
                  : null,

              type,

              brand,

              model,
            }
          )
      );

    if (duplicateProduct) {
      const duplicateStatus =
        normalizeText(
          duplicateProduct.status
        );

      /* =============================================
         ARCHIVED PRODUCT EXISTS
      ============================================= */

      if (
        duplicateStatus ===
        "archived"
      ) {
        return NextResponse.json(
          {
            message:
              `Product "${duplicateProduct.name}" already exists but is Archived. Restore the existing product instead of creating a duplicate.`,

            code:
              "PRODUCT_ARCHIVED",

            existingProduct: {
              id:
                duplicateProduct.id,

              name:
                duplicateProduct.name,

              categoryId:
                duplicateProduct.categoryId,

              categoryName:
                duplicateProduct.categoryName,

              subcategoryId:
                duplicateProduct.subcategoryId,

              subcategoryName:
                duplicateProduct.subcategoryName,

              status:
                duplicateProduct.status,

              type:
                duplicateProduct.type,

              quantity:
                duplicateProduct.quantity,

              weightEntries:
                duplicateProduct.weightEntries,
            },
          },
          {
            status: 409,
          }
        );
      }

      /* =============================================
         ACTIVE PRODUCT EXISTS
      ============================================= */

      return NextResponse.json(
        {
          message:
            `Product "${duplicateProduct.name}" already exists. Do not create it again. New supplier/company stock must be added from the Purchase module.`,

          code:
            "PRODUCT_ALREADY_EXISTS",

          existingProduct: {
            id:
              duplicateProduct.id,

            name:
              duplicateProduct.name,

            categoryId:
              duplicateProduct.categoryId,

            categoryName:
              duplicateProduct.categoryName,

            subcategoryId:
              duplicateProduct.subcategoryId,

            subcategoryName:
              duplicateProduct.subcategoryName,

            status:
              duplicateProduct.status,

            type:
              duplicateProduct.type,

            unit:
              duplicateProduct.unit,

            quantity:
              duplicateProduct.quantity,

            weightEntries:
              duplicateProduct.weightEntries,

            purchasePrice:
              duplicateProduct.purchasePrice,

            sellingPrice:
              duplicateProduct.sellingPrice,
          },
        },
        {
          status: 409,
        }
      );
    }

    /* ===============================================
       WEIGHT STOCK
    =============================================== */

    const weights =
      type === "weight"
        ? parseWeights(
            body.weightEntries
          )
        : [];

    /*
      Save only validated weights.

      Example input:
      82 + 115 + 67

      Stored:
      82+115+67
    */

    const cleanWeights =
      type === "weight"
        ? weights.join("+")
        : "";

    const totalWeight =
      weights.reduce(
        (
          total,
          weight
        ) =>
          total + weight,
        0
      );

    /* ===============================================
       QUANTITY STOCK
    =============================================== */

    const quantityInput =
      Math.max(
        0,
        numberValue(
          body.quantity
        )
      );

    if (
      type !== "weight" &&
      quantityInput > 0 &&
      !Number.isInteger(
        quantityInput
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Quantity stock must be entered in whole PCS.",
        },
        {
          status: 400,
        }
      );
    }

    /* ===============================================
       OPENING STOCK
    =============================================== */

    const openingQty =
      type === "weight"
        ? totalWeight
        : quantityInput;

    /*
      CRITICAL BUSINESS RULE:

      Add Product stock is ONLY Opening Stock.

      Supplier/company stock must come from
      Purchase module.
    */

    if (
      openingQty > 0 &&
      body.openingStockConfirmed !==
        true
    ) {
      return NextResponse.json(
        {
          message:
            "Stock entered while adding a product must be confirmed as OPENING STOCK. If this stock came from a supplier/company, enter it from the Purchase module instead.",

          code:
            "OPENING_STOCK_CONFIRMATION_REQUIRED",
        },
        {
          status: 409,
        }
      );
    }

    /* ===============================================
       UNIT
    =============================================== */

    const unit =
      type === "weight"
        ? "KG"
        : String(
            body.unit ||
              "PCS"
          )
            .trim()
            .toUpperCase() ||
          "PCS";

    /* ===============================================
       PRICES
    =============================================== */

    const purchasePrice =
      Math.max(
        0,
        numberValue(
          body.purchasePrice
        )
      );

    const sellingPrice =
      Math.max(
        0,
        numberValue(
          body.sellingPrice
        )
      );

    /* ===============================================
       CREATE PRODUCT + OPENING TRANSACTION
    =============================================== */

    const product =
      await db.transaction(
        async (tx) => {
          /*
            Extra duplicate check inside transaction.

            Helps protect when Admin and Manager
            send requests close together.
          */

          const transactionProducts =
            await tx.orm.public.Product.all();

          const duplicateInsideTransaction =
            transactionProducts.find(
              (existingProduct) =>
                isSameProduct(
                  existingProduct,
                  {
                    name,

                    categoryId:
                      Number(
                        category.id
                      ),

                    subcategoryId:
                      subcategory
                        ? Number(
                            subcategory.id
                          )
                        : null,

                    type,

                    brand,

                    model,
                  }
                )
            );

          if (
            duplicateInsideTransaction
          ) {
            throw new Error(
              "__DUPLICATE_PRODUCT__"
            );
          }

          /* =========================================
             CREATE PRODUCT MASTER
          ========================================= */

          const productData = {
            name,

            barcode:
              barcode || null,

            category:
              category.name,

            categoryId:
              category.id,

            categoryName:
              category.name,

            subcategoryId:
              subcategory
                ? subcategory.id
                : null,

            subcategoryName:
              subcategory
                ? subcategory.name
                : "",

            status:
              "Active",

            type,

            unit,

            purchasePrice,

            sellingPrice,

            /*
              Weight product:
              quantity is NOT stock source.
            */

            quantity:
              type === "weight"
                ? 0
                : openingQty,

            /*
              Weight product stock source:
              exact physical bundles.
            */

            weightEntries:
              type === "weight"
                ? cleanWeights
                : "",

            size,

            material,

            brand,

            model,

            quality,

            color,
          } as any;

          const created =
            await tx.orm.public.Product.create(
              productData
            );

          /* =========================================
             OPENING STOCK TRANSACTION
          ========================================= */

          if (
            openingQty > 0
          ) {
            await tx.orm.public.InventoryTransaction.create({
              productId:
                created.id,

              type:
                "OPENING_STOCK",

              quantity:
                openingQty,

              unit,

              referenceType:
                "PRODUCT",

              referenceId:
                created.id,

              note:
                type ===
                "weight"
                  ? `Opening stock confirmed while creating product. ${weights.length} bundle(s): ${cleanWeights}`
                  : "Opening stock confirmed while creating product.",
            });
          }

          return created;
        }
      );

    /* ===============================================
       SUCCESS
    =============================================== */

    return NextResponse.json(
      product,
      {
        status: 201,
      }
    );
  } catch (error) {
    /* ===============================================
       TRANSACTION DUPLICATE
    =============================================== */

    if (
      error instanceof Error &&
      error.message ===
        "__DUPLICATE_PRODUCT__"
    ) {
      return NextResponse.json(
        {
          message:
            "This product already exists. Duplicate product creation was blocked. Use the Purchase module to add new supplier stock.",

          code:
            "PRODUCT_ALREADY_EXISTS",
        },
        {
          status: 409,
        }
      );
    }

    console.error(
      "CREATE PRODUCT ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to create product.",
      },
      {
        status: 500,
      }
    );
  }
}