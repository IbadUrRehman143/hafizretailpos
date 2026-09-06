import { NextResponse } from "next/server";
import { db } from "@/src/prisma/db";

type RawReturnItem = {
  invoiceItemId?: unknown;
  quantity?: unknown;
  weightEntries?: unknown;
};

function parseWeights(value: string) {
  return String(value || "")
    .split(/[,+\s]+/)
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
}

function cleanWeightEntries(value: string) {
  return parseWeights(value).join("+");
}

function normalizeStatus(value: unknown) {
  const status = String(value || "Pending");

  if (
    status !== "Pending" &&
    status !== "Approved" &&
    status !== "Completed" &&
    status !== "Rejected"
  ) {
    return null;
  }

  return status;
}

function normalizeRefundMethod(value: unknown) {
  const method = String(value || "Cash");

  if (
    method !== "Cash" &&
    method !== "Bank" &&
    method !== "Credit" &&
    method !== "Other"
  ) {
    return null;
  }

  return method;
}

export async function GET() {
  try {
    const rows = await db.orm.public.ReturnRecord.all();
    const items = await db.orm.public.ReturnItem.all();

    const returns = rows
      .sort((a: any, b: any) => Number(b.id) - Number(a.id))
      .map((record: any) => ({
        ...record,
        items: items.filter(
          (item: any) =>
            Number(item.returnId) === Number(record.id)
        ),
      }));

    return NextResponse.json({ returns });
  } catch (error) {
    console.error("GET RETURNS:", error);

    return NextResponse.json(
      { error: "Failed to load returns." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const invoiceId = Number(body.invoiceId);
    const requestedItems: RawReturnItem[] =
      Array.isArray(body.items) ? body.items : [];

    const refundAmount = Number(body.refundAmount || 0);
    const status = normalizeStatus(body.status);
    const refundMethod = normalizeRefundMethod(
      body.refundMethod
    );

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Valid invoice is required." },
        { status: 400 }
      );
    }

    if (requestedItems.length === 0) {
      return NextResponse.json(
        { error: "At least one return item is required." },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: "Invalid return status." },
        { status: 400 }
      );
    }

    if (!refundMethod) {
      return NextResponse.json(
        { error: "Invalid refund method." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(refundAmount) ||
      refundAmount < 0
    ) {
      return NextResponse.json(
        { error: "Invalid refund amount." },
        { status: 400 }
      );
    }

    const invoice =
      await db.orm.public.Invoice
        .where({ id: invoiceId })
        .first();

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found." },
        { status: 404 }
      );
    }

    const allReturnRecords =
      await db.orm.public.ReturnRecord.all();

    const completedReturnIds = new Set(
      allReturnRecords
        .filter(
          (record: any) =>
            String(record.status) === "Completed"
        )
        .map((record: any) => Number(record.id))
    );

    const allReturnItems =
      await db.orm.public.ReturnItem.all();

    const seenInvoiceItems = new Set<number>();

    const validatedItems: {
      invoiceItemId: number;
      productId: number;
      productName: string;
      productType: string;
      quantity: number;
      unit: string;
      rate: number;
      total: number;
      weightEntries: string;
      product: any;
    }[] = [];

    let totalAmount = 0;

    for (const rawItem of requestedItems) {
      const invoiceItemId = Number(
        rawItem.invoiceItemId
      );
      const quantity = Number(rawItem.quantity);

      if (
        !invoiceItemId ||
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "Every return item requires a valid invoice item and quantity.",
          },
          { status: 400 }
        );
      }

      if (seenInvoiceItems.has(invoiceItemId)) {
        return NextResponse.json(
          {
            error:
              "Same invoice product cannot be added twice in one return.",
          },
          { status: 400 }
        );
      }

      seenInvoiceItems.add(invoiceItemId);

      const soldItem =
        await db.orm.public.InvoiceItem
          .where({ id: invoiceItemId })
          .first();

      if (
        !soldItem ||
        Number(soldItem.invoiceId) !== invoiceId
      ) {
        return NextResponse.json(
          {
            error:
              "One or more selected products do not belong to this invoice.",
          },
          { status: 400 }
        );
      }

      const product =
        await db.orm.public.Product
          .where({
            id: Number(soldItem.productId),
          })
          .first();

      if (!product) {
        return NextResponse.json(
          {
            error: `Product ${soldItem.productName} not found.`,
          },
          { status: 404 }
        );
      }

      const previouslyReturned =
        allReturnItems
          .filter(
            (item: any) =>
              Number(item.invoiceItemId) ===
                invoiceItemId &&
              completedReturnIds.has(
                Number(item.returnId)
              )
          )
          .reduce(
            (sum: number, item: any) =>
              sum + Number(item.quantity || 0),
            0
          );

      const remaining = Math.max(
        0,
        Number(soldItem.quantity || 0) -
          previouslyReturned
      );

      if (quantity > remaining + 0.001) {
        return NextResponse.json(
          {
            error: `${soldItem.productName}: Maximum remaining return quantity is ${remaining} ${soldItem.unit}.`,
          },
          { status: 400 }
        );
      }

      if (
        String(product.type) !== "weight" &&
        !Number.isInteger(quantity)
      ) {
        return NextResponse.json(
          {
            error: `${soldItem.productName}: Quantity based product return must be whole PCS.`,
          },
          { status: 400 }
        );
      }

      let weightEntries = "";

      if (String(product.type) === "weight") {
        weightEntries = cleanWeightEntries(
          String(rawItem.weightEntries || "")
        );

        if (status === "Completed") {
          const entries = parseWeights(weightEntries);

          if (entries.length === 0) {
            return NextResponse.json(
              {
                error: `${soldItem.productName}: Actual returned weight entries are required for completed return.`,
              },
              { status: 400 }
            );
          }

          const weightTotal = entries.reduce(
            (sum, weight) => sum + weight,
            0
          );

          if (
            Math.abs(weightTotal - quantity) > 0.01
          ) {
            return NextResponse.json(
              {
                error: `${soldItem.productName}: Returned weight entries total must equal ${quantity} KG.`,
              },
              { status: 400 }
            );
          }
        }
      }

      const rate = Number(soldItem.rate || 0);
      const itemTotal = quantity * rate;

      totalAmount += itemTotal;

      validatedItems.push({
        invoiceItemId,
        productId: Number(soldItem.productId),
        productName: String(soldItem.productName),
        productType: String(product.type),
        quantity,
        unit:
          String(product.type) === "weight"
            ? "KG"
            : String(
                soldItem.unit ||
                  product.unit ||
                  "PCS"
              ),
        rate,
        total: itemTotal,
        weightEntries,
        product,
      });
    }

    if (refundAmount > totalAmount + 0.01) {
      return NextResponse.json(
        {
          error:
            "Refund amount cannot exceed total return value.",
        },
        { status: 400 }
      );
    }

    const created = await db.transaction(
      async (tx) => {
        const returnRecord =
          await tx.orm.public.ReturnRecord.create({
            returnNo: "PENDING",
            invoiceId,
            invoiceNo: String(
              invoice.invoiceNumber
            ),
            date: new Date().toISOString(),
            customerName: String(
              invoice.customerName || ""
            ),
            customerPhone: String(
              invoice.customerPhone || ""
            ),
            totalAmount,
            refundAmount,
            refundMethod,
            reason: String(body.reason || ""),
            status,
            notes: String(body.notes || ""),
          });

        const returnNo = `RET-${String(
          returnRecord.id
        ).padStart(4, "0")}`;

        await tx.orm.public.ReturnRecord
          .where({ id: returnRecord.id })
          .update({ returnNo });

        for (const item of validatedItems) {
          await tx.orm.public.ReturnItem.create({
            returnId: returnRecord.id,
            invoiceItemId: item.invoiceItemId,
            productId: item.productId,
            productName: item.productName,
            productType: item.productType,
            quantity: item.quantity,
            unit: item.unit,
            price: item.rate,
            total: item.total,
            weightEntries: item.weightEntries,
          });

          if (status === "Completed") {
            if (item.productType === "weight") {
              const oldEntries = String(
                item.product.weightEntries || ""
              ).trim();

              const newEntries = [
                oldEntries,
                item.weightEntries,
              ]
                .filter(Boolean)
                .join("+");

              await tx.orm.public.Product
                .where({ id: item.productId })
                .update({
                  weightEntries: newEntries,
                });
            } else {
              await tx.orm.public.Product
                .where({ id: item.productId })
                .update({
                  quantity:
                    Number(
                      item.product.quantity || 0
                    ) + item.quantity,
                });
            }

            await tx.orm.public.InventoryTransaction.create(
              {
                productId: item.productId,
                type: "RETURN",
                quantity: item.quantity,
                unit: item.unit,
                referenceType: "RETURN",
                referenceId: returnRecord.id,
                note: `${returnNo} from ${invoice.invoiceNumber}`,
              }
            );
          }
        }

        return {
          ...returnRecord,
          returnNo,
        };
      }
    );

    return NextResponse.json(
      {
        message:
          status === "Completed"
            ? "Return completed and stock restored successfully."
            : "Return saved successfully.",
        return: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST RETURN:", error);

    return NextResponse.json(
      { error: "Failed to save return." },
      { status: 500 }
    );
  }
}
