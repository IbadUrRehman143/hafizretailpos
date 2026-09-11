import { db } from "@/src/prisma/db";

import { roundMoney, toNumber } from "./helpers";

type Row = Record<string, unknown>;

function calculateWeightEntries(weightEntries: unknown): number {
  const raw = String(weightEntries ?? "").trim();

  if (!raw) {
    return 0;
  }

  return roundMoney(
    raw
      .split("+")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value))
      .reduce((sum, value) => sum + value, 0)
  );
}

function isWeightProduct(product: Row): boolean {
  return (
    String(product.type ?? "")
      .trim()
      .toLowerCase() === "weight"
  );
}

function stockOf(product: Row): number {
  if (isWeightProduct(product)) {
    return calculateWeightEntries(
      product.weightEntries
    );
  }

  return toNumber(
    product.quantity ??
      product.stock ??
      product.totalWeight
  );
}

function lowLimitOf(product: Row): number {
  return toNumber(
    product.lowStockLimit ??
      product.reorderLevel ??
      product.minimumStock
  );
}

export async function getLowStockProducts() {
  const rows =
    (await db.orm.public.Product.all()) as unknown as Row[];

  return rows
    .map((product) => ({
      id: toNumber(product.id),

      name: String(
        product.name ?? ""
      ),

      type: String(
        product.type ?? ""
      ),

      unit: String(
        product.unit ?? ""
      ),

      stock: stockOf(product),

      lowStockLimit:
        lowLimitOf(product),
    }))
    .filter(
      (product) =>
        product.stock <=
        product.lowStockLimit
    )
    .sort(
      (a, b) =>
        a.stock - b.stock
    );
}

export async function getOutOfStockProducts() {
  const rows =
    (await db.orm.public.Product.all()) as unknown as Row[];

  return rows
    .map((product) => ({
      id: toNumber(product.id),

      name: String(
        product.name ?? ""
      ),

      type: String(
        product.type ?? ""
      ),

      unit: String(
        product.unit ?? ""
      ),

      stock: stockOf(product),
    }))
    .filter(
      (product) =>
        product.stock <= 0
    );
}

export async function getInventoryValue() {
  const rows =
    (await db.orm.public.Product.all()) as unknown as Row[];

  let totalQuantityStock = 0;
  let totalWeightStock = 0;

  let quantityProducts = 0;
  let weightProducts = 0;

  let totalCostValue = 0;
  let totalRetailValue = 0;

  for (const product of rows) {
    const stock =
      stockOf(product);

    const cost =
      toNumber(
        product.purchasePrice ??
          product.costPrice
      );

    const sellingPrice =
      toNumber(
        product.sellingPrice ??
          product.price
      );

    if (isWeightProduct(product)) {
      totalWeightStock += stock;
      weightProducts += 1;
    } else {
      totalQuantityStock += stock;
      quantityProducts += 1;
    }

    totalCostValue +=
      stock * cost;

    totalRetailValue +=
      stock * sellingPrice;
  }

  return {
    products: rows.length,

    quantityProducts,

    weightProducts,

    totalQuantityStock:
      roundMoney(
        totalQuantityStock
      ),

    totalWeightStock:
      roundMoney(
        totalWeightStock
      ),

    totalCostValue:
      roundMoney(
        totalCostValue
      ),

    totalRetailValue:
      roundMoney(
        totalRetailValue
      ),

    potentialGrossMargin:
      roundMoney(
        totalRetailValue -
          totalCostValue
      ),
  };
}