export async function applyCompletedReturnAccounting(
  tx: any,
  input: {
    returnId: number;
    invoiceId: number;
    returnNo: string;
    totalAmount: number;
    refundAmount: number;
    refundMethod: string;
    actor?: { id: number; name: string; role: string; branchId: number | null } | null;
  }
) {
  const invoice = await tx.orm.public.Invoice.where({ id: input.invoiceId }).first();
  if (!invoice) throw new Error("Original invoice not found.");

  const existingRefunds = await tx.orm.public.Payment.where({
    invoiceId: input.invoiceId,
    referenceType: "RETURN",
    referenceId: input.returnId,
    kind: "REFUND",
  }).all();
  if (existingRefunds.length > 0) return invoice;

  const oldTotal = Math.max(0, Number(invoice.total || 0));
  const oldPaid = Math.max(0, Number(invoice.paidAmount || 0));
  const returnValue = Math.max(0, Number(input.totalAmount || 0));
  const refund = Math.max(0, Number(input.refundAmount || 0));

  if (refund > returnValue + 0.01) throw new Error("Refund cannot exceed return value.");
  if (refund > oldPaid + 0.01) throw new Error("Refund cannot exceed amount already paid by the customer.");

  const newTotal = Math.max(0, oldTotal - returnValue);
  const newPaid = Math.max(0, oldPaid - refund);
  const newRemaining = Math.max(0, newTotal - newPaid);
  const newStatus = newRemaining <= 0.01 ? "PAID" : newPaid <= 0.01 ? "UNPAID" : "PARTIAL";

  await tx.orm.public.Invoice.where({ id: input.invoiceId }).update({
    total: newTotal,
    paidAmount: newPaid,
    remainingBalance: newRemaining,
    status: newStatus,
  });

  if (refund > 0) {
    await tx.orm.public.Payment.create({
      invoiceId: input.invoiceId,
      method: input.refundMethod,
      amount: -refund,
      kind: "REFUND",
      referenceType: "RETURN",
      referenceId: input.returnId,
      branchId: input.actor?.branchId ?? null,
    });
  }

  if (input.actor) {
    await tx.orm.public.AuditLog.create({
      module: "Return",
      action: "Complete",
      description: `${input.returnNo}: invoice financials adjusted by ${returnValue}; refund ${refund}.`,
      status: "Success",
      ipAddress: "",
      userId: input.actor.id,
      userName: input.actor.name,
      userRole: input.actor.role,
    });
  }

  return { newTotal, newPaid, newRemaining, newStatus };
}
