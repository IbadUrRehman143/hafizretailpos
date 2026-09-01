export type ProductType =
  | "quantity"
  | "weight"
  | "size";

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

  size: string;
  material: string;
  brand: string;
  model: string;
  quality: string;
  color: string;
};

export type InvoiceItem = {
  id: string;

  productId: number | null;

  name: string;

  type: ProductType;

  unit: string;

  quantity: number;

  weight: number;

  price: number;

  discount: number;

  total: number;
};

export type Customer = {
  id?: number;

  name: string;

  phone: string;

  address: string;
};

export type PaymentMethod =
  | "Cash"
  | "Bank"
  | "Credit"
  | "Other";

export type InvoiceStatus =
  | "Paid"
  | "Partial"
  | "Unpaid";

export type InvoiceFormData = {
  invoiceNumber: string;

  date: string;

  customer: Customer;

  items: InvoiceItem[];

  paymentMethod: PaymentMethod;

  amountPaid: number;

  notes: string;
};

export type InvoiceTotals = {
  subtotal: number;

  discount: number;

  tax: number;

  grandTotal: number;

  amountPaid: number;

  remaining: number;

  change: number;
};