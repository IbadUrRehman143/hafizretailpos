import { NextResponse } from "next/server";
import { db } from "@/src/prisma/db";

type PurchaseItemInput = {
  productId: number;
  quantity: number;
  purchasePrice: number;
  weightEntries?: string;
};

function safeNumber(value: unknown) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function parseWeightEntries(value: unknown) {
  return String(value || "")
    .split("+")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
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
   GET PURCHASES
====================================================== */

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
        const items = purchaseItems.filter(
          (item) =>
            item.purchaseId === purchase.id
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
      .sort((a, b) => b.id - a.id);

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
        message:
          "Failed to load purchases.",
      },
      {
        status: 500,
      }
    );
  }
}

/* ======================================================
   POST NEW PURCHASE
====================================================== */

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    /* =========================
       BASIC DATA
    ========================= */

    const supplierId =
      safeNumber(body.supplierId);

    const supplierName = String(
      body.supplierName || ""
    ).trim();

    const supplierPhone = String(
      body.supplierPhone || ""
    ).trim();

    const paymentMethod = String(
      body.paymentMethod || "Cash"
    );

    const notes = String(
      body.notes || ""
    ).trim();

    const paidAmount =
      safeNumber(body.paidAmount);

    const rawItems: PurchaseItemInput[] =
      Array.isArray(body.items)
        ? body.items
        : [];

    /* =========================
       VALIDATION
    ========================= */

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

    if (rawItems.length === 0) {
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

    /* =========================
       TRANSACTION
    ========================= */

    const result =
      await db.transaction(
        async (tx) => {
          /* =========================
             SUPPLIER
          ========================= */

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
          } else {
            /*
              Supplier ID nahi mila to
              purchase ke saath supplier
              create kar sakte hain.
            */

            let existingSupplier = null;

            if (supplierPhone) {
              existingSupplier =
                await tx.orm.public.Supplier
                  .where({
                    phone:
                      supplierPhone,
                  })
                  .first();
            }

            if (existingSupplier) {
              supplier =
                existingSupplier;
            } else {
              supplier =
                await tx.orm.public.Supplier.create(
                  {
                    name: supplierName,
                    phone:
                      supplierPhone,
                  }
                );
            }
          }

          /* =========================
             LOAD PRODUCTS
          ========================= */

          const preparedItems = [];

          let subtotal = 0;

          for (const rawItem of rawItems) {
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

            if (purchasePrice <= 0) {
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

            const productType = String(
              product.type || ""
            ).toLowerCase();

            let weightEntries = "";

            let purchasedQuantity =
              quantity;

            /* =========================
               WEIGHT PRODUCT
            ========================= */

            if (
              productType === "weight"
            ) {
              const suppliedWeights =
                parseWeightEntries(
                  rawItem.weightEntries
                );

              /*
                Agar bundles diye hain:
                82+115+67

                quantity automatically
                bundles ka total banega.
              */

              if (
                suppliedWeights.length > 0
              ) {
                purchasedQuantity =
                  suppliedWeights.reduce(
                    (total, weight) =>
                      total + weight,
                    0
                  );

                weightEntries =
                  suppliedWeights.join(
                    "+"
                  );
              } else {
                /*
                  Agar user sirf 150 KG
                  enter kare to usko
                  single bundle treat karenge.
                */

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
             PAYMENT VALIDATION
          ========================= */

          if (paidAmount > subtotal) {
            throw new Error(
              "Paid amount cannot be greater than purchase total."
            );
          }

          const remainingBalance =
            Math.max(
              0,
              subtotal - paidAmount
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

          /* =========================
             CREATE PURCHASE
          ========================= */

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
                  supplier.phone || "",

                purchaseDate,

                subtotal,

                paidAmount,

                remainingBalance,

                status,

                notes,
              }
            );

          /* =========================
             FINAL PURCHASE NUMBER
          ========================= */

          const purchaseNumber =
            `PUR-${String(
              purchase.id
            ).padStart(4, "0")}`;

          const finalPurchase =
            await tx.orm.public.Purchase
              .where({
                id: purchase.id,
              })
              .update({
                purchaseNumber,
              });

          /* =========================
             PURCHASE ITEMS +
             STOCK INCREASE
          ========================= */

          const createdItems = [];

          for (
            const item of preparedItems
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
              ).toLowerCase();

            /* =========================
               COTTON / WEIGHT STOCK
            ========================= */

            if (
              productType === "weight"
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
                  id: item.productId,
                })
                .update({
                  /*
                    Weight products mein
                    inventory source
                    weightEntries hai.
                  */

                  weightEntries:
                    newWeights.join(
                      "+"
                    ),

                  /*
                    Latest purchase rate
                    bhi update hoga.
                  */

                  purchasePrice:
                    item.purchasePrice,
                });
            }

            /* =========================
               PCS / SIZE STOCK
            ========================= */

            else {
              const currentQuantity =
                safeNumber(
                  item.product.quantity
                );

              const newQuantity =
                currentQuantity +
                item.quantity;

              await tx.orm.public.Product
                .where({
                  id: item.productId,
                })
                .update({
                  quantity:
                    newQuantity,

                  purchasePrice:
                    item.purchasePrice,
                });
            }
          }

          /* =========================
             INITIAL PAYMENT
          ========================= */

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
            purchase:
              finalPurchase,

            items:
              createdItems,

            payment,
          };
        }
      );

    return NextResponse.json(
      {
        success: true,

        message:
          "Purchase saved successfully.",

        purchase: {
          ...result.purchase,

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