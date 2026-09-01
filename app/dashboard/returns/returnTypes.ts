export type ReturnStatus =
  | "Pending"
  | "Approved"
  | "Completed"
  | "Rejected";

export type RefundMethod =
  | "Cash"
  | "Bank"
  | "Credit"
  | "Other";

export type ReturnItem = {
  id: number;
  invoiceItemId: number;
  productId: number;
  productName: string;
  productType: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
  weightEntries: string;
};

export type ReturnRecord = {
  id: number;
  returnNo: string;
  invoiceId: number;
  invoiceNo: string;
  date: string;
  customerName: string;
  customerPhone: string;
  items: ReturnItem[];
  totalAmount: number;
  refundAmount: number;
  refundMethod: RefundMethod;
  reason: string;
  status: ReturnStatus;
  notes: string;
};

export type InvoiceOptionItem = {
  id: number;
  productId: number;
  productName: string;
  productType: string;
  quantity: number;
  unit: string;
  rate: number;
  weightEntries?: string;
  returnedQuantity?: number;
};

export type InvoiceOption = {
  id: number;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  items: InvoiceOptionItem[];
};

export type ReturnFormItem = {
  invoiceItemId: number;
  productId: number;
  productName: string;
  productType: string;
  unit: string;
  soldQuantity: number;
  alreadyReturned: number;
  availableQuantity: number;
  rate: number;
  returnQuantity: string;
  weightEntries: string;
};
