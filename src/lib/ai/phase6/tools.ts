export const PHASE6_OPENAI_TOOLS = [
  {
    type: "function" as const,
    name: "getProductSalesVelocity",
    description: "Get verified 7-day/30-day sales velocity and stock intelligence for a product ID.",
    strict: true as const,
    parameters: {
      type: "object",
      properties: { productId: { type: "integer", minimum: 1 } },
      required: ["productId"],
      additionalProperties: false,
    },
  },
  {
    type: "function" as const,
    name: "getStockCoverage",
    description: "Get verified current stock, daily velocity, days remaining and stock risk for a product ID.",
    strict: true as const,
    parameters: {
      type: "object",
      properties: { productId: { type: "integer", minimum: 1 } },
      required: ["productId"],
      additionalProperties: false,
    },
  },
  {
    type: "function" as const,
    name: "getStockRiskProducts",
    description: "Get verified products currently classified Watch, High Risk or Out of Stock.",
    strict: true as const,
    parameters: { type: "object", properties: {}, required: [], additionalProperties: false },
  },
  {
    type: "function" as const,
    name: "getReorderSuggestions",
    description: "Get verified reorder suggestions based on sales velocity and target stock coverage.",
    strict: true as const,
    parameters: {
      type: "object",
      properties: { targetStockDays: { type: "integer", minimum: 7, maximum: 90 } },
      required: ["targetStockDays"],
      additionalProperties: false,
    },
  },
  {
    type: "function" as const,
    name: "getPurchaseRecommendations",
    description: "Create a verified purchase recommendation list with priority, quantity/KG and estimated purchase cost.",
    strict: true as const,
    parameters: {
      type: "object",
      properties: { targetStockDays: { type: "integer", minimum: 7, maximum: 90 } },
      required: ["targetStockDays"],
      additionalProperties: false,
    },
  },
  {
    type: "function" as const,
    name: "getInventoryIntelligenceSummary",
    description: "Get the complete verified smart inventory intelligence summary.",
    strict: true as const,
    parameters: {
      type: "object",
      properties: { targetStockDays: { type: "integer", minimum: 7, maximum: 90 } },
      required: ["targetStockDays"],
      additionalProperties: false,
    },
  },
] as const;
