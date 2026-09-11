export type KnowledgeSourceType = "POLICY" | "SUPPLIER" | "PRODUCT" | "NOTE";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXECUTED" | "FAILED";
export type AgentWorkflow = "PURCHASE_PLAN" | "FOLLOW_UP";

export type ActorScope = {
  id: number;
  name: string;
  role: string;
  branchId: number | null;
};

export interface KnowledgeMatch {
  sourceId: number;
  title: string;
  sourceType: KnowledgeSourceType;
  excerpt: string;
  score: number;
  retrievalMode: "semantic" | "lexical-fallback";
}

export interface ProposedAction {
  id: number;
  workflow: AgentWorkflow;
  kind: "PURCHASE_DRAFT" | "FOLLOW_UP";
  title: string;
  payload: Record<string, unknown>;
  reason: string;
  status: ApprovalStatus;
  createdAt: string;
  decidedAt?: string | null;
  executedAt?: string | null;
}
