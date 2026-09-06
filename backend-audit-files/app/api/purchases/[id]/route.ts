import { NextResponse } from "next/server";
import { db } from "@/src/prisma/db";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type PurchaseItemInput = {
  productId: number;
  quantity: number;
  purchasePrice: number;
  weightEntries?: string;
};

/* ======================================================
   HELPERS
====================================================== */

function safeNumber(value: unknown) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function parseWeightEntries(value: unknown) {
  return String(value || "")
    .split("+")
    .map((item) => Number(item.trim()))
    .filter(
      (item) =>
        Number.isFinite(item) &&
        item > 0
    );
}

function normalizeStatus(
  paidAmount: number,
  totalAmount: number
) {
  if (paidAmount <= 0) {
    return "UNPAID";
  }

  if (paidAmount >= totalAmount) {
    return "PAID";
  }

  return "PARTIAL";
}

/* ======================================================
   REMOVE WEIGHT FIFO

   Example:
   Current:
   82 + 115 + 67

   Remove:
   100 KG

   Result:
   97 + 67
====================================================== */

function removeWeightFIFO(
  entries: number[],
  amountToRemove: number
) {
  let remaining =
    amountToRemove;

  const result =
    [...entries];

  while (
    remaining > 0 &&
    result.length > 0
  ) {
    const firstWeight =
      result[0];

    if (
      firstWeight <= remaining
    ) {
      remaining -=
        firstWeight;

      result.shift();
    } else {
      result[0] =
        firstWeight -
        remaining;

      remaining = 0;
    }
  }

  if (remaining > 0.000001) {
    throw new Error(
      "Current weight stock is lower than the purchase stock being reversed."
    );
  }

  return result;
}

/* ======================================================
   GET SINGLE PURCHASE
====================================================== */

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } =
      await context.params;

    const purchaseId =
      Number(id);

    if (
      !Number.isInteger(
        purchaseId
      ) ||
      purchaseId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid purchase ID.",
        },
        {
          status: 400,
        }
      );
    }

    const purchase =
      await db.orm.public.Purchase
        .where({
          id: purchaseId,
        })
        .first();

    if (!purchase) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Purchase not found.",
        },
        {
          status: 404,
        }
      );
    }

    const items =
      await db.orm.public.PurchaseItem
        .where({
          purchaseId,
        })
        .all();

    const payments =
      await db.orm.public.PurchasePayment
        .where({
          purchaseId,
        })
        .all();

    return NextResponse.json({
      success: true,

      purchase: {
        ...purchase,
        items,
        payments,
      },
    });
  } catch (error) {
    console.error(
      "GET PURCHASE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load purchase.",
      },
      {
        status: 500,
      }
    );
  }
}

