export type ProductType =
  | "quantity"
  | "weight"
  | "size";

export interface ApiProduct {
  id?: number;
  name?: string;
  sku?: string | null;

  category?: string | null;
  categoryName?: string | null;

  type?: ProductType | string | null;
  unit?: string | null;

  quantity?: number | string | null;

  purchasePrice?: number | string | null;
  sellingPrice?: number | string | null;

  weightEntries?: string | null;

  status?: string | null;

  [key: string]: unknown;
}

export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  category: string;
  productType: ProductType;
  unit: string;
  stock: number;
  purchasePrice: number;
  sellingPrice: number;
  weightEntries: string;
  status: string;
}

export interface InventoryTransaction {
  id?: number;
  productId?: number;
  productName?: string | null;
  type?: string | null;
  quantity?: number | string | null;
  unit?: string | null;
  referenceType?: string | null;
  referenceId?: number | string | null;
  note?: string | null;
  createdAt?: string | Date | null;

  product?: {
    id?: number;
    name?: string | null;
    [key: string]: unknown;
  } | null;

  [key: string]: unknown;
}