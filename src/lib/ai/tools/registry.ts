import "server-only";

import { currentSession } from "@/src/lib/auth/currentUser";
import { hasPermission } from "@/src/lib/auth/access";
import {
  compareSalesPeriods,
  getCustomerHistory,
  getExpenses,
  getInventoryValue,
  getLowStockProducts,
  getOutOfStockProducts,
  getPurchases,
  getSalesByDateRange,
  getSlowMovingProducts,
  getTodaySales,
  getTopCustomers,
  getTopSellingProducts,
} from "@/src/lib/analytics";
import { getProductHistory } from "@/src/lib/analytics/productHistory";

import type { AiToolArgs, AiToolName } from "./types";

type PermissionModule =
  | "sales"
  | "inventory"
  | "customers"
  | "expenses"
  | "purchases";

type ToolDefinition = {
  module: PermissionModule;
  execute: (args: AiToolArgs) => Promise<unknown>;
};

export class AiToolAuthError extends Error {
  readonly status: 401 | 403;

  constructor(message: string, status: 401 | 403) {
    super(message);
    this.name = "AiToolAuthError";
    this.status = status;
  }
}

export class AiToolValidationError extends Error {
  readonly status = 400 as const;

  constructor(message: string) {
    super(message);
    this.name = "AiToolValidationError";
  }
}

function requiredString(args: AiToolArgs, key: string): string {
  const value = String(args[key] ?? "").trim();
  if (!value) throw new AiToolValidationError(`${key} is required.`);
  return value;
}

function optionalString(args: AiToolArgs, key: string): string | undefined {
  const value = String(args[key] ?? "").trim();
  return value || undefined;
}

function positiveInteger(
  args: AiToolArgs,
  key: string,
  fallback?: number,
  max?: number
): number {
  const raw = args[key];

  if ((raw === undefined || raw === "") && fallback !== undefined) {
    return fallback;
  }

  const value = Number(raw);

  if (!Number.isInteger(value) || value <= 0) {
    throw new AiToolValidationError(`${key} must be a positive integer.`);
  }

  if (max && value > max) {
    throw new AiToolValidationError(`${key} must be ${max} or less.`);
  }

  return value;
}

function optionalDateRange(args: AiToolArgs) {
  const start = optionalString(args, "start");
  const end = optionalString(args, "end");

  if ((start && !end) || (!start && end)) {
    throw new AiToolValidationError(
      "Provide both start and end dates, or leave both empty."
    );
  }

  return { start, end };
}

const TOOL_REGISTRY: Record<AiToolName, ToolDefinition> = {
  getTodaySales: {
    module: "sales",
    execute: async () => getTodaySales(),
  },

  getSalesByDateRange: {
    module: "sales",
    execute: async (args) =>
      getSalesByDateRange(
        requiredString(args, "start"),
        requiredString(args, "end")
      ),
  },

  compareSalesPeriods: {
    module: "sales",
    execute: async (args) =>
      compareSalesPeriods(
        requiredString(args, "currentStart"),
        requiredString(args, "currentEnd"),
        requiredString(args, "previousStart"),
        requiredString(args, "previousEnd")
      ),
  },

  getTopSellingProducts: {
    module: "sales",
    execute: async (args) =>
      getTopSellingProducts(positiveInteger(args, "limit", 5, 50)),
  },

  getSlowMovingProducts: {
    module: "sales",
    execute: async (args) =>
      getSlowMovingProducts(positiveInteger(args, "limit", 5, 50)),
  },

  getLowStockProducts: {
    module: "inventory",
    execute: async () => getLowStockProducts(),
  },

  getOutOfStockProducts: {
    module: "inventory",
    execute: async () => getOutOfStockProducts(),
  },

  getProductStock: {
    module: "inventory",
    execute: async (args) => {
      const productId = positiveInteger(args, "productId");
      const history = await getProductHistory(productId);

      return {
        productId,
        product: history.product,
        currentStock: history.summary.currentStock,
      };
    },
  },

  getProductHistory: {
    module: "inventory",
    execute: async (args) =>
      getProductHistory(positiveInteger(args, "productId")),
  },

  getInventoryValue: {
    module: "inventory",
    execute: async () => getInventoryValue(),
  },

  getTopCustomers: {
    module: "customers",
    execute: async (args) =>
      getTopCustomers(positiveInteger(args, "limit", 5, 50)),
  },

  getCustomerHistory: {
    module: "customers",
    execute: async (args) =>
      getCustomerHistory(positiveInteger(args, "customerId")),
  },

  getExpenses: {
    module: "expenses",
    execute: async (args) => {
      const { start, end } = optionalDateRange(args);
      return start && end ? getExpenses(start, end) : getExpenses();
    },
  },

  getPurchases: {
    module: "purchases",
    execute: async (args) => {
      const { start, end } = optionalDateRange(args);
      return start && end ? getPurchases(start, end) : getPurchases();
    },
  },
};

export function isAiToolName(value: string): value is AiToolName {
  return Object.prototype.hasOwnProperty.call(TOOL_REGISTRY, value);
}

export async function runVerifiedAiTool(name: AiToolName, args: AiToolArgs = {}) {
  const session = await currentSession();

  if (!session) {
    throw new AiToolAuthError("Authentication required.", 401);
  }

  const definition = TOOL_REGISTRY[name];

  const allowed = hasPermission(
    session.permissions ?? [],
    definition.module,
    "view",
    session.role ?? ""
  );

  if (!allowed) {
    throw new AiToolAuthError(
      `You do not have permission to view ${definition.module} data.`,
      403
    );
  }

  const data = await definition.execute(args);

  return {
    tool: name,
    data,
    permission: {
      module: definition.module,
      action: "view" as const,
    },
    actor: {
      userId: session.id,
      role: session.role,
      branchId: session.branchId,
    },
  };
}
