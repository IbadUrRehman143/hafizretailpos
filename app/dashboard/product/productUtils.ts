import {
  Product,
  ProductType,
} from "./productTypes";

export function calculateWeights(
  value: string
) {
  const weights = String(value || "")
    .split("+")
    .map((item) =>
      Number(item.trim())
    )
    .filter(
      (item) =>
        Number.isFinite(item) &&
        item > 0
    );

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

  return {
    id:
      Number(raw.id) || 0,

    name:
      String(
        raw.name || ""
      ),

    category:
      String(
        raw.category ||
          "Other"
      ),

    type,

    unit:
      type === "weight"
        ? "KG"
        : String(
            raw.unit ||
              "PCS"
          ),

    purchasePrice:
      Number(
        raw.purchasePrice
      ) || 0,

    sellingPrice:
      Number(
        raw.sellingPrice
      ) || 0,

    quantity:
      type === "weight"
        ? 0
        : Math.max(
            0,
            Number(
              raw.quantity
            ) || 0
          ),

    weightEntries:
      type === "weight"
        ? String(
            raw.weightEntries ||
              ""
          )
        : "",

    size:
      String(
        raw.size || ""
      ),

    material:
      String(
        raw.material ||
          ""
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
        raw.quality ||
          ""
      ),

    color:
      String(
        raw.color || ""
      ),
  };
}

export function getStock(
  product: Product
) {
  if (
    product.type === "weight"
  ) {
    return calculateWeights(
      product.weightEntries
    ).totalWeight;
  }

  return (
    Number(
      product.quantity
    ) || 0
  );
}

export function getWeightQuantity(
  product: Product
) {
  if (
    product.type !== "weight"
  ) {
    return 0;
  }

  return calculateWeights(
    product.weightEntries
  ).quantity;
}

export function getTypeLabel(
  type: ProductType
) {
  if (type === "weight") {
    return "Weight";
  }

  if (type === "size") {
    return "Size";
  }

  return "Quantity";
}

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