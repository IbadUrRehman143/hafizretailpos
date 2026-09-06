import { NextResponse } from "next/server";

import { db } from "@/src/prisma/db";

/* =====================================================
   TYPES
===================================================== */

type AdjustmentType =
  | "add"
  | "remove";

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
   "34+60+70+56+56"
        ↓
   [34, 60, 70, 56, 56]
===================================================== */

function parseWeightEntries(
  value: unknown
) {
  if (
    typeof value !==
    "string"
  ) {
    return [];
  }

  return value
    .split("+")
    .map((entry) =>
      safeNumber(
        entry.trim()
      )
    )
    .filter(
      (entry) =>
        entry > 0
    );
}

/* =====================================================
   FORMAT WEIGHT ENTRIES

   [34,60,70]
        ↓
   "34+60+70"
===================================================== */

function formatWeightEntries(
  entries: number[]
) {
  return entries
    .filter(
      (entry) =>
        entry > 0
    )
    .map((entry) =>
      Number(
        entry.toFixed(2)
      ).toString()
    )
    .join("+");
}

/* =====================================================
   CALCULATE TOTAL WEIGHT
===================================================== */

function calculateWeightStock(
  entries: number[]
) {
  return entries.reduce(
    (
      total,
      entry
    ) =>
      total +
      safeNumber(entry),
    0
  );
}

/* =====================================================
   REMOVE WEIGHT FIFO

   Current:
   50 + 60 + 70

   Remove:
   80

   Result:
   30 + 70
===================================================== */

