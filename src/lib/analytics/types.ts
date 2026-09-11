export type SalesSummary = {
  invoiceCount: number;
  revenue: number;
  paid: number;
  due: number;
};

export type ProductSalesMetric = {
  productId: number | null;
  productName: string;
  quantity: number;
  revenue: number;
};

export type LowStockMetric = {
  id: number;
  name: string;
  stock: number;
  lowStockLimit: number;
};

export type CustomerMetric = {
  customerId: number;
  customerName: string;
  invoices: number;
  revenue: number;
  paid: number;
  due: number;
};
