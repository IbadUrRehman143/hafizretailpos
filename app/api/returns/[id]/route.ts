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

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id: idValue } = await params;
    const id = Number(idValue);

    if (!id) {
      return NextResponse.json(
        { error: "Invalid return ID." },
        { status: 400 }
      );
    }

    const oldRecord =
      await db.orm.public.ReturnRecord
        .where({ id })
        .first();

    if (!oldRecord) {
      return NextResponse.json(
        { error: "Return not found." },
        { status: 404 }
      );
    }

    if (
      String(oldRecord.status) === "Completed"
    ) {
      return NextResponse.json(
        {
          error:
            "Completed return cannot be edited directly because stock has already been restored.",
        },
        { status: 409 }
      );
    }

    const body = await req.json();

    const nextStatus = normalizeStatus(
      body.status || oldRecord.status
    );

    const refundMethod = normalizeRefundMethod(
      body.refundMethod || oldRecord.refundMethod
    );

    if (!nextStatus) {
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

    const requestedItems: RawReturnItem[] =
      Array.isArray(body.items) ? body.items : [];

    if (requestedItems.length === 0) {
      return NextResponse.json(
        {
          error:
            "At least one return item is required.",
        },
        { status: 400 }
      );
    }

    const invoice =
      await db.orm.public.Invoice
        .where({
          id: Number(oldRecord.invoiceId),
        })
        .first();

    if (!invoice) {
      return NextResponse.json(
        {
          error:
            "Original invoice not found.",
        },
        { status: 404 }
      );
    }

    const allReturnRecords =
      await db.orm.public.ReturnRecord.all();

    const completedIds = new Set(
      allReturnRecords
        .filter(
          (record: any) =>
            String(record.status) ===
              "Completed" &&
            Number(record.id) !== id
        )
        .map((record: any) => Number(record.id))
    );

    const allReturnItems =
      await db.orm.public.ReturnItem.all();

    const seen = new Set<number>();

    const validatedItems: {
      invoiceItemId: number;
      productId: number;
      productName: string;
      productType: string;
      quantity: number;
      unit: string;
      price: number;
      total: number;
      weightEntries: string;
      product: any;
    }[] = [];

    let totalAmount = 0;

    for (const rawItem of requestedItems) {
      const invoiceItemId = Number(
        rawItem.invoiceItemId
      );

      const quantity = Number(
        rawItem.quantity
      );

      if (
        !invoiceItemId ||
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid return item quantity.",
          },
          { status: 400 }
        );
      }

      if (seen.has(invoiceItemId)) {
        return NextResponse.json(
          {
            error:
              "Same product cannot appear twice.",
          },
          { status: 400 }
        );
      }

      seen.add(invoiceItemId);

      const soldItem =
        await db.orm.public.InvoiceItem
          .where({ id: invoiceItemId })
          .first();

      if (
        !soldItem ||
        Number(soldItem.invoiceId) !==
          Number(oldRecord.invoiceId)
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid invoice product.",
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
            error: `${soldItem.productName} product not found.`,
          },
          { status: 404 }
        );
      }

      const alreadyReturned =
        allReturnItems
          .filter(
            (returnItem: any) =>
              Number(
                returnItem.invoiceItemId
              ) === invoiceItemId &&
              completedIds.has(
                Number(returnItem.returnId)
              )
          )
          .reduce(
            (
              sum: number,
              returnItem: any
            ) =>
              sum +
              Number(
                returnItem.quantity || 0
              ),
            0
          );

      const available = Math.max(
        0,
        Number(soldItem.quantity || 0) -
          alreadyReturned
      );

      if (quantity > available + 0.001) {
        return NextResponse.json(
          {
            error: `${soldItem.productName}: Maximum returnable quantity is ${available} ${soldItem.unit}.`,
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
            error: `${soldItem.productName}: Quantity return must be whole PCS.`,
          },
          { status: 400 }
        );
      }

      let weightEntries = "";

      if (String(product.type) === "weight") {
        weightEntries = cleanWeightEntries(
          String(rawItem.weightEntries || "")
        );

        if (nextStatus === "Completed") {
          const weights =
            parseWeights(weightEntries);

          if (weights.length === 0) {
            return NextResponse.json(
              {
                error: `${soldItem.productName}: Enter actual returned weights before completing the return.`,
              },
              { status: 400 }
            );
          }

          const weightTotal =
            weights.reduce(
              (sum, weight) =>
                sum + weight,
              0
            );

          if (
            Math.abs(
              weightTotal - quantity
            ) > 0.01
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

      const price = Number(
        soldItem.rate || 0
      );

      const total =
        quantity * price;

      totalAmount += total;

      validatedItems.push({
        invoiceItemId,
        productId: Number(
          soldItem.productId
        ),
        productName: String(
          soldItem.productName
        ),
        productType: String(
          product.type
        ),
        quantity,
        unit:
          String(product.type) ===
          "weight"
            ? "KG"
            : String(
                soldItem.unit ||
                  product.unit ||
                  "PCS"
              ),
        price,
        total,
        weightEntries,
        product,
      });
    }

    const refundAmount = Number(
      body.refundAmount || 0
    );

    if (
      !Number.isFinite(refundAmount) ||
      refundAmount < 0
    ) {
      return NextResponse.json(
        { error: "Invalid refund amount." },
        { status: 400 }
      );
    }

    if (
      refundAmount >
      totalAmount + 0.01
    ) {
      return NextResponse.json(
        {
          error:
            "Refund cannot exceed return total.",
        },
        { status: 400 }
      );
    }

    const shouldApplyStock =
      String(oldRecord.status) !==
        "Completed" &&
      nextStatus === "Completed";

    await db.transaction(
      async (tx) => {
        await tx.orm.public.ReturnRecord
          .where({ id })
          .update({
            totalAmount,
            refundAmount,
            refundMethod,
            reason: String(
              body.reason || ""
            ),
            status: nextStatus,
            notes: String(
              body.notes || ""
            ),
          });

        const oldItems =
          await tx.orm.public.ReturnItem
            .where({
              returnId: id,
            })
            .all();

        for (const oldItem of oldItems) {
          await tx.orm.public.ReturnItem
            .where({
              id: oldItem.id,
            })
            .delete();
        }

        for (const item of validatedItems) {
          await tx.orm.public.ReturnItem.create(
            {
              returnId: id,
              invoiceItemId:
                item.invoiceItemId,
              productId:
                item.productId,
              productName:
                item.productName,
              productType:
                item.productType,
              quantity:
                item.quantity,
              unit: item.unit,
              price: item.price,
              total: item.total,
              weightEntries:
                item.weightEntries,
            }
          );

          if (shouldApplyStock) {
            if (
              item.productType ===
              "weight"
            ) {
              const oldEntries =
                String(
                  item.product
                    .weightEntries ||
                    ""
                ).trim();

              const newEntries = [
                oldEntries,
                item.weightEntries,
              ]
                .filter(Boolean)
                .join("+");

              await tx.orm.public.Product
                .where({
                  id: item.productId,
                })
                .update({
                  weightEntries:
                    newEntries,
                });
            } else {
              await tx.orm.public.Product
                .where({
                  id: item.productId,
                })
                .update({
                  quantity:
                    Number(
                      item.product
                        .quantity || 0
                    ) +
                    item.quantity,
                });
            }

            await tx.orm.public.InventoryTransaction.create(
              {
                productId:
                  item.productId,
                type: "RETURN",
                quantity:
                  item.quantity,
                unit: item.unit,
                referenceType:
                  "RETURN",
                referenceId: id,
                note: `${oldRecord.returnNo} completed from ${invoice.invoiceNumber}`,
              }
            );
          }
        }
      }
    );

    return NextResponse.json({
      success: true,
      message:
        shouldApplyStock
          ? "Return completed and stock restored successfully."
          : "Return updated successfully.",
    });
  } catch (error) {
    console.error("PATCH RETURN:", error);

    return NextResponse.json(
      {
        error:
          "Failed to update return.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id: idValue } = await params;
    const id = Number(idValue);

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Invalid return ID.",
        },
        { status: 400 }
      );
    }

    const oldRecord =
      await db.orm.public.ReturnRecord
        .where({ id })
        .first();

    if (!oldRecord) {
      return NextResponse.json(
        { error: "Return not found." },
        { status: 404 }
      );
    }

    if (
      String(oldRecord.status) ===
      "Completed"
    ) {
      return NextResponse.json(
        {
          error:
            "Completed return cannot be deleted because returned stock is already in inventory. Use a controlled return reversal workflow instead.",
        },
        { status: 409 }
      );
    }

    await db.transaction(
      async (tx) => {
        const items =
          await tx.orm.public.ReturnItem
            .where({
              returnId: id,
            })
            .all();

        for (const item of items) {
          await tx.orm.public.ReturnItem
            .where({
              id: item.id,
            })
            .delete();
        }

        await tx.orm.public.ReturnRecord
          .where({ id })
          .delete();
      }
    );

    return NextResponse.json({
      success: true,
      message:
        "Return deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE RETURN:", error);

    return NextResponse.json(
      {
        error:
          "Failed to delete return.",
      },
      { status: 500 }
    );
  }
}
