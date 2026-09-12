# HECC POS — Production Hardening 1–6

Customer-facing names remain:
- Inventory AI Intelligence
- Business Command Center
- Autonomous Intelligence Center
  - AI Knowledge Hub
  - Autonomous Business Agent
  - AI Approval Center

## 1. Current build repair
The uploaded dashboard JSX is repaired. The installer runs a full `npm run build` after contract emission and database migration.

## 2. Autonomous Intelligence Center
Knowledge add/search, purchase-plan proposal, approval/rejection, and controlled execution are wired to persistent APIs. Supplier ID is required for executable purchase plans.

## 3. PostgreSQL persistence + audit
Adds `AiKnowledgeSource`, `AiKnowledgeChunk`, and `AiAction` models. AI knowledge and approval actions are no longer process-memory Maps. Important AI create/approve/execute events write `AuditLog` rows.

## 4. Semantic RAG
Uses OpenAI embeddings (`text-embedding-3-small` by default) when API billing is available. Chunks and embeddings are persisted in PostgreSQL. If embeddings cannot be produced, retrieval explicitly reports lexical fallback rather than pretending it was semantic.

## 5. Controlled real actions
Approved purchase plans execute through one database transaction: Purchase + PurchaseItem + Product stock + InventoryTransaction + AuditLog. No purchase write occurs before human approval.

## 6. Security + QA
- Global API authentication perimeter in `proxy.ts`.
- Route-level permission checks on invoices, purchases, returns, inventory adjustments, customer payments, purchase payments, and AI APIs.
- Branch IDs added to core transactional rows and strict row filtering added to sales/purchases/returns and payment parent checks.
- Return critical values are re-read inside the transaction before stock mutation.
- Completed returns now reduce invoice financials and record negative refund Payment entries.
- Static hardening QA script included.

### Branch architecture note
Sales/purchase/return rows are branch-scoped. Product stock itself is still stored on the global `Product` record in the existing schema. Therefore this package does **not** falsely claim independent per-branch warehouses. If HECC later needs separate physical stock per branch, add a `BranchInventory`/stock-location model as a dedicated architecture change.

### OpenAI credits
The semantic embedding implementation is complete, but a live semantic call cannot pass until the OpenAI API account has credits. This does not block deterministic POS, persistence, approvals, or controlled purchase execution.