/* ======================================================
   UPDATE PURCHASE
====================================================== */

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } =
      await context.params;

    const purchaseId =
      Number(id);

    if (
      !Number.isInteger(
        purchaseId
      ) ||
      purchaseId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid purchase ID.",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      await request.json();

    const supplierId =
      safeNumber(
        body.supplierId
      );

    const supplierBillNo = String(body.supplierBillNo || "").trim();

    const paymentMethod =
      String(
        body.paymentMethod ||
          "Cash"
      );

    const paidAmount =
      safeNumber(
        body.paidAmount
      );

    const notes =
      String(
        body.notes || ""
      ).trim();

    const rawItems:
      PurchaseItemInput[] =
      Array.isArray(body.items)
        ? body.items
        : [];

    /* =========================
       VALIDATION
    ========================= */

    if (supplierId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Supplier is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (rawItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "At least one purchase item is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (paidAmount < 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Paid amount cannot be negative.",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await db.transaction(
        async (tx) => {
          /* =========================
             OLD PURCHASE
          ========================= */

          const oldPurchase =
            await tx.orm.public.Purchase
              .where({
                id: purchaseId,
              })
              .first();

          if (!oldPurchase) {
            throw new Error(
              "Purchase not found."
            );
          }

          const oldItems =
            await tx.orm.public.PurchaseItem
              .where({
                purchaseId,
              })
              .all();

          /* =========================
             REVERSE OLD STOCK
          ========================= */

          for (
            const oldItem of oldItems
          ) {
            const product =
              await tx.orm.public.Product
                .where({
                  id:
                    oldItem.productId,
                })
                .first();

            if (!product) {
              throw new Error(
                `Product ${oldItem.productName} not found while reversing old stock.`
              );
            }

            const productType =
              String(
                oldItem.productType ||
                  product.type ||
                  ""
              ).toLowerCase();

            /* =========================
               WEIGHT STOCK REVERSE
            ========================= */

            if (
              productType === "weight"
            ) {
              const currentWeights =
                parseWeightEntries(
                  product.weightEntries
                );

              const currentTotal =
                currentWeights.reduce(
                  (
                    total,
                    weight
                  ) =>
                    total +
                    weight,
                  0
                );

              if (
                currentTotal +
                  0.000001 <
                oldItem.quantity
              ) {
                throw new Error(
                  `Cannot edit purchase ${oldPurchase.purchaseNumber}. Current ${product.name} stock is only ${currentTotal} KG, but ${oldItem.quantity} KG must be reversed.`
                );
              }

              const updatedWeights =
                removeWeightFIFO(
                  currentWeights,
                  oldItem.quantity
                );

              await tx.orm.public.Product
                .where({
                  id: product.id,
                })
                .update({
                  weightEntries:
                    updatedWeights.join(
                      "+"
                    ),
                });
            }

            /* =========================
               QUANTITY STOCK REVERSE
            ========================= */

            else {
              const currentQuantity =
                safeNumber(
                  product.quantity
                );

              if (
                currentQuantity +
                  0.000001 <
                oldItem.quantity
              ) {
                throw new Error(
                  `Cannot edit purchase ${oldPurchase.purchaseNumber}. Current ${product.name} stock is only ${currentQuantity} PCS, but ${oldItem.quantity} PCS must be reversed.`
                );
              }

              await tx.orm.public.Product
                .where({
                  id: product.id,
                })
                .update({
                  quantity:
                    currentQuantity -
                    oldItem.quantity,
                });
            }
          }

          /* =========================
             SUPPLIER
          ========================= */

          const supplier =
            await tx.orm.public.Supplier
              .where({
                id: supplierId,
              })
              .first();

          if (!supplier) {
            throw new Error(
              "Selected supplier not found."
            );
          }

          if (supplierBillNo) {
            const supplierPurchases = await tx.orm.public.Purchase.where({ supplierId: supplier.id }).all();
            const duplicate = supplierPurchases.find((p) => p.id !== purchaseId && String(p.supplierBillNo || "").trim().toLowerCase() === supplierBillNo.toLowerCase());
            if (duplicate) throw new Error(`Supplier bill ${supplierBillNo} is already entered as ${duplicate.purchaseNumber}. Duplicate stock was blocked.`);
          }

          /* =========================
             PREPARE NEW ITEMS
          ========================= */

          const preparedItems = [];

          let subtotal = 0;

          for (
            const rawItem of rawItems
          ) {
            const productId =
              safeNumber(
                rawItem.productId
              );

            const quantity =
              safeNumber(
                rawItem.quantity
              );

            const purchasePrice =
              safeNumber(
                rawItem.purchasePrice
              );

            if (productId <= 0) {
              throw new Error(
                "Invalid product."
              );
            }

            if (quantity <= 0) {
              throw new Error(
                "Purchase quantity must be greater than 0."
              );
            }

            if (
              purchasePrice <= 0
            ) {
              throw new Error(
                "Purchase price must be greater than 0."
              );
            }

            const product =
              await tx.orm.public.Product
                .where({
                  id: productId,
                })
                .first();

            if (!product) {
              throw new Error(
                `Product ID ${productId} not found.`
              );
            }

            const productType =
              String(
                product.type || ""
              ).toLowerCase();

            let purchasedQuantity =
              quantity;

            let weightEntries = "";

            if (
              productType === "weight"
            ) {
              const suppliedWeights =
                parseWeightEntries(
                  rawItem.weightEntries
                );

              if (
                suppliedWeights.length >
                0
              ) {
                purchasedQuantity =
                  suppliedWeights.reduce(
                    (
                      total,
                      weight
                    ) =>
                      total +
                      weight,
                    0
                  );

                weightEntries =
                  suppliedWeights.join(
                    "+"
                  );
              } else {
                weightEntries =
                  String(quantity);
              }
            }

            const amount =
              purchasedQuantity *
              purchasePrice;

            subtotal += amount;

            preparedItems.push({
              product,

              productId:
                product.id,

              productName:
                product.name,

              productType:
                product.type,

              unit:
                productType ===
                "weight"
                  ? "KG"
                  : product.unit ||
                    "PCS",

              quantity:
                purchasedQuantity,

              purchasePrice,

              amount,

              weightEntries,
            });
          }

          /* =========================
             PAYMENT
          ========================= */

          if (
            paidAmount >
            subtotal
          ) {
            throw new Error(
              "Paid amount cannot be greater than purchase total."
            );
          }

          const remainingBalance =
            Math.max(
              0,
              subtotal -
                paidAmount
            );

          const status =
            normalizeStatus(
              paidAmount,
              subtotal
            );

          /* =========================
             PURCHASE DATE
          ========================= */

          let purchaseDate =
            oldPurchase.purchaseDate;

          if (
            body.purchaseDate ||
            body.date
          ) {
            const requestedDate =
              new Date(
                body.purchaseDate ||
                  body.date
              );

            if (
              !Number.isNaN(
                requestedDate.getTime()
              )
            ) {
              purchaseDate =
                requestedDate.toISOString();
            }
          }

          /* =========================
             DELETE OLD ITEMS /
             PAYMENTS
          ========================= */

          await tx.orm.public.PurchasePayment
            .where({
              purchaseId,
            })
            .delete();

          await tx.orm.public.PurchaseItem
            .where({
              purchaseId,
            })
            .delete();

          /* =========================
             UPDATE PURCHASE
          ========================= */

          const updatedPurchase =
  await tx.orm.public.Purchase
    .where({
      id: purchaseId,
    })
    .update({
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierPhone: supplier.phone || "",
      supplierBillNo,
      purchaseDate,
      subtotal,
      paidAmount,
      remainingBalance,
      paymentMethod,
      status,
      notes,
    });

if (!updatedPurchase) {
  throw new Error(
    "Purchase update failed."
  );
}

          /* =========================
             CREATE NEW ITEMS +
             APPLY NEW STOCK
          ========================= */

          const createdItems = [];

          for (
            const item of preparedItems
          ) {
            const createdItem =
              await tx.orm.public.PurchaseItem.create(
                {
                  purchaseId,

                  productId:
                    item.productId,

                  productName:
                    item.productName,

                  productType:
                    item.productType,

                  unit:
                    item.unit,

                  quantity:
                    item.quantity,

                  weightEntries:
                    item.weightEntries,

                  purchasePrice:
                    item.purchasePrice,

                  amount:
                    item.amount,
                }
              );

            createdItems.push(
              createdItem
            );

            /*
              Product dobara load karna
              important hai because old
              stock reversal already
              Product ko update kar chuka hai.
            */

            const currentProduct =
              await tx.orm.public.Product
                .where({
                  id:
                    item.productId,
                })
                .first();

            if (!currentProduct) {
              throw new Error(
                `Product ${item.productName} not found.`
              );
            }

            const productType =
              String(
                currentProduct.type ||
                  ""
              ).toLowerCase();

            /* =========================
               WEIGHT STOCK APPLY
            ========================= */

            if (
              productType === "weight"
            ) {
              const currentWeights =
                parseWeightEntries(
                  currentProduct
                    .weightEntries
                );

              const purchasedWeights =
                parseWeightEntries(
                  item.weightEntries
                );

              const updatedWeights = [
                ...currentWeights,
                ...purchasedWeights,
              ];

              await tx.orm.public.Product
                .where({
                  id:
                    item.productId,
                })
                .update({
                  weightEntries:
                    updatedWeights.join(
                      "+"
                    ),

                  purchasePrice:
                    item.purchasePrice,
                });
            }

            /* =========================
               QUANTITY STOCK APPLY
            ========================= */

            else {
              const currentQuantity =
                safeNumber(
                  currentProduct.quantity
                );

              await tx.orm.public.Product
                .where({
                  id:
                    item.productId,
                })
                .update({
                  quantity:
                    currentQuantity +
                    item.quantity,

                  purchasePrice:
                    item.purchasePrice,
                });
            }

            await tx.orm.public.InventoryTransaction.create({
              productId: item.productId,
              type: "PURCHASE",
              quantity: item.quantity,
              unit: item.unit,
              referenceType: "PURCHASE",
              referenceId: purchaseId,
              note: `Purchase ${updatedPurchase.purchaseNumber} updated`,
            });
          }

          /* =========================
             NEW PAYMENT
          ========================= */

          let payment = null;

          if (paidAmount > 0) {
            payment =
              await tx.orm.public.PurchasePayment.create(
                {
                  purchaseId,

                  method:
                    paymentMethod,

                  amount:
                    paidAmount,
                }
              );
          }

          return {
            purchase:
              updatedPurchase,

            items:
              createdItems,

            payment,
          };
        }
      );

    return NextResponse.json({
      success: true,

      message:
        "Purchase updated successfully.",

      purchase: {
        ...result.purchase,

        items:
          result.items,

        payments:
          result.payment
            ? [result.payment]
            : [],
      },
    });
  } catch (error) {
    console.error(
      "UPDATE PURCHASE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to update purchase.",
      },
      {
        status: 500,
      }
    );
  }
}

