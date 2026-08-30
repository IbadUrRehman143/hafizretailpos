import {
  ApiProduct,
  InventoryItem,
  ProductType,
  StockStatus,
  StockType,
} from "./inventoryTypes";

/* =====================================================
   SAFE NUMBER
===================================================== */

export function safeNumber(
  value: unknown
) {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}

/* =====================================================
   NORMALIZE PRODUCT TYPE
===================================================== */

export function normalizeProductType(
  value: unknown
): ProductType {
  const type =
    String(
      value || ""
    ).toLowerCase();

  if (
    type === "weight"
  ) {
    return "weight";
  }

  if (
    type === "size"
  ) {
    return "size";
  }

  return "quantity";
}

/* =====================================================
   WEIGHT ENTRIES

   Example:
   "87+76+98+12"
===================================================== */

export function parseWeightEntries(
  value: unknown
) {
  return String(
    value || ""
  )
    .split("+")
    .map(
      (item) =>
        safeNumber(
          item.trim()
        )
    )
    .filter(
      (item) =>
        item > 0
    );
}

/* =====================================================
   TOTAL WEIGHT STOCK
===================================================== */

export function calculateWeightStock(
  value: unknown
) {
  return parseWeightEntries(
    value
  ).reduce(
    (
      total,
      weight
    ) =>
      total +
      weight,
    0
  );
}

/* =====================================================
   FORMAT WEIGHT ENTRIES
===================================================== */

export function formatWeightEntries(
  entries: number[]
) {
  return entries
    .filter(
      (entry) =>
        entry > 0
    )
    .map(
      (entry) =>
        Number(
          entry.toFixed(
            2
          )
        )
    )
    .join("+");
}

/* =====================================================
   REMOVE WEIGHT FIFO

   Example:

   Current:
   80 + 60 + 50

   Remove:
   100

   Result:
   40 + 50
===================================================== */

export function removeWeightFIFO(
  currentEntries: number[],
  amountToRemove: number
) {
  let remaining =
    amountToRemove;

  const updatedEntries =
    [...currentEntries];

  while (
    remaining > 0 &&
    updatedEntries.length >
      0
  ) {
    const firstWeight =
      updatedEntries[0];

    if (
      firstWeight <=
      remaining
    ) {
      remaining -=
        firstWeight;

      updatedEntries.shift();
    } else {
      updatedEntries[0] =
        firstWeight -
        remaining;

      remaining = 0;
    }
  }

  return updatedEntries;
}

/* =====================================================
   INVENTORY NORMALIZER
===================================================== */

export function normalizeInventoryItem(
  product: ApiProduct
): InventoryItem {
  const productType =
    normalizeProductType(
      product.type
    );

  const isWeight =
    productType ===
    "weight";

  const stock =
    isWeight
      ? calculateWeightStock(
          product.weightEntries
        )
      : Math.max(
          0,
          safeNumber(
            product.quantity
          )
        );

  const type: StockType =
    productType ===
    "weight"
      ? "Weight"
      : productType ===
          "size"
        ? "Size"
        : "Quantity";

  /*
    Business Low Stock Rules

    Weight products:
    <= 100 KG

    Quantity / Size:
    <= 5 PCS
  */

  const lowStockLimit =
    isWeight
      ? 100
      : 5;

  return {
    id:
      Number(
        product.id
      ),

    name:
      String(
        product.name ||
          "Unnamed Product"
      ),

    sku:
      `PRD-${String(
        product.id
      ).padStart(
        4,
        "0"
      )}`,

    category:
      String(
        product.category ||
          "Other"
      ),

    productType,

    type,

    stock,

    unit:
      isWeight
        ? "KG"
        : "PCS",

    lowStockLimit,

    purchasePrice:
      Math.max(
        0,
        safeNumber(
          product.purchasePrice
        )
      ),

    sellingPrice:
      Math.max(
        0,
        safeNumber(
          product.sellingPrice
        )
      ),

    weightEntries:
      String(
        product.weightEntries ||
          ""
      ),

    originalProduct:
      product,
  };
}

/* =====================================================
   STOCK STATUS
===================================================== */

export function getStockStatus(
  item: InventoryItem
): StockStatus {
  if (
    item.stock <= 0
  ) {
    return "Out of Stock";
  }

  if (
    item.stock <=
    item.lowStockLimit
  ) {
    return "Low Stock";
  }

  return "In Stock";
}

/* =====================================================
   CURRENCY
===================================================== */

export function formatCurrency(
  value: number
) {
  return `Rs. ${Number(
    value || 0
  ).toLocaleString(
    "en-PK",
    {
      maximumFractionDigits:
        2,
    }
  )}`;
}