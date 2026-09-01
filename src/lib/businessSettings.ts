import { db } from "@/src/prisma/db";

export const DEFAULT_SETTINGS = {
  businessName: "Hafiz Retail POS",
  phone: "",
  email: "",
  address: "",
  currency: "PKR",
  invoicePrefix: "INV-",
  taxEnabled: false,
  taxRate: 0,
  lowStockAlert: true,
  lowStockLimit: 5,
  whatsappEnabled: false,
  autoPrint: false,
};

export async function getBusinessSettings(
  client: any = db
) {
  const rows =
    await client.orm.public.Setting.all();

  if (rows.length > 0) {
    return rows[0];
  }

  return await client.orm.public.Setting.create(
    DEFAULT_SETTINGS
  );
}

export function normalizeInvoicePrefix(
  value: unknown
) {
  const prefix =
    String(value || "INV-")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");

  return prefix || "INV-";
}

export function currencyLabel(
  currency: string
) {
  if (currency === "SAR") return "SAR";
  if (currency === "USD") return "USD";
  return "Rs.";
}