/* ======================================================
   DELETE PURCHASE
====================================================== */

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } =
      await context.params;

    const purchaseId =
      Number(id);

    if (
      !Number.isInteger(
        purchaseId
      ) ||
      purchaseId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid purchase ID.",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await db.transaction(
        async (tx) => {
          /* =========================
             PURCHASE
          ========================= */

          const purchase =
            await tx.orm.public.Purchase
              .where({
                id:
                  purchaseId,
              })
              .first();

          if (!purchase) {
            throw new Error(
              "Purchase not found."
            );
          }

          const items =
            await tx.orm.public.PurchaseItem
              .where({
                purchaseId,
              })
              .all();

          /* =========================
             REVERSE PURCHASE STOCK
          ========================= */

          for (
            const item of items
          ) {
            const product =
              await tx.orm.public.Product
                .where({
                  id:
                    item.productId,
                })
                .first();

            if (!product) {
              throw new Error(
                `Product ${item.productName} not found while reversing stock.`
              );
            }

            const productType =
              String(
                item.productType ||
                  product.type ||
                  ""
              ).toLowerCase();

            /* =========================
               WEIGHT DELETE REVERSE
            ========================= */

            if (
              productType === "weight"
            ) {
              const currentWeights =
                parseWeightEntries(
                  product.weightEntries
                );

              const currentTotal =
                currentWeights.reduce(
                  (
                    total,
                    weight
                  ) =>
                    total +
                    weight,
                  0
                );

              if (
                currentTotal +
                  0.000001 <
                item.quantity
              ) {
                throw new Error(
                  `Cannot delete ${purchase.purchaseNumber}. Current ${product.name} stock is ${currentTotal} KG, but this purchase added ${item.quantity} KG.`
                );
              }

              const updatedWeights =
                removeWeightFIFO(
                  currentWeights,
                  item.quantity
                );

              await tx.orm.public.Product
                .where({
                  id:
                    product.id,
                })
                .update({
                  weightEntries:
                    updatedWeights.join(
                      "+"
                    ),
                });
            }

            /* =========================
               PCS DELETE REVERSE
            ========================= */

            else {
              const currentQuantity =
                safeNumber(
                  product.quantity
                );

              if (
                currentQuantity +
                  0.000001 <
                item.quantity
              ) {
                throw new Error(
                  `Cannot delete ${purchase.purchaseNumber}. Current ${product.name} stock is ${currentQuantity} PCS, but this purchase added ${item.quantity} PCS.`
                );
              }

              await tx.orm.public.Product
                .where({
                  id:
                    product.id,
                })
                .update({
                  quantity:
                    currentQuantity -
                    item.quantity,
                });
            }
          }

          /* =========================
             DELETE CHILD RECORDS
          ========================= */

          await tx.orm.public.PurchasePayment
            .where({
              purchaseId,
            })
            .delete();

          await tx.orm.public.PurchaseItem
            .where({
              purchaseId,
            })
            .delete();

          /* =========================
             DELETE PURCHASE
          ========================= */

          await tx.orm.public.Purchase
            .where({
              id:
                purchaseId,
            })
            .delete();

          return purchase;
        }
      );

    return NextResponse.json({
      success: true,

      message:
        `${result.purchaseNumber} deleted successfully.`,
    });
  } catch (error) {
    console.error(
      "DELETE PURCHASE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to delete purchase.",
      },
      {
        status: 500,
      }
    );
  }
}