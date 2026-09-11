export type DateRangeInput = { start?: string; end?: string };

export type BusinessAlertSeverity = "INFO" | "WATCH" | "HIGH";

export type BusinessAlert = {
  id: string;
  severity: BusinessAlertSeverity;
  area: "sales" | "customers" | "credit" | "expenses" | "profit" | "data-quality";
  title: string;
  message: string;
};

export type BusinessIntelligenceSummary = {
  period: { start: string; end: string; days: number };
  sales: {
    invoices: number;
    grossRevenue: number;
    returnAdjustedRevenue: number;
    paid: number;
    outstanding: number;
    averageInvoiceValue: number;
    retailRevenue: number;
    wholesaleRevenue: number;
    currentPeriodRevenue: number;
    previousPeriodRevenue: number;
    growthPercent: number | null;
    topProducts: Array<{
      productId: number;
      productName: string;
      unit: string;
      quantity: number;
      revenue: number;
      profit: number;
    }>;
  };
  customers: {
    wholesaleCustomers: number;
    activeCustomers: number;
    customersWithDue: number;
    totalOutstanding: number;
    topCustomers: Array<{
      customerId: number;
      name: string;
      invoices: number;
      revenue: number;
      outstanding: number;
    }>;
  };
  credit: {
    totalOutstanding: number;
    unpaidInvoices: number;
    partialInvoices: number;
    aging: { days0to7: number; days8to30: number; days31to60: number; days61plus: number };
    highestDueInvoices: Array<{
      invoiceId: number;
      invoiceNumber: string;
      customerName: string;
      due: number;
      ageDays: number;
    }>;
  };
  expenses: {
    count: number;
    total: number;
    paid: number;
    pending: number;
    byCategory: Array<{ category: string; amount: number; count: number }>;
  };
  profitability: {
    grossSalesProfit: number;
    returnAdjustedGrossProfit: number;
    operatingExpenses: number;
    estimatedOperatingProfit: number;
    grossMarginPercent: number | null;
  };
  returns: {
    completedReturns: number;
    returnedRevenue: number;
    returnedCost: number;
    returnedProfit: number;
  };
  alerts: BusinessAlert[];
  generatedAt: string;
};
