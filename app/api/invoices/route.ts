import { NextResponse } from "next/server";

import { db } from "@/src/prisma/db";

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

/* =====================================================
   WEIGHT CALCULATION
===================================================== */

function calculateWeights(
  value: string
) {
  const weights = String(
    value || ""
  )
    .split("+")
    .map((item) =>
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

   Before:
   87+76+98+12

   Sale:
   100 KG

   After:
   63+98+12
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
      Number(
        soldWeight
      ) || 0
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
   GET SALES / INVOICES

   Used by Sales Admin page.
===================================================== */

export async function GET() {
  try {
    const invoices =
      await db.orm.public.Invoice.all();

    const fullInvoices =
      await Promise.all(
        invoices.map(
          async (
            invoice
          ) => {
            const items =
              await db.orm.public.InvoiceItem
                .where({
                  invoiceId:
                    invoice.id,
                })
                .all();

            const payments =
              await db.orm.public.Payment
                .where({
                  invoiceId:
                    invoice.id,
                })
                .all();

            const costAmount =
              items.reduce(
                (
                  total,
                  item
                ) =>
                  total +
                  (
                    Number(
                      item.costAmount
                    ) ||
                    0
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
                  (
                    Number(
                      item.profitAmount
                    ) ||
                    0
                  ),
                0
              );

            const invoiceTotal =
              Number(
                invoice.total
              ) || 0;

            const profitMargin =
              invoiceTotal >
              0
                ? (
                    profitAmount /
                    invoiceTotal
                  ) *
                  100
                : 0;

            return {
              ...invoice,

              items,

              payments,

              costAmount,

              profitAmount,

              profitMargin,
            };
          }
        )
      );

    fullInvoices.sort(
      (
        a,
        b
      ) =>
        b.id -
        a.id
    );

    return NextResponse.json(
      fullInvoices
    );
  } catch (error) {
    console.error(
      "GET INVOICES ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          error instanceof
          Error
            ? error.message
            : "Unable to load invoices.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =====================================================
   CREATE INVOICE
===================================================== */

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as InvoiceRequestBody;

    /* =================================================
       ITEMS VALIDATION
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

    /* =================================================
       DATABASE TRANSACTION
    ================================================= */

    const result =
      await db.transaction(
        async (
          tx
        ) => {
          /* =============================================
             GROUP SOLD STOCK
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
                    Number(
                      item.weight
                    ) ||
                      0
                  )
                : Math.max(
                    0,
                    Number(
                      item.quantity
                    ) ||
                      0
                  );

            if (
              soldAmount <=
              0
            ) {
              throw new Error(
                `Invalid sale quantity for ${item.name}.`
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
             PRODUCT SNAPSHOT
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
             VALIDATE STOCK
          ============================================= */

          for (const [
            productId,
            soldAmount,
          ] of soldMap) {
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

            if (
              product.type ===
              "weight"
            ) {
              const {
                totalWeight,
              } =
                calculateWeights(
                  product.weightEntries
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
            } else {
              const stock =
                Math.max(
                  0,
                  Number(
                    product.quantity
                  ) ||
                    0
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
                  Number(
                    product.quantity
                  ) ||
                  0,

                weightEntries:
                  String(
                    product.weightEntries ||
                      ""
                  ),

                purchasePrice:
                  Math.max(
                    0,
                    Number(
                      product.purchasePrice
                    ) ||
                      0
                  ),

                sellingPrice:
                  Math.max(
                    0,
                    Number(
                      product.sellingPrice
                    ) ||
                      0
                  ),
              }
            );
          }

          /* =============================================
             CUSTOMER
          ============================================= */

          let customerId:
            number | null =
            null;

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

          if (
            customerName ||
            customerPhone
          ) {
            const customer =
              await tx.orm.public.Customer.create({
                name:
                  customerName ||
                  "Walk-in Customer",

                phone:
                  customerPhone,
              });

            customerId =
              customer.id;
          }

          /* =============================================
             TOTALS
          ============================================= */

          const subtotal =
            Math.max(
              0,
              Number(
                body.subtotal
              ) ||
                0
            );

          const tax =
            Math.max(
              0,
              Number(
                body.tax
              ) ||
                0
            );

          const total =
            Math.max(
              0,
              Number(
                body.grandTotal
              ) ||
                0
            );

          const paidAmount =
            Math.max(
              0,
              Number(
                body.amountPaid
              ) ||
                0
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
            total >
              0 &&
            paidAmount >=
              total
              ? "PAID"
              : paidAmount >
                  0
                ? "PARTIAL"
                : "UNPAID";

          /* =============================================
             TEMP INVOICE NUMBER
          ============================================= */

          const tempInvoiceNumber =
            `TMP-${Date.now()}-${Math.random()
              .toString(36)
              .slice(
                2,
                8
              )}`;

          /* =============================================
             CREATE INVOICE
          ============================================= */

          const createdInvoice =
            await tx.orm.public.Invoice.create({
              invoiceNumber:
                tempInvoiceNumber,

              customerId,

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

          /* =============================================
             FINAL SERIAL NUMBER
          ============================================= */

          const finalInvoiceNumber =
            `INV-${String(
              createdInvoice.id
            ).padStart(
              4,
              "0"
            )}`;

          const invoice =
            await tx.orm.public.Invoice
              .where({
                id:
                  createdInvoice.id,
              })
              .update({
                invoiceNumber:
                  finalInvoiceNumber,
              });

          if (
            !invoice
          ) {
            throw new Error(
              "Unable to generate invoice number."
            );
          }

          /* =============================================
             CREATE INVOICE ITEMS
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
                "Product not found while saving invoice."
              );
            }

            const soldQuantity =
              item.type ===
              "weight"
                ? Math.max(
                    0,
                    Number(
                      item.weight
                    ) ||
                      0
                  )
                : Math.max(
                    0,
                    Number(
                      item.quantity
                    ) ||
                      0
                  );

            const rate =
              Math.max(
                0,
                Number(
                  item.price
                ) ||
                  0
              );

            const saleAmount =
              Math.max(
                0,
                Number(
                  item.total
                ) ||
                  0
              );

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
              invoiceId:
                invoice.id,

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

              purchasePrice,

              costAmount,

              profitAmount,
            });
          }

          /* =============================================
             INITIAL PAYMENT
          ============================================= */

          if (
            paidAmount >
            0
          ) {
            await tx.orm.public.Payment.create({
              invoiceId:
                invoice.id,

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
             STOCK DEDUCTION
          ============================================= */

          for (const [
            productId,
            soldAmount,
          ] of soldMap) {
            const product =
              productsToUpdate.get(
                productId
              );

            if (
              !product
            ) {
              throw new Error(
                "Product not found during stock update."
              );
            }

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

              await tx.orm.public.InventoryTransaction.create({
                productId:
                  product.id,

                type:
                  "SALE",

                quantity:
                  soldAmount,

                unit:
                  "KG",

                referenceType:
                  "INVOICE",

                referenceId:
                  invoice.id,

                note:
                  `Sale ${invoice.invoiceNumber}`,
              });

              continue;
            }

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

            await tx.orm.public.InventoryTransaction.create({
              productId:
                product.id,

              type:
                "SALE",

              quantity:
                soldAmount,

              unit:
                product.unit ||
                "PCS",

              referenceType:
                "INVOICE",

              referenceId:
                invoice.id,

              note:
                `Sale ${invoice.invoiceNumber}`,
            });
          }

          /* =============================================
             PROFIT
          ============================================= */

          const profitMargin =
            total >
            0
              ? (
                  totalProfitAmount /
                  total
                ) *
                100
              : 0;

          /* =============================================
             RESPONSE

             IMPORTANT:
             changeAmount is now returned too.
          ============================================= */

          return {
            invoiceId:
              invoice.id,

            invoiceNumber:
              invoice.invoiceNumber,

            status:
              invoice.status,

            total:
              invoice.total,

            paidAmount:
              invoice.paidAmount,

            remainingBalance:
              invoice.remainingBalance,

            changeAmount:
              invoice.changeAmount,

            costAmount:
              totalCostAmount,

            profitAmount:
              totalProfitAmount,

            profitMargin,
          };
        }
      );

    /* =================================================
       SUCCESS
    ================================================= */

    return NextResponse.json(
      {
        message:
          "Invoice saved successfully. Stock updated.",

        invoice:
          result,
      },
      {
        status:
          201,
      }
    );
  } catch (error) {
    console.error(
      "SAVE INVOICE ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          error instanceof
          Error
            ? error.message
            : "Unable to save invoice.",
      },
      {
        status:
          500,
      }
    );
  }
}