import { NextResponse } from "next/server";

import { db } from "@/src/prisma/db";

/* =====================================================
   TYPES
===================================================== */

type PurchaseItemInput = {
  productId: number;
  quantity: number;
  purchasePrice: number;
  weightEntries?: string;

  bundles?: number[];
};

/* =====================================================
   SAFE NUMBER
===================================================== */

function safeNumber(
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
   PARSE WEIGHT ENTRIES

   Example:
   "82+115+67"

   Result:
   [82, 115, 67]
===================================================== */

function parseWeightEntries(
  value: unknown
) {
  return String(
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
}

/* =====================================================
   PAYMENT STATUS
===================================================== */

function normalizeStatus(
  paidAmount: number,
  totalAmount: number
) {
  if (
    paidAmount <= 0
  ) {
    return "UNPAID";
  }

  if (
    paidAmount >=
    totalAmount
  ) {
    return "PAID";
  }

  return "PARTIAL";
}

/* =====================================================
   GET PURCHASES
===================================================== */

export async function GET() {
  try {
    /* =================================================
       LOAD PURCHASES
    ================================================= */

    const purchases =
      await db.orm.public.Purchase.all();

    /* =================================================
       LOAD ITEMS
    ================================================= */

    const purchaseItems =
      await db.orm.public.PurchaseItem.all();

    /* =================================================
       LOAD PAYMENTS
    ================================================= */

    const purchasePayments =
      await db.orm.public.PurchasePayment.all();

    /* =================================================
       MAP DATA
    ================================================= */

    const result =
      purchases
        .map(
          (purchase) => {
            const items =
              purchaseItems.filter(
                (item) =>
                  item.purchaseId ===
                  purchase.id
              );

            const payments =
              purchasePayments.filter(
                (payment) =>
                  payment.purchaseId ===
                  purchase.id
              );

            return {
              ...purchase,

              items,

              payments,
            };
          }
        )
        .sort(
          (a, b) =>
            b.id - a.id
        );

    /* =================================================
       SUCCESS
    ================================================= */

    return NextResponse.json({
      success: true,

      purchases:
        result,
    });
  } catch (error) {
    console.error(
      "GET PURCHASES ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Failed to load purchases.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =====================================================
   POST NEW PURCHASE
===================================================== */

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    /* =================================================
       BASIC DATA
    ================================================= */

    const supplierId =
      safeNumber(
        body.supplierId
      );

    const supplierName =
      String(
        body.supplierName ||
          ""
      ).trim();

    const supplierPhone =
      String(
        body.supplierPhone ||
          ""
      ).trim();

    const paymentMethod =
      String(
        body.paymentMethod ||
          "Cash"
      );

    const notes =
      String(
        body.notes ||
          ""
      ).trim();

    const paidAmount =
      safeNumber(
        body.paidAmount
      );

    const rawItems: PurchaseItemInput[] =
      Array.isArray(
        body.items
      )
        ? body.items
        : [];

    /* =================================================
       VALIDATION
    ================================================= */

    if (
      !supplierId &&
      !supplierName
    ) {
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

    if (
      rawItems.length ===
      0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "At least one product is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      paidAmount < 0
    ) {
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

    /* =================================================
       DATABASE TRANSACTION

       Purchase
       +
       Purchase Items
       +
       Product Stock
       +
       Inventory History
       +
       Payment

       All together.
    ================================================= */

    const result =
      await db.transaction(
        async (tx) => {
          /* =============================================
             SUPPLIER
          ============================================= */

          let supplier;

          if (
            supplierId > 0
          ) {
            supplier =
              await tx.orm.public.Supplier
                .where({
                  id:
                    supplierId,
                })
                .first();

            if (
              !supplier
            ) {
              throw new Error(
                "Selected supplier not found."
              );
            }
          } else {
            /* ===========================================
               CREATE / FIND SUPPLIER
            =========================================== */

            let existingSupplier =
              null;

            if (
              supplierPhone
            ) {
              existingSupplier =
                await tx.orm.public.Supplier
                  .where({
                    phone:
                      supplierPhone,
                  })
                  .first();
            }

            if (
              existingSupplier
            ) {
              supplier =
                existingSupplier;
            } else {
              supplier =
                await tx.orm.public.Supplier.create(
                  {
                    name:
                      supplierName,

                    phone:
                      supplierPhone,
                  }
                );
            }
          }

          /* =============================================
             PREPARE PURCHASE ITEMS
          ============================================= */

          const preparedItems =
            [];

          let subtotal =
            0;

          for (
            const rawItem of
            rawItems
          ) {
            const productId =
              safeNumber(
                rawItem.productId
              );

            let quantity =
              safeNumber(
                rawItem.quantity
              );

            const purchasePrice =
              safeNumber(
                rawItem.purchasePrice
              );

            /* ===========================================
               VALID PRODUCT
            =========================================== */

            if (
              productId <= 0
            ) {
              throw new Error(
                "Invalid product."
              );
            }

            /* ===========================================
               PURCHASE PRICE
            =========================================== */

            if (
              purchasePrice <=
              0
            ) {
              throw new Error(
                "Purchase price must be greater than 0."
              );
            }

            /* ===========================================
               LOAD PRODUCT
            =========================================== */

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
                `Product ID ${productId} not found.`
              );
            }

            const productType =
              String(
                product.type ||
                  ""
              ).toLowerCase();

            let weightEntries =
              "";

            let purchasedQuantity =
              quantity;

            /* ===========================================
               WEIGHT PRODUCT
            =========================================== */

            if (
              productType ===
              "weight"
            ) {
              /*
               * Frontend can send:
               *
               * weightEntries:
               * "82+115+67"
               *
               * OR:
               *
               * bundles:
               * [82, 115, 67]
               */

              const bundleValues =
                Array.isArray(
                  rawItem.bundles
                )
                  ? rawItem.bundles
                      .map(
                        (
                          weight
                        ) =>
                          safeNumber(
                            weight
                          )
                      )
                      .filter(
                        (
                          weight
                        ) =>
                          weight >
                          0
                      )
                  : [];

              const suppliedWeights =
                bundleValues.length >
                0
                  ? bundleValues
                  : parseWeightEntries(
                      rawItem.weightEntries
                    );

              /* =========================================
                 BUNDLE WEIGHTS PROVIDED
              ========================================= */

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
              }

              /* =========================================
                 SINGLE WEIGHT VALUE
              ========================================= */

              else {
                if (
                  quantity <=
                  0
                ) {
                  throw new Error(
                    "Weight purchase must contain valid KG or bundle weights."
                  );
                }

                purchasedQuantity =
                  quantity;

                weightEntries =
                  String(
                    quantity
                  );
              }

              if (
                purchasedQuantity <=
                0
              ) {
                throw new Error(
                  "Purchase weight must be greater than 0."
                );
              }
            }

            /* ===========================================
               QUANTITY / SIZE PRODUCT
            =========================================== */

            else {
              if (
                quantity <= 0
              ) {
                throw new Error(
                  "Purchase quantity must be greater than 0."
                );
              }

              if (
                !Number.isInteger(
                  quantity
                )
              ) {
                throw new Error(
                  "PCS quantity must be a whole number."
                );
              }

              purchasedQuantity =
                quantity;
            }

            /* ===========================================
               AMOUNT
            =========================================== */

            const amount =
              purchasedQuantity *
              purchasePrice;

            subtotal +=
              amount;

            preparedItems.push(
              {
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
              }
            );
          }

          /* =============================================
             PAYMENT VALIDATION
          ============================================= */

          if (
            paidAmount >
            subtotal
          ) {
            throw new Error(
              "Paid amount cannot be greater than purchase total."
            );
          }

          /* =============================================
             BALANCE
          ============================================= */

          const remainingBalance =
            Math.max(
              0,
              subtotal -
                paidAmount
            );

          /* =============================================
             STATUS
          ============================================= */

          const status =
            normalizeStatus(
              paidAmount,
              subtotal
            );

          /* =============================================
             PURCHASE DATE
          ============================================= */

          let purchaseDate =
            new Date().toISOString();

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

          /* =============================================
             TEMPORARY PURCHASE NUMBER
          ============================================= */

          const temporaryNumber =
            `TEMP-PUR-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 8)}`;

          /* =============================================
             CREATE PURCHASE
          ============================================= */

          const purchase =
            await tx.orm.public.Purchase.create(
              {
                purchaseNumber:
                  temporaryNumber,

                supplierId:
                  supplier.id,

                supplierName:
                  supplier.name,

                supplierPhone:
                  supplier.phone ||
                  "",

                purchaseDate,

                subtotal,

                paidAmount,

                remainingBalance,

                status,

                notes,
              }
            );

          /* =============================================
             FINAL PURCHASE NUMBER

             PUR-0001
             PUR-0002
             PUR-0003
          ============================================= */

          const purchaseNumber =
            `PUR-${String(
              purchase.id
            ).padStart(
              4,
              "0"
            )}`;

          const finalPurchase =
            await tx.orm.public.Purchase
              .where({
                id:
                  purchase.id,
              })
              .update({
                purchaseNumber,
              });

          /* =============================================
             PURCHASE ITEMS
             +
             STOCK INCREASE
             +
             INVENTORY HISTORY
          ============================================= */

          const createdItems =
            [];

          for (
            const item of
            preparedItems
          ) {
            /* ===========================================
               CREATE PURCHASE ITEM
            =========================================== */

            const createdItem =
              await tx.orm.public.PurchaseItem.create(
                {
                  purchaseId:
                    purchase.id,

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

            const productType =
              String(
                item.product.type ||
                  ""
              ).toLowerCase();

            /* ===========================================
               COTTON / WEIGHT STOCK
            =========================================== */

            if (
              productType ===
              "weight"
            ) {
              const existingWeights =
                parseWeightEntries(
                  item.product
                    .weightEntries
                );

              const purchasedWeights =
                parseWeightEntries(
                  item.weightEntries
                );

              const newWeights =
                [
                  ...existingWeights,
                  ...purchasedWeights,
                ];

              /* =========================================
                 UPDATE PRODUCT
              ========================================= */

              await tx.orm.public.Product
                .where({
                  id:
                    item.productId,
                })
                .update({
                  /*
                   * Cotton inventory:
                   *
                   * Existing:
                   * 82+115
                   *
                   * Purchase:
                   * 67+94
                   *
                   * New:
                   * 82+115+67+94
                   */

                  weightEntries:
                    newWeights.join(
                      "+"
                    ),

                  /*
                   * Product's latest
                   * purchase/cost price.
                   */

                  purchasePrice:
                    item.purchasePrice,
                });
            }

            /* ===========================================
               PCS / SIZE STOCK
            =========================================== */

            else {
              const currentQuantity =
                safeNumber(
                  item.product
                    .quantity
                );

              const newQuantity =
                currentQuantity +
                item.quantity;

              await tx.orm.public.Product
                .where({
                  id:
                    item.productId,
                })
                .update({
                  quantity:
                    newQuantity,

                  /*
                   * Latest cost price.
                   */

                  purchasePrice:
                    item.purchasePrice,
                });
            }

            /* ===========================================
               INVENTORY TRANSACTION

               THIS CONNECTS:
               PURCHASES → INVENTORY
            =========================================== */

            await tx.orm.public.InventoryTransaction.create(
              {
                productId:
                  item.productId,

                type:
                  "PURCHASE",

                quantity:
                  item.quantity,

                unit:
                  item.unit,

                referenceType:
                  "PURCHASE",

                referenceId:
                  purchase.id,

                note:
                  `Purchase ${purchaseNumber}`,
              }
            );
          }

          /* =============================================
             INITIAL PAYMENT
          ============================================= */

          let payment =
            null;

          if (
            paidAmount > 0
          ) {
            payment =
              await tx.orm.public.PurchasePayment.create(
                {
                  purchaseId:
                    purchase.id,

                  method:
                    paymentMethod,

                  amount:
                    paidAmount,
                }
              );
          }

          /* =============================================
             RETURN TRANSACTION DATA
          ============================================= */

          return {
            purchase:
              finalPurchase,

            items:
              createdItems,

            payment,
          };
        }
      );

    /* =================================================
       SUCCESS RESPONSE
    ================================================= */

    return NextResponse.json(
      {
        success: true,

        message:
          "Purchase saved successfully and inventory updated.",

        purchase: {
          ...result.purchase,

          items:
            result.items,

          payments:
            result.payment
              ? [
                  result.payment,
                ]
              : [],
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE PURCHASE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof
            Error
            ? error.message
            : "Failed to save purchase.",
      },
      {
        status: 500,
      }
    );
  }
}