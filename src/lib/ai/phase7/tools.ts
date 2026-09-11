const dateProperties = {
  start: { type: ["string", "null"], description: "Optional start date, e.g. 2026-09-01." },
  end: { type: ["string", "null"], description: "Optional end date, e.g. 2026-09-30." },
};

function tool(name: string, description: string) {
  return {
    type: "function" as const,
    name,
    description,
    strict: true,
    parameters: {
      type: "object",
      properties: dateProperties,
      required: ["start", "end"],
      additionalProperties: false,
    },
  };
}

export const phase7OpenAITools = [
  tool("getBusinessIntelligenceSummary", "Get verified sales, customers, credit, expenses, profitability, returns and business alerts for a period."),
  tool("getSalesIntelligence", "Get verified sales trends and top-product intelligence."),
  tool("getCustomerIntelligence", "Get verified customer performance and outstanding-balance intelligence."),
  tool("getCreditIntelligence", "Get verified customer credit, due invoices and aging intelligence."),
  tool("getExpenseIntelligence", "Get verified expense totals and category breakdown."),
  tool("getProfitabilityIntelligence", "Get verified gross-profit and expense-adjusted operating-profit intelligence."),
  tool("getBusinessAlerts", "Get deterministic business alerts for sales, credit, expenses and profit."),
];
