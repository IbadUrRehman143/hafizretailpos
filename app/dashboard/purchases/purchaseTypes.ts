export type PaymentMethod = "Cash" | "Bank" | "Credit" | "Other";
export type PurchaseStatus = "Paid" | "Partial" | "Unpaid";
export type ProductType = "weight" | "quantity" | "size";

export type Supplier = {
  id: number;
  name: string;
  phone: string;
};

export type Product = {
  id: number;
  name: string;
  category: string;
  type: ProductType;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  weightEntries: string;
};

export type PurchaseItem = {
  id?: number;
  productId: number;
  productName: string;
  quantity: number;
  unit: "KG" | "PCS";
  purchasePrice: number;
  total: number;
  weightEntries?: string;
};

export type Purchase = {
  id: number;
  invoiceNo: string;
  date: string;
  supplierId: number;
  supplierName: string;
  supplierPhone?: string;
  items: PurchaseItem[];
  subtotal: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  status: PurchaseStatus;
  notes: string;
  createdAt?: string;
};

export type PurchaseForm = {
  date: string;
  supplierId: string;
  productId: string;
  quantity: string;
  bundleWeights: string;
  purchasePrice: string;
  paidAmount: string;
  paymentMethod: PaymentMethod;
  notes: string;
};

export type SupplierForm = {
  name: string;
  phone: string;
};

export type ApiRecord = Record<string, unknown>;
