import type {
  ApiRecord,
  PaymentMethod,
  Product,
  ProductType,
  Purchase,
  PurchaseItem,
  PurchaseStatus,
  Supplier,
} from "./purchaseTypes";

export function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getRecord(value: unknown): ApiRecord {
  return isRecord(value) ? value : {};
}

export function getString(record: ApiRecord, key: string, fallback = "") {
  const value = record[key];
  return value === null || value === undefined ? fallback : String(value);
}

export function getNumber(record: ApiRecord, key: string, fallback = 0) {
  const value = Number(record[key]);
  return Number.isFinite(value) ? value : fallback;
}

export function getArray(record: ApiRecord, key: string): unknown[] {
  return Array.isArray(record[key]) ? (record[key] as unknown[]) : [];
}

export function numberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export function formatCurrency(value: number) {
  return `Rs. ${numberValue(value).toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  })}`;
}

export function normalizeStatus(value: unknown): PurchaseStatus {
  const status = String(value || "").toUpperCase();
  if (status === "PAID") return "Paid";
  if (status === "PARTIAL") return "Partial";
  return "Unpaid";
}

export function normalizePaymentMethod(value: unknown): PaymentMethod {
  const method = String(value || "Cash");
  if (method === "Bank" || method === "Credit" || method === "Other") {
    return method;
  }
  return "Cash";
}

export function normalizeProductType(value: unknown): ProductType {
  const type = String(value || "quantity").toLowerCase();
  if (type === "weight") return "weight";
  if (type === "size") return "size";
  return "quantity";
}

export function parseBundleWeights(value: string) {
  return String(value || "")
    .split(/[,+;\s]+/)
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
}

export async function readApiResponse(response: Response): Promise<ApiRecord> {
  const text = await response.text();
  if (!text) return {};

  try {
    return getRecord(JSON.parse(text));
  } catch {
    if (response.status === 404) {
      throw new Error("API route not found. Check app/api/purchases/route.ts path.");
    }
    throw new Error(`Server returned invalid response (${response.status}).`);
  }
}

export function normalizeProduct(value: unknown): Product {
  const raw = getRecord(value);
  const type = normalizeProductType(raw.type);

  return {
    id: getNumber(raw, "id"),
    name: getString(raw, "name"),
    category: getString(raw, "categoryName", getString(raw, "category")),
    type,
    unit: type === "weight" ? "KG" : getString(raw, "unit", "PCS"),
    purchasePrice: getNumber(raw, "purchasePrice"),
    sellingPrice: getNumber(raw, "sellingPrice"),
    quantity: getNumber(raw, "quantity"),
    weightEntries: getString(raw, "weightEntries"),
  };
}

export function normalizeSupplier(value: unknown): Supplier {
  const raw = getRecord(value);
  return {
    id: getNumber(raw, "id"),
    name: getString(raw, "name"),
    phone: getString(raw, "phone"),
  };
}

export function normalizePurchaseItem(value: unknown): PurchaseItem {
  const raw = getRecord(value);
  const unit: "KG" | "PCS" =
    getString(raw, "unit", "PCS").toUpperCase() === "KG" ? "KG" : "PCS";
  const quantity = getNumber(raw, "quantity");
  const purchasePrice = getNumber(raw, "purchasePrice");
  const amount = getNumber(raw, "amount");
  const total = getNumber(raw, "total");
  const id = getNumber(raw, "id");

  return {
    id: id > 0 ? id : undefined,
    productId: getNumber(raw, "productId"),
    productName: getString(raw, "productName", getString(raw, "name", "Product")),
    quantity,
    unit,
    purchasePrice,
    total: total > 0 ? total : amount > 0 ? amount : quantity * purchasePrice,
    weightEntries: getString(raw, "weightEntries"),
  };
}

export function normalizePurchase(value: unknown): Purchase {
  const raw = getRecord(value);
  const items = getArray(raw, "items").map(normalizePurchaseItem);
  const calculatedSubtotal = items.reduce((total, item) => total + item.total, 0);
  const subtotal = getNumber(raw, "subtotal", calculatedSubtotal);
  const paidAmount = getNumber(raw, "paidAmount");

  let remainingAmount = Math.max(0, subtotal - paidAmount);
  if (raw.remainingBalance !== undefined) {
    remainingAmount = numberValue(raw.remainingBalance);
  } else if (raw.remainingAmount !== undefined) {
    remainingAmount = numberValue(raw.remainingAmount);
  }

  const supplierRecord = getRecord(raw.supplier);
  const id = getNumber(raw, "id");
  const purchaseNumber = getString(raw, "purchaseNumber");
  const invoiceNo = getString(raw, "invoiceNo");
  const purchaseDate = getString(raw, "purchaseDate");
  const date = getString(raw, "date");
  const createdAt = getString(raw, "createdAt");
  const finalDate = (date || purchaseDate || createdAt).split("T")[0];

  return {
    id,
    invoiceNo: purchaseNumber || invoiceNo || `PUR-${String(id).padStart(4, "0")}`,
    date: finalDate,
    supplierId: getNumber(raw, "supplierId"),
    supplierName: getString(raw, "supplierName", getString(supplierRecord, "name", "Supplier")),
    supplierPhone: getString(raw, "supplierPhone", getString(supplierRecord, "phone")),
    supplierBillNo: getString(raw, "supplierBillNo"),
    items,
    subtotal,
    paidAmount,
    remainingAmount,
    paymentMethod: normalizePaymentMethod(raw.paymentMethod),
    status: normalizeStatus(raw.status),
    notes: getString(raw, "notes"),
    createdAt: createdAt || undefined,
  };
}
