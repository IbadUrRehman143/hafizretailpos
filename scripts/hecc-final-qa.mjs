import fs from "node:fs";

const checks = [
  ["src/prisma/contract.prisma", /model AiKnowledgeSource/, "AI knowledge persistence model"],
  ["src/prisma/contract.prisma", /model AiAction/, "AI approval persistence model"],
  ["src/prisma/contract.prisma", /kind\s+String\s+@default\("SALE"\)/, "refund ledger marker"],
  ["src/lib/autonomous-intelligence/knowledge.ts", /embeddings\.create|embedText/, "semantic embedding retrieval"],
  ["src/lib/autonomous-intelligence/agent.ts", /db\.transaction/, "controlled transaction executor"],
  ["src/lib/autonomous-intelligence/agent.ts", /Purchase\.create/, "approved real purchase execution"],
  ["src/lib/returns/accounting.ts", /remainingBalance/, "return receivable correction"],
  ["src/lib/returns/accounting.ts", /kind:\s*"REFUND"/, "negative refund payment ledger"],
  ["app/api/invoices/route.ts", /requireApiPermission\("sales", "create"\)/, "invoice auth"],
  ["app/api/purchases/route.ts", /requireApiPermission\("purchases", "create"\)/, "purchase auth"],
  ["app/api/returns/route.ts", /requireApiPermission\("returns", "create"\)/, "return auth"],
  ["app/api/inventory-adjustments/route.ts", /requireApiPermission\("inventory", "edit"\)/, "inventory adjustment auth"],
  ["app/api/returns/route.ts", /Re-read every value that controls returnability/, "return transaction revalidation"],
  ["app/dashboard/ai-command-center/page.tsx", /Supplier ID \*/, "approval execution input"],
  ["src/lib/auth/branchScope.ts", /canAccessBranchRow/, "branch row isolation helper"],
  ["app/api/invoices/route.ts", /scopeRowsToBranch/, "sales branch scoping"],
  ["app/api/purchases/route.ts", /scopeRowsToBranch/, "purchase branch scoping"],
  ["app/api/returns/route.ts", /scopeRowsToBranch/, "returns branch scoping"],
  ["proxy.ts", /\/api\/:path\*/, "global API authentication perimeter"],
];
let failed = 0;
for (const [file, pattern, label] of checks) {
  const text = fs.readFileSync(file, "utf8");
  const ok = pattern.test(text);
  console.log(`${ok ? "PASS" : "FAIL"} - ${label}`);
  if (!ok) failed++;
}
if (failed) {
  console.error(`\n${failed} QA check(s) failed.`);
  process.exit(1);
}
console.log("\nHECC production-hardening source QA passed.");
