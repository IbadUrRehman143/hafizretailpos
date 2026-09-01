import {
  type Product,
  type ProductType,
  type Category,
  type Subcategory,
} from "./productTypes";

// ======================================================
// NUMBER
// ======================================================

export function safeNumber(
  value: unknown
) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

// ======================================================
// WEIGHT PARSER
// ======================================================

export function parseWeights(
  value: string
): number[] {
  return String(value || "")
    .split(/[+,\n\r\s]+/)
    .map((item) =>
      Number(item.trim())
    )
    .filter(
      (item) =>
        Number.isFinite(item) &&
        item > 0
    );
}

// ======================================================
// CLEAN WEIGHT ENTRIES
// ======================================================

export function cleanWeightEntries(
  value: string
) {
  return parseWeights(value).join("+");
}

// ======================================================
// CALCULATE WEIGHTS
// ======================================================

export function calculateWeights(
  value: string
) {
  const weights =
    parseWeights(value);

  const quantity =
    weights.length;

  const totalWeight =
    weights.reduce(
      (total, weight) =>
        total + weight,
      0
    );

  return {
    weights,
    quantity,
    totalWeight,
  };
}

// ======================================================
// APPEND WEIGHTS
// ======================================================

export function appendWeights(
  current: string,
  newWeights: number[]
) {
  const existing =
    parseWeights(current);

  const validNew =
    newWeights.filter(
      (weight) =>
        Number.isFinite(weight) &&
        weight > 0
    );

  return [
    ...existing,
    ...validNew,
  ].join("+");
}

// ======================================================
// NORMALIZE PRODUCT
// ======================================================

export function normalizeProduct(
  value: unknown
): Product | null {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return null;
  }

  const raw =
    value as Record<
      string,
      unknown
    >;

  const rawType =
    raw.type;

  const type: ProductType =
    rawType === "weight" ||
    rawType === "quantity" ||
    rawType === "size"
      ? rawType
      : "quantity";

  const categoryId =
    raw.categoryId === null ||
    raw.categoryId === undefined
      ? null
      : Number(
          raw.categoryId
        ) || null;

  const subcategoryId =
    raw.subcategoryId === null ||
    raw.subcategoryId === undefined
      ? null
      : Number(
          raw.subcategoryId
        ) || null;

  return {
    id:
      Number(raw.id) || 0,

    name:
      String(
        raw.name || ""
      ),

    categoryId,

    categoryName:
      String(
        raw.categoryName ||
          raw.category ||
          "Other"
      ),

    subcategoryId,

    subcategoryName:
      String(
        raw.subcategoryName ||
          ""
      ),

    status:
      raw.status ===
      "Archived"
        ? "Archived"
        : "Active",

    type,

    unit:
      type === "weight"
        ? "KG"
        : String(
            raw.unit ||
              "PCS"
          ),

    purchasePrice:
      Math.max(
        0,
        safeNumber(
          raw.purchasePrice
        )
      ),

    sellingPrice:
      Math.max(
        0,
        safeNumber(
          raw.sellingPrice
        )
      ),

    quantity:
      type === "weight"
        ? 0
        : Math.max(
            0,
            safeNumber(
              raw.quantity
            )
          ),

    weightEntries:
      type === "weight"
        ? cleanWeightEntries(
            String(
              raw.weightEntries ||
                ""
            )
          )
        : "",

    size:
      String(
        raw.size || ""
      ),

    material:
      String(
        raw.material || ""
      ),

    brand:
      String(
        raw.brand || ""
      ),

    model:
      String(
        raw.model || ""
      ),

    quality:
      String(
        raw.quality || ""
      ),

    color:
      String(
        raw.color || ""
      ),
  };
}

// ======================================================
// NORMALIZE CATEGORY
// ======================================================

export function normalizeCategory(
  value: unknown
): Category | null {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return null;
  }

  const raw =
    value as Record<
      string,
      unknown
    >;

  const id =
    Number(raw.id);

  const name =
    String(
      raw.name || ""
    ).trim();

  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    !name
  ) {
    return null;
  }

  const rawSubcategories =
    Array.isArray(
      raw.subcategories
    )
      ? raw.subcategories
      : [];

  return {
    id,

    name,

    description:
      String(
        raw.description ||
          ""
      ),

    status:
      raw.status ===
      "Inactive"
        ? "Inactive"
        : "Active",

    subcategories:
      rawSubcategories
        .map(
          normalizeSubcategory
        )
        .filter(
          (
            item
          ): item is Subcategory =>
            item !== null
        ),
  };
}

// ======================================================
// NORMALIZE SUBCATEGORY
// ======================================================

export function normalizeSubcategory(
  value: unknown
): Subcategory | null {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return null;
  }

  const raw =
    value as Record<
      string,
      unknown
    >;

  const id =
    Number(raw.id);

  const categoryId =
    Number(
      raw.categoryId
    );

  const name =
    String(
      raw.name || ""
    ).trim();

  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    !Number.isInteger(
      categoryId
    ) ||
    categoryId <= 0 ||
    !name
  ) {
    return null;
  }

  return {
    id,

    categoryId,

    name,

    description:
      String(
        raw.description ||
          ""
      ),

    status:
      raw.status ===
      "Inactive"
        ? "Inactive"
        : "Active",

    categoryName:
      raw.categoryName
        ? String(
            raw.categoryName
          )
        : undefined,
  };
}

// ======================================================
// PRODUCT STOCK
// ======================================================

export function getStock(
  product: Product
) {
  if (
    product.type ===
    "weight"
  ) {
    return calculateWeights(
      product.weightEntries
    ).totalWeight;
  }

  return Math.max(
    0,
    Number(
      product.quantity
    ) || 0
  );
}

// ======================================================
// BUNDLE COUNT
// ======================================================

export function getWeightQuantity(
  product: Product
) {
  if (
    product.type !==
    "weight"
  ) {
    return 0;
  }

  return calculateWeights(
    product.weightEntries
  ).quantity;
}

// ======================================================
// TYPE LABEL
// ======================================================

export function getTypeLabel(
  type: ProductType
) {
  if (
    type === "weight"
  ) {
    return "Weight";
  }

  if (
    type === "size"
  ) {
    return "Size";
  }

  return "Quantity";
}

// ======================================================
// ERROR MESSAGE
// ======================================================

export async function getErrorMessage(
  response: Response
) {
  try {
    const data =
      (await response.json()) as {
        message?: string;
      };

    return (
      data.message ||
      "Something went wrong."
    );
  } catch {
    return "Something went wrong.";
  }
}