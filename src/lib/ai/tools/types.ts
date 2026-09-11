export type AiToolName =
  | "getTodaySales"
  | "getSalesByDateRange"
  | "compareSalesPeriods"
  | "getTopSellingProducts"
  | "getSlowMovingProducts"
  | "getLowStockProducts"
  | "getOutOfStockProducts"
  | "getProductStock"
  | "getProductHistory"
  | "getInventoryValue"
  | "getTopCustomers"
  | "getCustomerHistory"
  | "getExpenses"
  | "getPurchases";

export type AiToolArgs = Record<string, string | number | undefined>;

export type AiToolResponse = {
  success: boolean;
  tool: AiToolName;
  verified: boolean;
  data?: unknown;
  message?: string;
  error?: string;
  permission?: {
    module: string;
    action: "view";
  };
};
