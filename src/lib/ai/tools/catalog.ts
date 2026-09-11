import type { AiToolName } from "./types";

export type ToolField = {
  key: string;
  label: string;
  type: "date" | "number";
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
};

export type AiToolCatalogItem = {
  name: AiToolName;
  label: string;
  description: string;
  module: "sales" | "inventory" | "customers" | "expenses" | "purchases";
  fields: ToolField[];
};

export const AI_TOOL_CATALOG: AiToolCatalogItem[] = [
  {
    name: "getTodaySales",
    label: "Today's Sales",
    description: "Today's verified sales, paid amount, due and invoice count.",
    module: "sales",
    fields: [],
  },
  {
    name: "getSalesByDateRange",
    label: "Sales by Date Range",
    description: "Verified sales summary between two dates.",
    module: "sales",
    fields: [
      { key: "start", label: "Start Date", type: "date", required: true },
      { key: "end", label: "End Date", type: "date", required: true },
    ],
  },
  {
    name: "compareSalesPeriods",
    label: "Compare Sales Periods",
    description: "Compare current and previous sales periods.",
    module: "sales",
    fields: [
      { key: "currentStart", label: "Current Start", type: "date", required: true },
      { key: "currentEnd", label: "Current End", type: "date", required: true },
      { key: "previousStart", label: "Previous Start", type: "date", required: true },
      { key: "previousEnd", label: "Previous End", type: "date", required: true },
    ],
  },
  {
    name: "getTopSellingProducts",
    label: "Top Selling Products",
    description: "Products ranked by sold quantity.",
    module: "sales",
    fields: [
      { key: "limit", label: "Limit", type: "number", placeholder: "5", min: 1, max: 50 },
    ],
  },
  {
    name: "getSlowMovingProducts",
    label: "Slow Moving Products",
    description: "Products with the lowest sold quantity.",
    module: "sales",
    fields: [
      { key: "limit", label: "Limit", type: "number", placeholder: "5", min: 1, max: 50 },
    ],
  },
  {
    name: "getLowStockProducts",
    label: "Low Stock",
    description: "Products at or below their low-stock threshold.",
    module: "inventory",
    fields: [],
  },
  {
    name: "getOutOfStockProducts",
    label: "Out of Stock",
    description: "Products whose current stock is zero or below.",
    module: "inventory",
    fields: [],
  },
  {
    name: "getProductStock",
    label: "Product Stock",
    description: "Current verified stock for one product.",
    module: "inventory",
    fields: [
      { key: "productId", label: "Product ID", type: "number", required: true, min: 1 },
    ],
  },
  {
    name: "getProductHistory",
    label: "Product History",
    description: "Sales, purchases, returns and inventory movement history.",
    module: "inventory",
    fields: [
      { key: "productId", label: "Product ID", type: "number", required: true, min: 1 },
    ],
  },
  {
    name: "getInventoryValue",
    label: "Inventory Summary",
    description: "Current inventory quantities, cost, retail value and margin.",
    module: "inventory",
    fields: [],
  },
  {
    name: "getTopCustomers",
    label: "Top Customers",
    description: "Customers ranked by verified revenue.",
    module: "customers",
    fields: [
      { key: "limit", label: "Limit", type: "number", placeholder: "5", min: 1, max: 50 },
    ],
  },
  {
    name: "getCustomerHistory",
    label: "Customer History",
    description: "Invoices and balances for one customer.",
    module: "customers",
    fields: [
      { key: "customerId", label: "Customer ID", type: "number", required: true, min: 1 },
    ],
  },
  {
    name: "getExpenses",
    label: "Expenses",
    description: "Expense summary, optionally filtered by date range.",
    module: "expenses",
    fields: [
      { key: "start", label: "Start Date (Optional)", type: "date" },
      { key: "end", label: "End Date (Optional)", type: "date" },
    ],
  },
  {
    name: "getPurchases",
    label: "Purchases",
    description: "Purchase summary, optionally filtered by date range.",
    module: "purchases",
    fields: [
      { key: "start", label: "Start Date (Optional)", type: "date" },
      { key: "end", label: "End Date (Optional)", type: "date" },
    ],
  },
];

export function getToolCatalogItem(name: AiToolName) {
  return AI_TOOL_CATALOG.find((item) => item.name === name);
}
