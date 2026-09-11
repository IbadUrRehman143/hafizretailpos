import "server-only";

import { db } from "@/src/prisma/db";
import type {
  InventoryIntelligenceItem,
  InventoryIntelligenceSummary,
  StockRisk,
} from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;
const DEFAULT_TARGET_DAYS = 30;
const WATCH_DAYS = 14;
const HIGH_RISK_DAYS = 7;

function n(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function parseWeightEntries(value: unknown): number {
  return String(value ?? "")
    .split("+")
    .map((part) => n(part.trim()))
    .filter((value) => value > 0)
    .reduce((sum, value) => sum + value, 0);
}

function currentStock(product: Record<string, unknown>) {
  return String(product.type ?? "").toLowerCase() === "weight"
    ? parseWeightEntries(product.weightEntries)
    : Math.max(0, n(product.quantity));
}

function riskFor(stock: number, daysRemaining: number | null): {
  risk: StockRisk;
  reason: string;
} {
  if (stock <= 0) {
    return { risk: "OUT_OF_STOCK", reason: "Current stock is zero." };
  }

  if (daysRemaining === null) {
    return {
      risk: "SAFE",
      reason: "No recent sales velocity; no immediate stock-out signal.",
    };
  }

  if (daysRemaining <= HIGH_RISK_DAYS) {
    return {
      risk: "HIGH_RISK",
      reason: `Only about ${round(daysRemaining, 1)} days of stock remain.`,
    };
  }

  if (daysRemaining <= WATCH_DAYS) {
    return {
      risk: "WATCH",
      reason: `About ${round(daysRemaining, 1)} days of stock remain.`,
    };
  }

  return {
    risk: "SAFE",
    reason: `About ${round(daysRemaining, 1)} days of stock remain.`,
  };
}

export async function getInventoryIntelligence(
  targetStockDays = DEFAULT_TARGET_DAYS
): Promise<InventoryIntelligenceSummary> {
  const cleanTargetDays = Math.min(90, Math.max(7, Math.floor(n(targetStockDays) || DEFAULT_TARGET_DAYS)));

  const [productsRaw, invoicesRaw, invoiceItemsRaw] = await Promise.all([
    db.orm.public.Product.all(),
    db.orm.public.Invoice.all(),
    db.orm.public.InvoiceItem.all(),
  ]);

  const products = productsRaw as unknown as Record<string, unknown>[];
  const invoices = invoicesRaw as unknown as Record<string, unknown>[];
  const invoiceItems = invoiceItemsRaw as unknown as Record<string, unknown>[];

  const now = Date.now();
  const cutoff30 = now - WINDOW_DAYS * DAY_MS;
  const cutoff7 = now - 7 * DAY_MS;

  const invoiceDate = new Map<number, number>();
  for (const invoice of invoices) {
    if (invoice.finalized === false) continue;
    const id = n(invoice.id);
    const timestamp = new Date(String(invoice.createdAt ?? "")).getTime();
    if (id > 0 && Number.isFinite(timestamp)) invoiceDate.set(id, timestamp);
  }

  const sales = new Map<number, { d7: number; d30: number }>();

  for (const item of invoiceItems) {
    const invoiceId = n(item.invoiceId);
    const productId = n(item.productId);
    const timestamp = invoiceDate.get(invoiceId);

    if (!timestamp || timestamp < cutoff30 || productId <= 0) continue;

    // InvoiceItem.quantity is the sold amount for both PCS and KG in the live schema.
    const sold = Math.max(0, n(item.quantity));
    if (sold <= 0) continue;

    const current = sales.get(productId) ?? { d7: 0, d30: 0 };
    current.d30 += sold;
    if (timestamp >= cutoff7) current.d7 += sold;
    sales.set(productId, current);
  }

  const items: InventoryIntelligenceItem[] = products
    .filter((product) => String(product.status ?? "Active").toLowerCase() !== "archived")
    .map((product) => {
      const productId = n(product.id);
      const sold = sales.get(productId) ?? { d7: 0, d30: 0 };
      const stock = currentStock(product);

      const avg7 = sold.d7 / 7;
      const avg30 = sold.d30 / 30;

      // Recent demand gets more weight while the 30-day baseline reduces noise.
      const weightedVelocity =
        avg7 > 0 || avg30 > 0 ? avg7 * 0.65 + avg30 * 0.35 : 0;

      const daysRemaining =
        weightedVelocity > 0 ? stock / weightedVelocity : null;

      const { risk, reason } = riskFor(stock, daysRemaining);

      const reorderPoint = weightedVelocity * WATCH_DAYS;
      const targetStock = weightedVelocity * cleanTargetDays;
      const recommendedReorder =
        weightedVelocity > 0 ? Math.max(0, targetStock - stock) : 0;

      const reorderRequired =
        risk === "OUT_OF_STOCK" ||
        risk === "HIGH_RISK" ||
        (risk === "WATCH" && recommendedReorder > 0);

      const finalReorder = reorderRequired ? recommendedReorder : 0;
      const purchasePrice = Math.max(0, n(product.purchasePrice));

      return {
        productId,
        productName: String(product.name ?? `Product ${productId}`),
        productType: String(product.type ?? "quantity"),
        unit:
          String(product.type ?? "").toLowerCase() === "weight"
            ? "KG"
            : String(product.unit ?? "PCS"),
        currentStock: round(stock),
        sold7Days: round(sold.d7),
        sold30Days: round(sold.d30),
        avgDaily7Days: round(avg7, 3),
        avgDaily30Days: round(avg30, 3),
        weightedDailyVelocity: round(weightedVelocity, 3),
        daysRemaining:
          daysRemaining === null ? null : round(daysRemaining, 1),
        risk,
        riskReason: reason,
        reorderRequired,
        targetStockDays: cleanTargetDays,
        reorderPoint: round(reorderPoint),
        recommendedReorder: round(finalReorder),
        purchasePrice: round(purchasePrice),
        estimatedPurchaseCost: round(finalReorder * purchasePrice),
      };
    })
    .sort((a, b) => {
      const priority: Record<StockRisk, number> = {
        OUT_OF_STOCK: 0,
        HIGH_RISK: 1,
        WATCH: 2,
        SAFE: 3,
      };
      return priority[a.risk] - priority[b.risk] ||
        (a.daysRemaining ?? Number.POSITIVE_INFINITY) -
          (b.daysRemaining ?? Number.POSITIVE_INFINITY);
    });

  return {
    generatedAt: new Date().toISOString(),
    windowDays: 30,
    targetStockDays: cleanTargetDays,
    products: items.length,
    safe: items.filter((x) => x.risk === "SAFE").length,
    watch: items.filter((x) => x.risk === "WATCH").length,
    highRisk: items.filter((x) => x.risk === "HIGH_RISK").length,
    outOfStock: items.filter((x) => x.risk === "OUT_OF_STOCK").length,
    reorderProducts: items.filter((x) => x.reorderRequired).length,
    estimatedPurchaseCost: round(
      items.reduce((sum, x) => sum + x.estimatedPurchaseCost, 0)
    ),
    items,
  };
}

export async function getProductSalesVelocity(productId: number) {
  const summary = await getInventoryIntelligence();
  return summary.items.find((x) => x.productId === productId) ?? null;
}

export async function getStockCoverage(productId: number) {
  const item = await getProductSalesVelocity(productId);
  if (!item) return null;
  return {
    productId: item.productId,
    productName: item.productName,
    currentStock: item.currentStock,
    unit: item.unit,
    weightedDailyVelocity: item.weightedDailyVelocity,
    daysRemaining: item.daysRemaining,
    risk: item.risk,
    riskReason: item.riskReason,
  };
}

export async function getStockRiskProducts() {
  const summary = await getInventoryIntelligence();
  return summary.items.filter((x) => x.risk !== "SAFE");
}

export async function getReorderSuggestions(targetStockDays = DEFAULT_TARGET_DAYS) {
  const summary = await getInventoryIntelligence(targetStockDays);
  return summary.items.filter((x) => x.reorderRequired);
}

export async function getPurchaseRecommendations(targetStockDays = DEFAULT_TARGET_DAYS) {
  const summary = await getInventoryIntelligence(targetStockDays);
  return {
    targetStockDays: summary.targetStockDays,
    estimatedPurchaseCost: summary.estimatedPurchaseCost,
    products: summary.items
      .filter((x) => x.reorderRequired)
      .map((x) => ({
        productId: x.productId,
        productName: x.productName,
        priority: x.risk,
        unit: x.unit,
        currentStock: x.currentStock,
        daysRemaining: x.daysRemaining,
        suggestedQuantity: x.recommendedReorder,
        estimatedCost: x.estimatedPurchaseCost,
        reason: x.riskReason,
      })),
  };
}
