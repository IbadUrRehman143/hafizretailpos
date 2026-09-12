import "server-only";
import { db } from "@/src/prisma/db";
import { getPurchaseRecommendations } from "@/src/lib/inventory-intelligence";
import type { ActorScope, ProposedAction } from "./types";

function parsePayload(value: unknown): Record<string, unknown> {
  try { return JSON.parse(String(value || "{}")) as Record<string, unknown>; } catch { return {}; }
}
function toAction(row: any): ProposedAction {
  return {
    id: Number(row.id), workflow: row.workflow, kind: row.kind, title: row.title,
    payload: parsePayload(row.payloadJson), reason: row.reason, status: row.status,
    createdAt: String(row.createdAt), decidedAt: row.decidedAt ?? null, executedAt: row.executedAt ?? null,
  };
}

export async function buildPurchasePlan(targetStockDays: number, actor: ActorScope, supplierId?: number) {
  const days = Math.max(7, Math.min(Number(targetStockDays) || 30, 90));
  const recommendations = await getPurchaseRecommendations(days);
  const productIds = recommendations.products.map((p) => p.productId);
  const allProducts = await db.orm.public.Product.all();
  const products = new Map(allProducts.filter((p) => productIds.includes(Number(p.id))).map((p) => [Number(p.id), p]));
  const planProducts = recommendations.products.map((item) => {
    const product = products.get(item.productId);
    const productType = String(product?.type || "quantity");
    const purchasePrice = Math.max(0, Number(product?.purchasePrice || 0));
    return {
      ...item,
      productType,
      purchasePrice,
      estimatedCost: Number((item.suggestedQuantity * purchasePrice).toFixed(2)),
      weightEntries: productType.toLowerCase() === "weight" ? String(item.suggestedQuantity) : "",
    };
  });
  const row = await db.orm.public.AiAction.create({
    workflow: "PURCHASE_PLAN", kind: "PURCHASE_DRAFT", title: "Verified Inventory Purchase Plan",
    reason: planProducts.length ? `${planProducts.length} product(s) require replenishment from verified inventory intelligence.` : "No products currently require replenishment.",
    payloadJson: JSON.stringify({ targetStockDays: days, supplierId: Number(supplierId || 0), products: planProducts }),
    status: "PENDING", branchId: actor.branchId, createdById: actor.id, createdByName: actor.name,
  });
  await db.orm.public.AuditLog.create({ module: "AI Agent", action: "Propose", description: `Purchase plan #${row.id} created for human approval.`, status: "Success", ipAddress: "", userId: actor.id, userName: actor.name, userRole: actor.role });
  return toAction(row);
}

export async function proposeFollowUp(input: { title: string; reason: string; payload?: Record<string, unknown> }, actor: ActorScope) {
  if (!input.title.trim() || !input.reason.trim()) throw new Error("Title and reason are required.");
  const row = await db.orm.public.AiAction.create({ workflow: "FOLLOW_UP", kind: "FOLLOW_UP", title: input.title.trim(), reason: input.reason.trim(), payloadJson: JSON.stringify(input.payload || {}), status: "PENDING", branchId: actor.branchId, createdById: actor.id, createdByName: actor.name });
  return toAction(row);
}

export async function listActions(actor: ActorScope) {
  const all = await db.orm.public.AiAction.all();
  return all.filter((row) => actor.branchId === null || row.branchId === actor.branchId).map(toAction).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
}

export async function decideAction(actionId: number, decision: "APPROVE" | "REJECT", actor: ActorScope) {
  const row = await db.orm.public.AiAction.where({ id: actionId }).first();
  if (!row || (actor.branchId !== null && row.branchId !== actor.branchId)) throw new Error("Action not found.");
  if (row.status !== "PENDING") throw new Error("Only pending actions can be decided.");
  const updated = await db.orm.public.AiAction.where({ id: actionId }).update({ status: decision === "APPROVE" ? "APPROVED" : "REJECTED", decidedAt: new Date().toISOString(), decidedById: actor.id, decidedByName: actor.name });
  await db.orm.public.AuditLog.create({ module: "AI Approval", action: decision, description: `AI action #${actionId} ${decision.toLowerCase()}d.`, status: "Success", ipAddress: "", userId: actor.id, userName: actor.name, userRole: actor.role });
  return toAction(updated);
}

function weights(value: unknown) {
  return String(value || "").split("+").map((v) => Number(v.trim())).filter((v) => Number.isFinite(v) && v > 0);
}

