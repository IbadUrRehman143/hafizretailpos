import { db } from "@/src/prisma/db";

import {
  getRecordDate,
  roundMoney,
  toNumber,
} from "./helpers";

type Row = Record<string, unknown>;

function normalizeRows(value: unknown): Row[] {
  return Array.isArray(value) ? (value as Row[]) : [];
}

async function optionalAll(modelName: string): Promise<Row[]> {
  try {
    const publicOrm = db.orm.public as unknown as Record<
      string,
      {
        all?: () => Promise<unknown>;
      }
    >;

    const model = publicOrm[modelName];

    if (!model || typeof model.all !== "function") {
      return [];
    }

    return normalizeRows(await model.all());
  } catch {
    return [];
  }
}

function productMatches(row: Row, productId: number): boolean {
  return (
    toNumber(
      row.productId ??
        row.product_id ??
        row.itemProductId
    ) === productId
  );
}

function sortNewestFirst(rows: Row[]): Row[] {
  return [...rows].sort((a, b) => {
    const aDate = getRecordDate(a)?.getTime() ?? 0;
    const bDate = getRecordDate(b)?.getTime() ?? 0;

    return bDate - aDate;
  });
}

function calculateWeightEntries(
  weightEntries: unknown
): number {
  const raw = String(weightEntries ?? "").trim();

  if (!raw) {
    return 0;
  }

  const total = raw
    .split("+")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value))
    .reduce((sum, value) => sum + value, 0);

  return roundMoney(total);
}

function readCurrentStock(product: Row): number {
  const productType = String(
    product.type ?? ""
  )
    .trim()
    .toLowerCase();

  if (productType === "weight") {
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

export async function getProductHistory(productId: number) {
  if (!Number.isInteger(productId) || productId <= 0) {
    throw new Error("Invalid product ID.");
  }

  const product =
    (await db.orm.public.Product.where({
      id: productId,
    }).first()) as unknown as Row | null;

  if (!product) {
    throw new Error("Product not found.");
  }

  const [
    invoiceItemsRaw,
    invoicesRaw,
    inventoryTransactionsRaw,
    purchaseItemsRaw,
    purchasesRaw,
    returnItemsRaw,
    returnsRaw,
  ] = await Promise.all([
    optionalAll("InvoiceItem"),
    optionalAll("Invoice"),
    optionalAll("InventoryTransaction"),
    optionalAll("PurchaseItem"),
    optionalAll("Purchase"),
    optionalAll("ReturnItem"),
    optionalAll("Return"),
  ]);

  const invoiceItems = invoiceItemsRaw.filter((row) =>
    productMatches(row, productId)
  );

  const invoiceMap = new Map<number, Row>(
    invoicesRaw.map((invoice) => [
      toNumber(invoice.id),
      invoice,
    ])
  );

  const salesHistory = sortNewestFirst(
    invoiceItems.map((item) => {
      const invoiceId = toNumber(item.invoiceId);

      const invoice = invoiceMap.get(invoiceId);

      const quantity = toNumber(item.quantity);

      const rate = toNumber(item.rate);

      const lineRevenue =
        toNumber(
          item.amount ??
            item.total ??
            item.lineTotal
        ) ||
        quantity * rate;

      return {
        ...item,
        invoice: invoice ?? null,
        calculatedRevenue: roundMoney(lineRevenue),
      };
    })
  );

  const totalSoldQuantity = roundMoney(
    invoiceItems.reduce(
      (sum, item) =>
        sum + toNumber(item.quantity),
      0
    )
  );

  const salesRevenue = roundMoney(
    invoiceItems.reduce((sum, item) => {
      const quantity = toNumber(item.quantity);

      const rate = toNumber(item.rate);

      const lineRevenue =
        toNumber(
          item.amount ??
            item.total ??
            item.lineTotal
        ) ||
        quantity * rate;

      return sum + lineRevenue;
    }, 0)
  );

  const inventoryHistory = sortNewestFirst(
    inventoryTransactionsRaw.filter((row) =>
      productMatches(row, productId)
    )
  );

  const purchaseMap = new Map<number, Row>(
    purchasesRaw.map((purchase) => [
      toNumber(purchase.id),
      purchase,
    ])
  );

  const purchaseHistory = sortNewestFirst(
    purchaseItemsRaw
      .filter((row) =>
        productMatches(row, productId)
      )
      .map((item) => {
        const purchaseId = toNumber(
          item.purchaseId
        );

        return {
          ...item,
          purchase:
            purchaseMap.get(purchaseId) ?? null,
        };
      })
  );

  const returnMap = new Map<number, Row>(
    returnsRaw.map((returnRow) => [
      toNumber(returnRow.id),
      returnRow,
    ])
  );

  const returnHistory = sortNewestFirst(
    returnItemsRaw
      .filter((row) =>
        productMatches(row, productId)
      )
      .map((item) => {
        const returnId = toNumber(
          item.returnId ??
            item.salesReturnId
        );

        return {
          ...item,
          return:
            returnMap.get(returnId) ?? null,
        };
      })
  );

  const lastSoldDate =
    salesHistory.length > 0
      ? getRecordDate(
          salesHistory[0] as Row
        )
      : null;

  const lastPurchasedDate =
    purchaseHistory.length > 0
      ? getRecordDate(
          purchaseHistory[0] as Row
        )
      : null;

  const purchasePrice = toNumber(
    product.purchasePrice ??
      product.costPrice
  );

  const sellingPrice = toNumber(
    product.sellingPrice ??
      product.price
  );

  const estimatedGrossProfit = roundMoney(
    salesRevenue -
      totalSoldQuantity * purchasePrice
  );

  const currentStock = readCurrentStock(product);

  return {
    product,

    summary: {
      currentStock,

      totalSoldQuantity,

      salesRevenue,

      estimatedGrossProfit,

      purchasePrice,

      sellingPrice,

      salesCount: salesHistory.length,

      purchaseCount: purchaseHistory.length,

      returnCount: returnHistory.length,

      inventoryMovementCount:
        inventoryHistory.length,

      lastSoldDate:
        lastSoldDate
          ? lastSoldDate.toISOString()
          : null,

      lastPurchasedDate:
        lastPurchasedDate
          ? lastPurchasedDate.toISOString()
          : null,
    },

    salesHistory,

    purchaseHistory,

    returnHistory,

    inventoryHistory,
  };
}