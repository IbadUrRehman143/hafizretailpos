export type ProductType = "quantity" | "weight" | "size";

export type ApiProduct = {
  id?: number | string;
  name?: string;
  sku?: string;
  category?: string;
  categoryName?: string;
  type?: ProductType | string;
  unit?: string;
  quantity?: number | string;
  purchasePrice?: number | string;
  sellingPrice?: number | string;
  weightEntries?: string;
  status?: string;
  [key: string]: unknown;
};

export type InventoryItem = {
  id: number;
  name: string;
  sku: string;
  category: string;
  productType: ProductType | string;
  unit: string;
  stock: number;
  purchasePrice: number;
  sellingPrice: number;
  weightEntries: string;
  status: string;
};

export type InventoryTransaction = {
  id?: number | string;
  productId?: number | string;
  productName?: string;
  product?: unknown;
  type?: string;
  quantity?: number | string;
  unit?: string;
  referenceType?: string;
  referenceId?: number | string;
  note?: string;
  createdAt?: string;
  [key: string]: unknown;
};
