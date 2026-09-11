import { hasPermission } from "@/src/lib/auth/access";
import { getBusinessIntelligence } from "@/src/lib/business-intelligence";

export const PHASE7_TOOL_NAMES = [
  "getBusinessIntelligenceSummary",
  "getSalesIntelligence",
  "getCustomerIntelligence",
  "getCreditIntelligence",
  "getExpenseIntelligence",
  "getProfitabilityIntelligence",
  "getBusinessAlerts",
] as const;

export type Phase7ToolName = (typeof PHASE7_TOOL_NAMES)[number];

export class Phase7AuthError extends Error {}
export class Phase7ValidationError extends Error {}

export async function runPhase7Tool(
  session: { role: string; permissions: string[] },
  tool: Phase7ToolName,
  args: Record<string, unknown> = {}
) {
  const moduleByTool: Record<Phase7ToolName, string> = {
    getBusinessIntelligenceSummary: "reports",
    getSalesIntelligence: "sales",
    getCustomerIntelligence: "customers",
    getCreditIntelligence: "customers",
    getExpenseIntelligence: "expenses",
    getProfitabilityIntelligence: "reports",
    getBusinessAlerts: "reports",
  };

  const module = moduleByTool[tool];
  if (!hasPermission(session.permissions, module, "view", session.role)) {
    throw new Phase7AuthError(`Missing ${module}.view permission.`);
  }

  const start = typeof args.start === "string" ? args.start : undefined;
  const end = typeof args.end === "string" ? args.end : undefined;
  const summary = await getBusinessIntelligence({ start, end });

  switch (tool) {
    case "getBusinessIntelligenceSummary":
      return summary;
    case "getSalesIntelligence":
      return { period: summary.period, sales: summary.sales, returns: summary.returns };
    case "getCustomerIntelligence":
      return { period: summary.period, customers: summary.customers };
    case "getCreditIntelligence":
      return { period: summary.period, credit: summary.credit };
    case "getExpenseIntelligence":
      return { period: summary.period, expenses: summary.expenses };
    case "getProfitabilityIntelligence":
      return { period: summary.period, profitability: summary.profitability, returns: summary.returns };
    case "getBusinessAlerts":
      return { period: summary.period, alerts: summary.alerts };
    default:
      throw new Phase7ValidationError("Unsupported Phase 7 tool.");
  }
}