export async function executeApprovedAction(actionId: number, actor: ActorScope) {
  return db.transaction(async (tx) => {
    const row = await tx.orm.public.AiAction.where({ id: actionId }).first();
    if (!row || (actor.branchId !== null && row.branchId !== actor.branchId)) throw new Error("Action not found.");
    if (row.status !== "APPROVED") throw new Error("Human approval is required before execution.");
    if (row.kind !== "PURCHASE_DRAFT") throw new Error("This action has no controlled executor.");

    const payload = parsePayload(row.payloadJson);
    const supplierId = Number(payload.supplierId || 0);
    if (!Number.isInteger(supplierId) || supplierId <= 0) throw new Error("Supplier ID is required before a purchase plan can be executed.");
    const supplier = await tx.orm.public.Supplier.where({ id: supplierId }).first();
    if (!supplier || String(supplier.status || "Active").toLowerCase() !== "active") throw new Error("Selected supplier is unavailable.");
    const items = Array.isArray(payload.products) ? payload.products as Array<Record<string, unknown>> : [];
    if (!items.length) throw new Error("There are no purchase items to execute.");

    const prepared: Array<{ product: any; productId:number; productName:string; productType:string; unit:string; quantity:number; purchasePrice:number; amount:number; weightEntries:string }> = [];
    let subtotal = 0;
    for (const item of items) {
      const productId = Number(item.productId); const quantity = Number(item.suggestedQuantity); const purchasePrice = Number(item.purchasePrice);
      if (!Number.isInteger(productId) || productId <= 0 || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(purchasePrice) || purchasePrice <= 0) throw new Error("Purchase plan contains an invalid product, quantity, or purchase price.");
      const product = await tx.orm.public.Product.where({ id: productId }).first();
      if (!product || String(product.status || "Active").toLowerCase() === "archived") throw new Error(`Product ${productId} is unavailable.`);
      const productType = String(product.type || "quantity").toLowerCase();
      if (productType !== "weight" && !Number.isInteger(quantity)) throw new Error(`${product.name}: PCS reorder quantity must be a whole number.`);
      const weightEntries = productType === "weight" ? String(item.weightEntries || quantity) : "";
      if (productType === "weight") {
        const sum = weights(weightEntries).reduce((a,b) => a+b, 0);
        if (Math.abs(sum - quantity) > 0.01) throw new Error(`${product.name}: approved KG entries must equal reorder quantity.`);
      }
      const amount = quantity * purchasePrice; subtotal += amount;
      prepared.push({ product, productId, productName:String(product.name), productType:String(product.type), unit:productType === "weight" ? "KG" : String(product.unit || "PCS"), quantity, purchasePrice, amount, weightEntries });
    }

    const purchase = await tx.orm.public.Purchase.create({ purchaseNumber:`TEMP-AI-${Date.now()}-${actionId}`, supplierId:supplier.id, supplierName:supplier.name, supplierPhone:supplier.phone || "", supplierBillNo:"", purchaseDate:new Date().toISOString(), subtotal, paidAmount:0, remainingBalance:subtotal, paymentMethod:"Credit", status:"UNPAID", notes:`Created from approved AI action #${actionId}`, branchId:actor.branchId });
    const purchaseNumber = `PUR-${String(purchase.id).padStart(4,"0")}`;
    await tx.orm.public.Purchase.where({ id: purchase.id }).update({ purchaseNumber });

    for (const item of prepared) {
      await tx.orm.public.PurchaseItem.create({ purchaseId:purchase.id, productId:item.productId, productName:item.productName, productType:item.productType, unit:item.unit, quantity:item.quantity, weightEntries:item.weightEntries, purchasePrice:item.purchasePrice, amount:item.amount });
      if (item.productType.toLowerCase() === "weight") {
        const merged = [...weights(item.product.weightEntries), ...weights(item.weightEntries)];
        await tx.orm.public.Product.where({ id:item.productId }).update({ weightEntries: merged.join("+"), purchasePrice:item.purchasePrice });
      } else {
        await tx.orm.public.Product.where({ id:item.productId }).update({ quantity:Number(item.product.quantity || 0)+item.quantity, purchasePrice:item.purchasePrice });
      }
      await tx.orm.public.InventoryTransaction.create({ productId:item.productId, type:"PURCHASE", quantity:item.quantity, unit:item.unit, referenceType:"PURCHASE", referenceId:purchase.id, branchId:actor.branchId, note:`Approved AI purchase ${purchaseNumber}` });
    }

    const updated = await tx.orm.public.AiAction.where({ id:actionId }).update({ status:"EXECUTED", executedAt:new Date().toISOString(), failureReason:"" });
    await tx.orm.public.AuditLog.create({ module:"AI Approval", action:"Execute", description:`AI action #${actionId} executed as ${purchaseNumber}.`, status:"Success", ipAddress:"", userId:actor.id, userName:actor.name, userRole:actor.role });
    return { action: toAction(updated), purchase: { id:purchase.id, purchaseNumber, subtotal } };
  });
}
