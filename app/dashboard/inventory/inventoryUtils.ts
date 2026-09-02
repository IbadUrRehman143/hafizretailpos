import type {
  ApiProduct,
  InventoryItem,
  ProductType,
} from "./inventoryTypes";

function toNumber(
  value: unknown
) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function cleanString(
  value: unknown
) {
  return String(
    value ?? ""
  ).trim();
}

function parseWeights(
  value: unknown
) {
  return cleanString(value)
    .split("+")
    .map((entry) =>
      Number(entry.trim())
    )
    .filter(
      (entry) =>
        Number.isFinite(entry) &&
        entry > 0
    );
}

export function formatCurrency(
  value: number
) {
  return `Rs. ${Number(
    value || 0
  ).toLocaleString(
    "en-PK",
    {
      maximumFractionDigits: 2,
    }
  )}`;
}

export function normalizeInventoryItem(
  product: ApiProduct
): InventoryItem {
  const raw =
    product as unknown as Record<
      string,
      unknown
    >;

  let productType: ProductType =
    "quantity";

  if (
    raw.type === "weight"
  ) {
    productType = "weight";
  } else if (
    raw.type === "size"
  ) {
    productType = "size";
  }

  const weights =
    productType === "weight"
      ? parseWeights(
          raw.weightEntries
        )
      : [];

  const stock =
    productType === "weight"
      ? weights.reduce(
          (
            total,
            weight
          ) =>
            total + weight,
          0
        )
      : Math.max(
          0,
          toNumber(
            raw.quantity
          )
        );

  const item: InventoryItem =
    {
      id: toNumber(
        raw.id
      ),

      name:
        cleanString(
          raw.name
        ) ||
        "Unnamed Product",

      sku:
        cleanString(
          raw.sku
        ) ||
        (toNumber(raw.id) >
        0
          ? `PRD-${String(
              toNumber(
                raw.id
              )
            ).padStart(
              4,
              "0"
            )}`
          : ""),

      category:
        cleanString(
          raw.categoryName
        ) ||
        cleanString(
          raw.category
        ) ||
        "Other",

      productType,

      unit:
        productType ===
        "weight"
          ? "KG"
          : cleanString(
                raw.unit
              ) ||
            "PCS",

      stock,

      purchasePrice:
        Math.max(
          0,
          toNumber(
            raw.purchasePrice
          )
        ),

      sellingPrice:
        Math.max(
          0,
          toNumber(
            raw.sellingPrice
          )
        ),

      weightEntries:
        productType ===
        "weight"
          ? cleanString(
              raw.weightEntries
            )
          : "",

      status:
        cleanString(
          raw.status
        ) ||
        "Active",
    };

  return item;
}

export function getStockStatus(
  item: InventoryItem
):
  | "In Stock"
  | "Low Stock"
  | "Out of Stock" {
  const stock =
    Number(
      item.stock
    ) || 0;

  if (stock <= 0) {
    return "Out of Stock";
  }

  if (stock <= 5) {
    return "Low Stock";
  }

  return "In Stock";
}