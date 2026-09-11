import type { AiToolName } from "@/src/lib/ai/tools/types";

type FunctionTool = {
  type: "function";
  name: AiToolName;
  description: string;
  strict: true;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
    additionalProperties: false;
  };
};

const integerProperty = (description: string, minimum = 1) => ({
  type: "integer",
  minimum,
  description,
});

const nullableStringProperty = (description: string) => ({
  type: ["string", "null"],
  description,
});

export const OPENAI_BUSINESS_TOOLS: FunctionTool[] = [
  {
    type: "function",
    name: "getTodaySales",
    description:
      "Return today's verified sales summary: invoice count, revenue, paid amount and due amount.",
    strict: true,
    parameters: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "getSalesByDateRange",
    description:
      "Return verified sales analytics between an inclusive start date and end date. Use YYYY-MM-DD dates.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        start: { type: "string", description: "Start date in YYYY-MM-DD format." },
        end: { type: "string", description: "End date in YYYY-MM-DD format." },
      },
      required: ["start", "end"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "compareSalesPeriods",
    description:
      "Compare two verified sales periods. Use when the user asks growth, change, comparison, this period vs another period, or current vs previous.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        currentStart: {
          type: "string",
          description: "Current period start date in YYYY-MM-DD format.",
        },
        currentEnd: {
          type: "string",
          description: "Current period end date in YYYY-MM-DD format.",
        },
        previousStart: {
          type: "string",
          description: "Previous/comparison period start date in YYYY-MM-DD format.",
        },
        previousEnd: {
          type: "string",
          description: "Previous/comparison period end date in YYYY-MM-DD format.",
        },
      },
      required: ["currentStart", "currentEnd", "previousStart", "previousEnd"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "getTopSellingProducts",
    description:
      "Return verified top-selling products ranked by quantity sold. Use for best sellers, top products, most sold items.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        limit: integerProperty("Maximum number of products to return, normally 5.", 1),
      },
      required: ["limit"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "getSlowMovingProducts",
    description:
      "Return verified slow-moving products. Use for lowest-selling, weak-selling, slow-moving or least-sold products.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        limit: integerProperty("Maximum number of products to return, normally 5.", 1),
      },
      required: ["limit"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "getLowStockProducts",
    description:
      "Return verified products at or below their configured low-stock threshold.",
    strict: true,
    parameters: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "getOutOfStockProducts",
    description: "Return verified products whose current stock is zero or below.",
    strict: true,
    parameters: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "getProductStock",
    description:
      "Return the verified current stock of one product. Use when the user supplies a product ID and asks current stock/quantity/KG.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        productId: integerProperty("The numeric product ID.", 1),
      },
      required: ["productId"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "getProductHistory",
    description:
      "Return verified product history including current stock, sales, purchases, returns and inventory movements.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        productId: integerProperty("The numeric product ID.", 1),
      },
      required: ["productId"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "getInventoryValue",
    description:
      "Return the verified business inventory summary including quantity products, weight products, current stock, cost value, retail value and potential gross margin.",
    strict: true,
    parameters: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "getTopCustomers",
    description:
      "Return verified top customers ranked by revenue. Use for best customers, top buyers or highest-value customers.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        limit: integerProperty("Maximum number of customers to return, normally 5.", 1),
      },
      required: ["limit"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "getCustomerHistory",
    description:
      "Return verified history for one customer. Use when the user supplies a customer ID and asks invoices, purchases, paid or due history.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        customerId: integerProperty("The numeric customer ID.", 1),
      },
      required: ["customerId"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "getExpenses",
    description:
      "Return verified expense analytics. Can cover all available expenses or a requested date range.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        start: nullableStringProperty(
          "Start date in YYYY-MM-DD format, or null when the user did not request a date range."
        ),
        end: nullableStringProperty(
          "End date in YYYY-MM-DD format, or null when the user did not request a date range."
        ),
      },
      required: ["start", "end"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "getPurchases",
    description:
      "Return verified purchase analytics. Can cover all available purchases or a requested date range.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        start: nullableStringProperty(
          "Start date in YYYY-MM-DD format, or null when the user did not request a date range."
        ),
        end: nullableStringProperty(
          "End date in YYYY-MM-DD format, or null when the user did not request a date range."
        ),
      },
      required: ["start", "end"],
      additionalProperties: false,
    },
  },
];