function removeWeightFIFO(
  entries: number[],
  amountToRemove: number
) {
  const result = [
    ...entries,
  ];

  let remaining =
    amountToRemove;

  while (
    remaining > 0 &&
    result.length > 0
  ) {
    const firstWeight =
      safeNumber(
        result[0]
      );

    if (
      firstWeight <=
      remaining
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

  return result.filter(
    (entry) =>
      entry > 0
  );
}

/* =====================================================
   POST
   MANUAL INVENTORY ADJUSTMENT
===================================================== */

export async function POST(
  request: Request
) {
  try {
    /* =================================================
       BODY
    ================================================= */

    const body =
      await request.json();

    const productId =
      Number(
        body?.productId
      );

    const adjustmentType =
      String(
        body?.adjustmentType ||
          ""
      ).toLowerCase() as AdjustmentType;

    const requestAmount =
      safeNumber(
        body?.amount
      );

    const requestWeightEntries =
      typeof body?.weightEntries ===
      "string"
        ? body.weightEntries.trim()
        : "";

    const note =
      typeof body?.note ===
      "string"
        ? body.note.trim()
        : "";

    /* =================================================
       BASIC VALIDATION
    ================================================= */

    if (
      !Number.isInteger(
        productId
      ) ||
      productId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "Invalid product ID.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      adjustmentType !==
        "add" &&
      adjustmentType !==
        "remove"
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "Adjustment type must be add or remove.",
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
        async (tx) => {
          /* =============================================
             LOAD PRODUCT
          ============================================= */

          const product =
            await tx.orm.public.Product
              .where({
                id: productId,
              })
              .first();

          if (!product) {
            throw new Error(
              "Product not found."
            );
          }

          /* =============================================
             PRODUCT TYPE
          ============================================= */

          const productType =
            String(
              product.type ||
                "quantity"
            ).toLowerCase();

          const isWeightProduct =
            productType ===
            "weight";

          const unit =
            isWeightProduct
              ? "KG"
              : String(
                  product.unit ||
                    "PCS"
                );

          /* =============================================
             VALUES
          ============================================= */

          let previousStock = 0;

          let currentStock = 0;

          let actualAmount = 0;

          let finalWeightEntries =
            String(
              product.weightEntries ||
                ""
            );

          let addedBundleCount:
            | number
            | null = null;

          let totalBundleCount:
            | number
            | null = null;

          /* =================================================
             WEIGHT PRODUCT
          ================================================= */

          if (isWeightProduct) {
            /* ===========================================
               CURRENT BUNDLES
            =========================================== */

            const currentEntries =
              parseWeightEntries(
                product.weightEntries
              );

            previousStock =
              calculateWeightStock(
                currentEntries
              );

            /* ===========================================
               ADD WEIGHT BUNDLES
            =========================================== */

            if (
              adjustmentType ===
              "add"
            ) {
              /*
               * Frontend sends:
               *
               * weightEntries:
               * "34+60+70+56+56"
               *
               * Server parses again.
               * Never trust frontend total.
               */

              const newEntries =
                parseWeightEntries(
                  requestWeightEntries
                );

              if (
                newEntries.length ===
                0
              ) {
                throw new Error(
                  "Enter valid bundle weights. Example: 45+34+34"
                );
              }

              /* =========================================
                 TOTAL ADDED KG
              ========================================= */

              actualAmount =
                calculateWeightStock(
                  newEntries
                );

              if (
                actualAmount <= 0
              ) {
                throw new Error(
                  "Total bundle weight must be greater than 0."
                );
              }

              /* =========================================
                 APPEND BUNDLES
              ========================================= */

              const updatedEntries =
                [
                  ...currentEntries,
                  ...newEntries,
                ];

              finalWeightEntries =
                formatWeightEntries(
                  updatedEntries
                );

              currentStock =
                calculateWeightStock(
                  updatedEntries
                );

              addedBundleCount =
                newEntries.length;

              totalBundleCount =
                updatedEntries.length;

              /* =========================================
                 UPDATE PRODUCT
              ========================================= */

              await tx.orm.public.Product
                .where({
                  id: productId,
                })
                .update({
                  weightEntries:
                    finalWeightEntries,
                });
            }

            /* ===========================================
               REMOVE WEIGHT FIFO
            =========================================== */

            else {
              actualAmount =
                requestAmount;

              if (
                !Number.isFinite(
                  actualAmount
                ) ||
                actualAmount <= 0
              ) {
                throw new Error(
                  "Enter a valid weight to remove."
                );
              }

              if (
                actualAmount >
                previousStock
              ) {
                throw new Error(
                  `Cannot remove ${actualAmount} KG. Current stock is only ${previousStock} KG.`
                );
              }

              /* =========================================
                 FIFO REMOVE
              ========================================= */

              const updatedEntries =
                removeWeightFIFO(
                  currentEntries,
                  actualAmount
                );

              finalWeightEntries =
                formatWeightEntries(
                  updatedEntries
                );

              currentStock =
                calculateWeightStock(
                  updatedEntries
                );

              totalBundleCount =
                updatedEntries.length;

              /* =========================================
                 UPDATE PRODUCT
              ========================================= */

              await tx.orm.public.Product
                .where({
                  id: productId,
                })
                .update({
                  weightEntries:
                    finalWeightEntries,
                });
            }
          }

          /* =================================================
             QUANTITY / SIZE PRODUCT
          ================================================= */

          else {
            actualAmount =
              requestAmount;

            /* ===========================================
               VALIDATE AMOUNT
            =========================================== */

            if (
              !Number.isFinite(
                actualAmount
              ) ||
              actualAmount <= 0
            ) {
              throw new Error(
                "Enter a valid stock quantity."
              );
            }

            /* ===========================================
               PCS WHOLE NUMBER
            =========================================== */

            if (
              unit.toUpperCase() ===
                "PCS" &&
              !Number.isInteger(
                actualAmount
              )
            ) {
              throw new Error(
                "PCS stock must be a whole number."
              );
            }

            previousStock =
              safeNumber(
                product.quantity
              );

            /* ===========================================
               REMOVE VALIDATION
            =========================================== */

            if (
              adjustmentType ===
                "remove" &&
              actualAmount >
                previousStock
            ) {
              throw new Error(
                `Cannot remove ${actualAmount} ${unit}. Current stock is only ${previousStock} ${unit}.`
              );
            }

            /* ===========================================
               NEW STOCK
            =========================================== */

            currentStock =
              adjustmentType ===
              "add"
                ? previousStock +
                  actualAmount
                : previousStock -
                  actualAmount;

            currentStock =
              Math.max(
                0,
                currentStock
              );

            /* ===========================================
               UPDATE PRODUCT
            =========================================== */

            await tx.orm.public.Product
              .where({
                id: productId,
              })
              .update({
                quantity:
                  currentStock,
              });
          }

          /* =================================================
             INVENTORY TRANSACTION
          ================================================= */

          const transactionType =
            adjustmentType ===
            "add"
              ? "ADJUSTMENT_IN"
              : "ADJUSTMENT_OUT";

          /* =================================================
             HISTORY NOTE
          ================================================= */

          let historyNote =
            note;

          if (!historyNote) {
            if (
              isWeightProduct &&
              adjustmentType ===
                "add"
            ) {
              historyNote =
                `Manual stock added: ${addedBundleCount ?? 0} bundle(s), ${actualAmount} KG`;
            } else if (
              adjustmentType ===
              "add"
            ) {
              historyNote =
                "Manual stock added";
            } else {
              historyNote =
                "Manual stock removed";
            }
          }

          /* =================================================
             CREATE HISTORY
          ================================================= */

          await tx.orm.public.InventoryTransaction.create(
            {
              productId,

              type:
                transactionType,

              quantity:
                actualAmount,

              unit,

              referenceType:
                "MANUAL_ADJUSTMENT",

              note:
                historyNote,
            }
          );

          /* =================================================
             RETURN RESULT
          ================================================= */

          return {
            productId,

            productName:
              String(
                product.name ||
                  ""
              ),

            productType,

            adjustmentType,

            amount:
              actualAmount,

            unit,

            previousStock,

            currentStock,

            transactionType,

            weightEntries:
              isWeightProduct
                ? finalWeightEntries
                : null,

            addedBundleCount,

            totalBundleCount,
          };
        }
      );

    /* =================================================
       SUCCESS MESSAGE
    ================================================= */

    let message =
      adjustmentType ===
      "add"
        ? "Stock added successfully."
        : "Stock removed successfully.";

    if (
      result.productType ===
        "weight" &&
      adjustmentType ===
        "add"
    ) {
      message =
        `Stock added successfully. ${result.addedBundleCount ?? 0} bundle(s), ${result.amount} KG added.`;
    }

    /* =================================================
       SUCCESS RESPONSE
    ================================================= */

    return NextResponse.json(
      {
        success: true,

        message,

        adjustment: {
          ...result,

          bundleCount:
            result.totalBundleCount,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    /* =================================================
       ERROR
    ================================================= */

    console.error(
      "INVENTORY ADJUSTMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof
          Error
            ? error.message
            : "Failed to adjust stock.",
      },
      {
        status: 500,
      }
    );
  }
}