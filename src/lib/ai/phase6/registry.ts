import "server-only";

import { currentSession } from "@/src/lib/auth/currentUser";
import { hasPermission } from "@/src/lib/auth/access";
import {
  getInventoryIntelligence,
  getProductSalesVelocity,
  getStockCoverage,
  getStockRiskProducts,
  getReorderSuggestions,
  getPurchaseRecommendations,
} from "@/src/lib/inventory-intelligence";

export const PHASE6_TOOL_NAMES = [
  "getProductSalesVelocity",
  "getStockCoverage",
  "getStockRiskProducts",
  "getReorderSuggestions",
  "getPurchaseRecommendations",
  "getInventoryIntelligenceSummary",
] as const;

export type Phase6ToolName = (typeof PHASE6_TOOL_NAMES)[number];

export function isPhase6ToolName(value: string): value is Phase6ToolName {
  return (PHASE6_TOOL_NAMES as readonly string[]).includes(value);
}

function positiveInt(value: unknown, label: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${label} must be a positive integer.`);
  return parsed;
}

function targetDays(value: unknown) {
  if (value === undefined || value === null || value === "") return 30;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 7 || parsed > 90) {
    throw new Error("targetStockDays must be an integer from 7 to 90.");
  }
  return parsed;
}

export async function runPhase6Tool(name: Phase6ToolName, args: Record<string, unknown> = {}) {
  const session = await currentSession();
  if (!session) throw new Error("Authentication required.");

  if (!hasPermission(session.permissions, "inventory", "view", session.role)) {
    throw new Error("You do not have permission to view inventory intelligence.");
  }

  switch (name) {
    case "getProductSalesVelocity":
      return getProductSalesVelocity(positiveInt(args.productId, "productId"));
    case "getStockCoverage":
      return getStockCoverage(positiveInt(args.productId, "productId"));
    case "getStockRiskProducts":
      return getStockRiskProducts();
    case "getReorderSuggestions":
      return getReorderSuggestions(targetDays(args.targetStockDays));
    case "getPurchaseRecommendations":
      return getPurchaseRecommendations(targetDays(args.targetStockDays));
    case "getInventoryIntelligenceSummary":
      return getInventoryIntelligence(targetDays(args.targetStockDays));
  }
}
