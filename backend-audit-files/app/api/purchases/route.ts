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
   HELPERS
===================================================== */

function safeNumber(value: unknown) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function parseWeightEntries(
  value: unknown
) {
  return String(value || "")
    .split("+")
    .map((item) =>
      Number(item.trim())
    )
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

/* =====================================================
   GET ALL PURCHASES
===================================================== */

export async function GET() {
  try {
    const purchases =
      await db.orm.public.Purchase.all();

    const purchaseItems =
      await db.orm.public.PurchaseItem.all();

    const purchasePayments =
      await db.orm.public.PurchasePayment.all();

    const result = purchases
      .map((purchase) => {
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
      })
      .sort(
        (a, b) =>
          b.id - a.id
      );

    return NextResponse.json({
      success: true,
      purchases: result,
    });
  } catch (error) {
    console.error(
      "GET PURCHASES ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to load purchases.",

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
        body.supplierName || ""
      ).trim();

    const supplierPhone =
      String(
        body.supplierPhone || ""
      ).trim();

    const supplierBillNo =
      String(
        body.supplierBillNo || ""
      ).trim();

    const paymentMethod =
      String(
        body.paymentMethod ||
          "Cash"
      ).trim() || "Cash";

    const notes =
      String(
        body.notes || ""
      ).trim();

    const paidAmount =
      safeNumber(
        body.paidAmount
      );

    const rawItems: PurchaseItemInput[] =
      Array.isArray(body.items)
        ? body.items
        : [];

    /* =================================================
       BASIC VALIDATION
    ================================================= */

    if (
      supplierId <= 0 &&
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
      rawItems.length === 0
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

    /* =================================================
       DATABASE TRANSACTION

       Purchase
       +
       Purchase Items
       +
       Product Stock
       +
       InventoryTransaction
       +
       Initial PurchasePayment
    ================================================= */

    const result =
      await db.transaction(
        async (tx) => {
          /* =============================================
             SUPPLIER
          ============================================= */

          let supplier;

          if (supplierId > 0) {
            supplier =
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

            const supplierStatus =
              String(
                supplier.status ||
                  ""
              )
                .trim()
                .toLowerCase();

            if (
              [
                "inactive",
                "archived",
                "deleted",
              ].includes(
                supplierStatus
              )
            ) {
              throw new Error(
                "Selected supplier is inactive."
              );
            }
          } else {
            /* =========================================
               NO DEFAULT SUPPLIER

               Only create/find supplier when actual
               supplier information was supplied.
            ========================================= */

            const allSuppliers =
              await tx.orm.public.Supplier.all();

            let existingSupplier =
              null;

            if (supplierPhone) {
              existingSupplier =
                allSuppliers.find(
                  (item) =>
                    String(
                      item.phone || ""
                    ).trim() ===
                    supplierPhone
                ) || null;
            }

            if (
              !existingSupplier &&
              supplierName
            ) {
              existingSupplier =
                allSuppliers.find(
                  (item) =>
                    String(
                      item.name || ""
                    )
                      .trim()
                      .toLowerCase() ===
                      supplierName.toLowerCase() &&
                    String(
                      item.phone || ""
                    ).trim() ===
                      supplierPhone
                ) || null;
            }

            if (existingSupplier) {
              const status =
                String(
                  existingSupplier.status ||
                    ""
                )
                  .trim()
                  .toLowerCase();

              if (
                [
                  "inactive",
                  "archived",
                  "deleted",
                ].includes(status)
              ) {
                throw new Error(
                  "This supplier is inactive. Restore the supplier before using it."
                );
              }

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

                    status:
                      "Active",
                  }
                );
            }
          }

          /* =============================================
             DUPLICATE SUPPLIER BILL PROTECTION
          ============================================= */

          if (supplierBillNo) {
            const allPurchases =
              await tx.orm.public.Purchase.all();

            const duplicate =
              allPurchases.find(
                (purchase) =>
                  purchase.supplierId ===
                    supplier.id &&
                  String(
                    purchase.supplierBillNo ||
                      ""
                  )
                    .trim()
                    .toLowerCase() ===
                    supplierBillNo.toLowerCase()
              );

            if (duplicate) {
              throw new Error(
                `Supplier bill ${supplierBillNo} is already entered as ${duplicate.purchaseNumber}. Duplicate stock was blocked.`
              );
            }
          }

          /* =============================================
             PREPARE PURCHASE ITEMS
          ============================================= */

          const preparedItems: Array<{
            product: Awaited<
              ReturnType<
                typeof tx.orm.public.Product.where
              >
            > extends never
              ? never
              : any;
            productId: number;
            productName: string;
            productType: string;
            unit: string;
            quantity: number;
            purchasePrice: number;
            amount: number;
            weightEntries: string;
          }> = [];

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

            if (
              !Number.isInteger(
                productId
              ) ||
              productId <= 0
            ) {
              throw new Error(
                "Invalid product."
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
              )
                .trim()
                .toLowerCase();

            let purchasedQuantity =
              quantity;

            let weightEntries = "";

            /* =========================================
               WEIGHT / COTTON
            ========================================= */

            if (
              productType ===
              "weight"
            ) {
              const bundleValues =
                Array.isArray(
                  rawItem.bundles
                )
                  ? rawItem.bundles
                      .map((weight) =>
                        safeNumber(
                          weight
                        )
                      )
                      .filter(
                        (weight) =>
                          weight > 0
                      )
                  : [];

              const suppliedWeights =
                bundleValues.length >
                0
                  ? bundleValues
                  : parseWeightEntries(
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
                if (
                  quantity <= 0
                ) {
                  throw new Error(
                    "Weight purchase must contain valid KG or bundle weights."
                  );
                }

                purchasedQuantity =
                  quantity;

                weightEntries =
                  String(quantity);
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

            /* =========================================
               QUANTITY / SIZE
            ========================================= */

            else {
              if (quantity <= 0) {
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
                String(
                  product.type ||
                    "quantity"
                ),
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
             CREATE PURCHASE
          ============================================= */

          const temporaryNumber =
            `TEMP-PUR-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 8)}`;

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

                supplierBillNo,

                purchaseDate,

                subtotal,

                paidAmount,

                remainingBalance,

                paymentMethod,

                status,

                notes,
              }
            );

          /* =============================================
             FINAL PURCHASE NUMBER
          ============================================= */

          const purchaseNumber =
            `PUR-${String(
              purchase.id
            ).padStart(
              4,
              "0"
            )}`;

          await tx.orm.public.Purchase
            .where({
              id: purchase.id,
            })
            .update({
              purchaseNumber,
            });

          /* =============================================
             ITEMS + STOCK + INVENTORY
          ============================================= */

          const createdItems = [];

          for (
            const item of
            preparedItems
          ) {
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
              )
                .trim()
                .toLowerCase();

            /* =========================================
               WEIGHT STOCK
            ========================================= */

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

              const newWeights = [
                ...existingWeights,
                ...purchasedWeights,
              ];

              await tx.orm.public.Product
                .where({
                  id:
                    item.productId,
                })
                .update({
                  weightEntries:
                    newWeights.join(
                      "+"
                    ),

                  purchasePrice:
                    item.purchasePrice,
                });
            }

            /* =========================================
               QUANTITY / SIZE STOCK
            ========================================= */

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

                  purchasePrice:
                    item.purchasePrice,
                });
            }

            /* =========================================
               INVENTORY TRANSACTION
            ========================================= */

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
             INITIAL SUPPLIER PAYMENT

             This is payment history.
             It does NOT change stock separately.
          ============================================= */

          let payment = null;

          if (paidAmount > 0) {
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

          return {
            purchaseId:
              purchase.id,

            purchaseNumber,

            supplier,

            subtotal,

            paidAmount,

            remainingBalance,

            status,

            items:
              createdItems,

            payment,
          };
        }
      );

    /* =================================================
       LOAD FINAL PURCHASE

       Avoid relying on Prisma update return shape.
    ================================================= */

    const finalPurchase =
      await db.orm.public.Purchase
        .where({
          id:
            result.purchaseId,
        })
        .first();

    if (!finalPurchase) {
      throw new Error(
        "Purchase was created but could not be reloaded."
      );
    }

    return NextResponse.json(
      {
        success: true,

        message:
          "Purchase saved successfully and inventory updated.",

        purchase: {
          ...finalPurchase,

          items:
            result.items,

          payments:
            result.payment
              ? [result.payment]
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

        error:
          error instanceof Error
            ? error.message
            : "Failed to save purchase.",

        message:
          error instanceof Error
            ? error.message
            : "Failed to save purchase.",
      },
      {
        status: 500,
      }
    );
  }
}