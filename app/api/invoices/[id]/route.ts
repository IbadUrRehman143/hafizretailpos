import {
  NextResponse,
} from "next/server";

import {
  db,
} from "@/src/prisma/db";

/* =====================================================
   TYPES
===================================================== */

type ProductType =
  | "quantity"
  | "weight"
  | "size";

type InvoiceRequestItem = {
  productId: number;

  name: string;

  type: ProductType;

  unit: string;

  quantity: number;

  weight: number;

  price: number;

  discount: number;

  total: number;
};

type InvoiceRequestBody = {
  customer: {
    name: string;

    phone: string;

    address?: string;
  };

  items: InvoiceRequestItem[];

  paymentMethod:
    | "Cash"
    | "Bank"
    | "Credit"
    | "Other";

  amountPaid: number;

  taxRate: number;

  subtotal: number;

  discount: number;

  tax: number;

  grandTotal: number;

  remaining: number;

  change: number;

  status:
    | "Paid"
    | "Partial"
    | "Unpaid";

  notes?: string;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/* =====================================================
   NUMBER
===================================================== */

function numberValue(
  value: unknown
) {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}

/* =====================================================
   WEIGHT CALCULATION
===================================================== */

function calculateWeights(
  value: string
) {
  const weights =
    String(
      value || ""
    )
      .split("+")
      .map(
        (item) =>
          Number(
            item.trim()
          )
      )
      .filter(
        (item) =>
          Number.isFinite(
            item
          ) &&
          item > 0
      );

  const totalWeight =
    weights.reduce(
      (
        total,
        weight
      ) =>
        total +
        weight,
      0
    );

  return {
    weights,

    totalWeight,
  };
}

/* =====================================================
   REDUCE WEIGHT STOCK

   Example:

   Stock:
   87+76+98

   Sale:
   100 KG

   Result:
   63+98
===================================================== */

function reduceWeightEntries(
  weightEntries: string,

  soldWeight: number
) {
  const {
    weights,
  } =
    calculateWeights(
      weightEntries
    );

  let remainingToRemove =
    Math.max(
      0,
      numberValue(
        soldWeight
      )
    );

  const updatedWeights:
    number[] = [];

  for (
    const weight of
    weights
  ) {
    if (
      remainingToRemove <=
      0
    ) {
      updatedWeights.push(
        weight
      );

      continue;
    }

    if (
      weight <=
      remainingToRemove
    ) {
      remainingToRemove -=
        weight;

      continue;
    }

    const remainingWeight =
      weight -
      remainingToRemove;

    remainingToRemove =
      0;

    if (
      remainingWeight >
      0
    ) {
      updatedWeights.push(
        Number(
          remainingWeight.toFixed(
            2
          )
        )
      );
    }
  }

  if (
    remainingToRemove >
    0.000001
  ) {
    throw new Error(
      "Not enough weight stock."
    );
  }

  return updatedWeights.join(
    "+"
  );
}

/* =====================================================
   RESTORE WEIGHT

   Important:

   Existing InvoiceItem saves sold KG,
   but does NOT save the original bundle split.

   So if 100 KG is restored, we restore
   100 as a stock entry.

   Total KG remains 100% correct.
===================================================== */

function restoreWeightEntries(
  weightEntries: string,

  restoredWeight: number
) {
  const amount =
    Math.max(
      0,
      numberValue(
        restoredWeight
      )
    );

  if (
    amount <= 0
  ) {
    return String(
      weightEntries || ""
    );
  }

  const cleanAmount =
    Number(
      amount.toFixed(
        2
      )
    );

  const existing =
    String(
      weightEntries || ""
    ).trim();

  if (
    !existing
  ) {
    return String(
      cleanAmount
    );
  }

  return `${cleanAmount}+${existing}`;
}

/* =====================================================
   ROUTE ID
===================================================== */

async function getInvoiceId(
  context: RouteContext
) {
  const params =
    await context.params;

  const id =
    Number(
      params.id
    );

  if (
    !Number.isInteger(
      id
    ) ||
    id <= 0
  ) {
    throw new Error(
      "Invalid invoice ID."
    );
  }

  return id;
}

/* =====================================================
   GET SINGLE INVOICE
===================================================== */

export async function GET(
  _request: Request,

  context: RouteContext
) {
  try {
    const invoiceId =
      await getInvoiceId(
        context
      );

    const invoice =
      await db.orm.public.Invoice
        .where({
          id:
            invoiceId,
        })
        .first();

    if (
      !invoice
    ) {
      return NextResponse.json(
        {
          message:
            "Invoice not found.",
        },
        {
          status: 404,
        }
      );
    }

    const items =
      await db.orm.public.InvoiceItem
        .where({
          invoiceId,
        })
        .all();

    const payments =
      await db.orm.public.Payment
        .where({
          invoiceId,
        })
        .all();

    const costAmount =
      items.reduce(
        (
          total,
          item
        ) =>
          total +
          numberValue(
            item.costAmount
          ),
        0
      );

    const profitAmount =
      items.reduce(
        (
          total,
          item
        ) =>
          total +
          numberValue(
            item.profitAmount
          ),
        0
      );

    const total =
      numberValue(
        invoice.total
      );

    const profitMargin =
      total > 0
        ? (
            profitAmount /
            total
          ) *
          100
        : 0;

    return NextResponse.json({
      ...invoice,

      items,

      payments,

      costAmount,

      profitAmount,

      profitMargin,
    });
  } catch (error) {
    console.error(
      "GET INVOICE ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          error instanceof
            Error
            ? error.message
            : "Unable to load invoice.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =====================================================
   UPDATE INVOICE

   FLOW:

   1. Load old invoice
   2. Restore old stock
   3. Validate new sale
   4. Delete old items/payment
   5. Update invoice
   6. Create new items
   7. Create new payment
   8. Deduct new stock
   9. Recalculate profit
===================================================== */

export async function PUT(
  request: Request,

  context: RouteContext
) {
  try {
    const invoiceId =
      await getInvoiceId(
        context
      );

    const body =
      (await request.json()) as InvoiceRequestBody;

    /* =================================================
       VALIDATION
    ================================================= */

    if (
      !Array.isArray(
        body.items
      ) ||
      body.items.length ===
        0
    ) {
      return NextResponse.json(
        {
          message:
            "Invoice must contain at least one product.",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await db.transaction(
        async (
          tx
        ) => {
          /* =============================================
             OLD INVOICE
          ============================================= */

          const oldInvoice =
            await tx.orm.public.Invoice
              .where({
                id:
                  invoiceId,
              })
              .first();

          if (
            !oldInvoice
          ) {
            throw new Error(
              "Invoice not found."
            );
          }

          /* =============================================
             OLD ITEMS
          ============================================= */

          const oldItems =
            await tx.orm.public.InvoiceItem
              .where({
                invoiceId,
              })
              .all();

          /* =============================================
             OLD PAYMENTS
          ============================================= */

          const oldPayments =
            await tx.orm.public.Payment
              .where({
                invoiceId,
              })
              .all();

          /* =============================================
             RESTORE OLD STOCK
          ============================================= */

          for (
            const item of
            oldItems
          ) {
            const productId =
              numberValue(
                item.productId
              );

            if (
              productId <=
              0
            ) {
              continue;
            }

            const product =
              await tx.orm.public.Product
                .where({
                  id:
                    productId,
                })
                .first();

            if (
              !product
            ) {
              throw new Error(
                `Unable to restore stock. Product ${productId} was not found.`
              );
            }

            const soldAmount =
              Math.max(
                0,
                numberValue(
                  item.quantity
                )
              );

            /* =========================================
               WEIGHT PRODUCT RESTORE
            ========================================= */

            if (
              String(
                item.productType
              ) ===
                "weight" ||
              String(
                product.type
              ) ===
                "weight"
            ) {
              const restoredEntries =
                restoreWeightEntries(
                  String(
                    product.weightEntries ||
                      ""
                  ),

                  soldAmount
                );

              await tx.orm.public.Product
                .where({
                  id:
                    product.id,
                })
                .update({
                  weightEntries:
                    restoredEntries,

                  quantity:
                    0,
                });

              continue;
            }

            /* =========================================
               QUANTITY / SIZE RESTORE
            ========================================= */

            const restoredQuantity =
              Math.max(
                0,
                numberValue(
                  product.quantity
                )
              ) +
              soldAmount;

            await tx.orm.public.Product
              .where({
                id:
                  product.id,
              })
              .update({
                quantity:
                  restoredQuantity,
              });
          }

          /* =============================================
             GROUP NEW SALE STOCK
          ============================================= */

          const soldMap =
            new Map<
              number,
              number
            >();

          for (
            const item of
            body.items
          ) {
            const productId =
              Number(
                item.productId
              );

            if (
              !Number.isInteger(
                productId
              ) ||
              productId <=
                0
            ) {
              throw new Error(
                "Invalid product ID."
              );
            }

            const soldAmount =
              item.type ===
              "weight"
                ? Math.max(
                    0,
                    numberValue(
                      item.weight
                    )
                  )
                : Math.max(
                    0,
                    numberValue(
                      item.quantity
                    )
                  );

            if (
              soldAmount <=
              0
            ) {
              throw new Error(
                `Invalid quantity for ${item.name}.`
              );
            }

            soldMap.set(
              productId,

              (
                soldMap.get(
                  productId
                ) || 0
              ) +
                soldAmount
            );
          }

          /* =============================================
             PRODUCT SNAPSHOTS
          ============================================= */

          const productsToUpdate =
            new Map<
              number,
              {
                id: number;

                name: string;

                type: string;

                unit: string;

                quantity: number;

                weightEntries:
                  string;

                purchasePrice:
                  number;

                sellingPrice:
                  number;
              }
            >();

          /* =============================================
             VALIDATE NEW STOCK
          ============================================= */

          for (
            const [
              productId,
              soldAmount,
            ] of soldMap
          ) {
            const product =
              await tx.orm.public.Product
                .where({
                  id:
                    productId,
                })
                .first();

            if (
              !product
            ) {
              throw new Error(
                `Product ${productId} not found.`
              );
            }

            /* =========================================
               WEIGHT STOCK
            ========================================= */

            if (
              product.type ===
              "weight"
            ) {
              const {
                totalWeight,
              } =
                calculateWeights(
                  String(
                    product.weightEntries ||
                      ""
                  )
                );

              if (
                soldAmount >
                totalWeight
              ) {
                throw new Error(
                  `${product.name} has only ${Number(
                    totalWeight.toFixed(
                      2
                    )
                  )} KG available.`
                );
              }
            }

            /* =========================================
               QUANTITY STOCK
            ========================================= */

            else {
              const stock =
                Math.max(
                  0,
                  numberValue(
                    product.quantity
                  )
                );

              if (
                soldAmount >
                stock
              ) {
                throw new Error(
                  `${product.name} has only ${stock} ${product.unit} available.`
                );
              }
            }

            productsToUpdate.set(
              productId,
              {
                id:
                  product.id,

                name:
                  product.name,

                type:
                  product.type,

                unit:
                  product.unit,

                quantity:
                  numberValue(
                    product.quantity
                  ),

                weightEntries:
                  String(
                    product.weightEntries ||
                      ""
                  ),

                purchasePrice:
                  Math.max(
                    0,
                    numberValue(
                      product.purchasePrice
                    )
                  ),

                sellingPrice:
                  Math.max(
                    0,
                    numberValue(
                      product.sellingPrice
                    )
                  ),
              }
            );
          }

          /* =============================================
             TOTALS
          ============================================= */

          const subtotal =
            Math.max(
              0,
              numberValue(
                body.subtotal
              )
            );

          const tax =
            Math.max(
              0,
              numberValue(
                body.tax
              )
            );

          const total =
            Math.max(
              0,
              numberValue(
                body.grandTotal
              )
            );

          const paidAmount =
            Math.max(
              0,
              numberValue(
                body.amountPaid
              )
            );

          const remainingBalance =
            Math.max(
              0,
              total -
                paidAmount
            );

          const changeAmount =
            Math.max(
              0,
              paidAmount -
                total
            );

          /* =============================================
             STATUS
          ============================================= */

          const status =
            total > 0 &&
            paidAmount >=
              total
              ? "PAID"
              : paidAmount >
                  0
                ? "PARTIAL"
                : "UNPAID";

          const customerName =
            String(
              body.customer
                ?.name ||
                ""
            ).trim();

          const customerPhone =
            String(
              body.customer
                ?.phone ||
                ""
            ).trim();

          /* =============================================
             DELETE OLD PAYMENTS
          ============================================= */

          for (
            const payment of
            oldPayments
          ) {
            await tx.orm.public.Payment
              .where({
                id:
                  payment.id,
              })
              .delete();
          }

          /* =============================================
             DELETE OLD ITEMS
          ============================================= */

          for (
            const item of
            oldItems
          ) {
            await tx.orm.public.InvoiceItem
              .where({
                id:
                  item.id,
              })
              .delete();
          }

          /* =============================================
             UPDATE MAIN INVOICE
          ============================================= */

          const updatedInvoice =
            await tx.orm.public.Invoice
              .where({
                id:
                  invoiceId,
              })
              .update({
                customerName,

                customerPhone,

                subtotal,

                tax,

                total,

                paidAmount,

                remainingBalance,

                changeAmount,

                status,

                finalized:
                  true,
              });

          if (
            !updatedInvoice
          ) {
            throw new Error(
              "Unable to update invoice."
            );
          }

          /* =============================================
             NEW ITEMS + PROFIT
          ============================================= */

          let totalCostAmount =
            0;

          let totalProfitAmount =
            0;

          for (
            const item of
            body.items
          ) {
            const product =
              productsToUpdate.get(
                Number(
                  item.productId
                )
              );

            if (
              !product
            ) {
              throw new Error(
                "Product not found while updating invoice."
              );
            }

            const soldQuantity =
              item.type ===
              "weight"
                ? Math.max(
                    0,
                    numberValue(
                      item.weight
                    )
                  )
                : Math.max(
                    0,
                    numberValue(
                      item.quantity
                    )
                  );

            const rate =
              Math.max(
                0,
                numberValue(
                  item.price
                )
              );

            const saleAmount =
              Math.max(
                0,
                numberValue(
                  item.total
                )
              );

            /* =========================================
               PURCHASE PRICE SNAPSHOT
            ========================================= */

            const purchasePrice =
              product.purchasePrice;

            const costAmount =
              purchasePrice *
              soldQuantity;

            const profitAmount =
              saleAmount -
              costAmount;

            totalCostAmount +=
              costAmount;

            totalProfitAmount +=
              profitAmount;

            await tx.orm.public.InvoiceItem.create({
              invoiceId,

              productId:
                product.id,

              productName:
                product.name,

              productType:
                product.type,

              unit:
                product.type ===
                "weight"
                  ? "KG"
                  : product.unit,

              quantity:
                soldQuantity,

              rate,

              amount:
                saleAmount,

              /* ADMIN ONLY */

              purchasePrice,

              costAmount,

              profitAmount,
            });
          }

          /* =============================================
             PAYMENT
          ============================================= */

          if (
            paidAmount >
            0
          ) {
            await tx.orm.public.Payment.create({
              invoiceId,

              method:
                String(
                  body.paymentMethod ||
                    "Cash"
                ),

              amount:
                paidAmount,
            });
          }

          /* =============================================
             DEDUCT NEW STOCK
          ============================================= */

          for (
            const [
              productId,
              soldAmount,
            ] of soldMap
          ) {
            const product =
              productsToUpdate.get(
                productId
              );

            if (
              !product
            ) {
              throw new Error(
                "Product not found during stock deduction."
              );
            }

            /* =========================================
               WEIGHT
            ========================================= */

            if (
              product.type ===
              "weight"
            ) {
              const newWeightEntries =
                reduceWeightEntries(
                  product.weightEntries,

                  soldAmount
                );

              await tx.orm.public.Product
                .where({
                  id:
                    product.id,
                })
                .update({
                  weightEntries:
                    newWeightEntries,

                  quantity:
                    0,
                });

              continue;
            }

            /* =========================================
               PCS / SIZE
            ========================================= */

            const newQuantity =
              Math.max(
                0,
                product.quantity -
                  soldAmount
              );

            await tx.orm.public.Product
              .where({
                id:
                  product.id,
              })
              .update({
                quantity:
                  newQuantity,
              });
          }

          /* =============================================
             PROFIT MARGIN
          ============================================= */

          const profitMargin =
            total > 0
              ? (
                  totalProfitAmount /
                  total
                ) *
                100
              : 0;

          return {
            invoiceId,

            invoiceNumber:
              updatedInvoice.invoiceNumber,

            status,

            total,

            paidAmount,

            remainingBalance,

            changeAmount,

            costAmount:
              totalCostAmount,

            profitAmount:
              totalProfitAmount,

            profitMargin,
          };
        }
      );

    return NextResponse.json({
      message:
        "Sale updated successfully. Stock adjusted.",

      invoice:
        result,
    });
  } catch (error) {
    console.error(
      "UPDATE INVOICE ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          error instanceof
            Error
            ? error.message
            : "Unable to update invoice.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =====================================================
   DELETE SALE

   FLOW:

   Invoice
      ↓
   Restore sold stock
      ↓
   Delete payment
      ↓
   Delete invoice items
      ↓
   Delete invoice
===================================================== */

export async function DELETE(
  _request: Request,

  context: RouteContext
) {
  try {
    const invoiceId =
      await getInvoiceId(
        context
      );

    const result =
      await db.transaction(
        async (
          tx
        ) => {
          /* =============================================
             INVOICE
          ============================================= */

          const invoice =
            await tx.orm.public.Invoice
              .where({
                id:
                  invoiceId,
              })
              .first();

          if (
            !invoice
          ) {
            throw new Error(
              "Invoice not found."
            );
          }

          /* =============================================
             ITEMS
          ============================================= */

          const items =
            await tx.orm.public.InvoiceItem
              .where({
                invoiceId,
              })
              .all();

          /* =============================================
             PAYMENTS
          ============================================= */

          const payments =
            await tx.orm.public.Payment
              .where({
                invoiceId,
              })
              .all();

          /* =============================================
             RESTORE STOCK
          ============================================= */

          for (
            const item of
            items
          ) {
            const productId =
              numberValue(
                item.productId
              );

            if (
              productId <=
              0
            ) {
              continue;
            }

            const product =
              await tx.orm.public.Product
                .where({
                  id:
                    productId,
                })
                .first();

            if (
              !product
            ) {
              throw new Error(
                `Cannot restore ${item.productName}. Product no longer exists.`
              );
            }

            const soldAmount =
              Math.max(
                0,
                numberValue(
                  item.quantity
                )
              );

            /* =========================================
               WEIGHT RESTORE
            ========================================= */

            if (
              String(
                item.productType
              ) ===
                "weight" ||
              String(
                product.type
              ) ===
                "weight"
            ) {
              const restoredEntries =
                restoreWeightEntries(
                  String(
                    product.weightEntries ||
                      ""
                  ),

                  soldAmount
                );

              await tx.orm.public.Product
                .where({
                  id:
                    product.id,
                })
                .update({
                  weightEntries:
                    restoredEntries,

                  quantity:
                    0,
                });

              continue;
            }

            /* =========================================
               QUANTITY RESTORE
            ========================================= */

            const restoredQuantity =
              Math.max(
                0,
                numberValue(
                  product.quantity
                )
              ) +
              soldAmount;

            await tx.orm.public.Product
              .where({
                id:
                  product.id,
              })
              .update({
                quantity:
                  restoredQuantity,
              });
          }

          /* =============================================
             DELETE PAYMENTS
          ============================================= */

          for (
            const payment of
            payments
          ) {
            await tx.orm.public.Payment
              .where({
                id:
                  payment.id,
              })
              .delete();
          }

          /* =============================================
             DELETE ITEMS
          ============================================= */

          for (
            const item of
            items
          ) {
            await tx.orm.public.InvoiceItem
              .where({
                id:
                  item.id,
              })
              .delete();
          }

          /* =============================================
             DELETE INVOICE
          ============================================= */

          await tx.orm.public.Invoice
            .where({
              id:
                invoiceId,
            })
            .delete();

          return {
            id:
              invoiceId,

            invoiceNumber:
              invoice.invoiceNumber,
          };
        }
      );

    return NextResponse.json({
      message:
        `${result.invoiceNumber} deleted successfully. Stock restored.`,

      invoice:
        result,
    });
  } catch (error) {
    console.error(
      "DELETE INVOICE ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          error instanceof
            Error
            ? error.message
            : "Unable to delete invoice.",
      },
      {
        status: 500,
      }
    );
  }
}