import { NextResponse } from "next/server";

import { db } from "@/src/prisma/db";

/* =====================================================
   HELPERS
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
   TRANSACTION DIRECTION
===================================================== */

function getDirection(
  type: string
): "IN" | "OUT" {
  switch (type) {
    case "PURCHASE":
    case "RETURN":
    case "ADJUSTMENT_IN":
    case "OPENING_STOCK":
    case "SALE_CANCEL":
      return "IN";

    case "SALE":
    case "ADJUSTMENT_OUT":
      return "OUT";

    default:
      return "IN";
  }
}

/* =====================================================
   GET INVENTORY HISTORY
===================================================== */

export async function GET(
  request: Request
) {
  try {
    /* =================================================
       URL PARAMETERS
    ================================================= */

    const {
      searchParams,
    } = new URL(
      request.url
    );

    const search =
      String(
        searchParams.get(
          "search"
        ) || ""
      )
        .trim()
        .toLowerCase();

    const type =
      String(
        searchParams.get(
          "type"
        ) || ""
      )
        .trim()
        .toUpperCase();

    const productIdValue =
      searchParams.get(
        "productId"
      );

    const productId =
      productIdValue
        ? Number(
            productIdValue
          )
        : null;

    const page =
      Math.max(
        1,
        Number(
          searchParams.get(
            "page"
          ) || 1
        ) || 1
      );

    const limit =
      Math.min(
        500,
        Math.max(
          1,
          Number(
            searchParams.get(
              "limit"
            ) || 100
          ) || 100
        )
      );

    /* =================================================
       LOAD TRANSACTIONS
    ================================================= */

    const transactionRows =
      await db.orm.public.InventoryTransaction
        .all();

    /* =================================================
       LOAD PRODUCTS
    ================================================= */

    const productRows =
      await db.orm.public.Product
        .all();

    /* =================================================
       PRODUCT MAP
    ================================================= */

    const productMap =
      new Map(
        productRows.map(
          (product) => [
            Number(
              product.id
            ),
            product,
          ]
        )
      );

    /* =================================================
       NORMALIZE
    ================================================= */

    let transactions =
      transactionRows.map(
        (transaction) => {
          const product =
            productMap.get(
              Number(
                transaction.productId
              )
            );

          const transactionType =
            String(
              transaction.type ||
                ""
            );

          return {
            id:
              Number(
                transaction.id
              ),

            productId:
              Number(
                transaction.productId
              ),

            productName:
              String(
                product?.name ||
                  `Product #${transaction.productId}`
              ),

            category:
              String(
                product?.category ||
                  ""
              ),

            productType:
              String(
                product?.type ||
                  ""
              ),

            type:
              transactionType,

            direction:
              getDirection(
                transactionType
              ),

            quantity:
              safeNumber(
                transaction.quantity
              ),

            unit:
              String(
                transaction.unit ||
                  product?.unit ||
                  "PCS"
              ),

            referenceType:
              transaction.referenceType
                ? String(
                    transaction.referenceType
                  )
                : null,

            referenceId:
              transaction.referenceId !==
                null &&
              transaction.referenceId !==
                undefined
                ? Number(
                    transaction.referenceId
                  )
                : null,

            note:
              transaction.note
                ? String(
                    transaction.note
                  )
                : null,

            createdAt:
              String(
                transaction.createdAt
              ),
          };
        }
      );

    /* =================================================
       TYPE FILTER
    ================================================= */

    if (type) {
      transactions =
        transactions.filter(
          (transaction) =>
            transaction.type ===
            type
        );
    }

    /* =================================================
       PRODUCT FILTER
    ================================================= */

    if (
      productId !==
        null &&
      Number.isInteger(
        productId
      ) &&
      productId > 0
    ) {
      transactions =
        transactions.filter(
          (transaction) =>
            transaction.productId ===
            productId
        );
    }

    /* =================================================
       SEARCH FILTER
    ================================================= */

    if (search) {
      transactions =
        transactions.filter(
          (transaction) => {
            const searchable =
              [
                transaction.productName,
                transaction.category,
                transaction.type,
                transaction.referenceType ||
                  "",
                transaction.note ||
                  "",
                String(
                  transaction.referenceId ||
                    ""
                ),
              ]
                .join(" ")
                .toLowerCase();

            return searchable.includes(
              search
            );
          }
        );
    }

    /* =================================================
       SORT NEWEST FIRST
    ================================================= */

    transactions.sort(
      (a, b) => {
        const dateA =
          new Date(
            a.createdAt
          ).getTime();

        const dateB =
          new Date(
            b.createdAt
          ).getTime();

        if (
          Number.isNaN(
            dateA
          ) ||
          Number.isNaN(
            dateB
          )
        ) {
          return (
            b.id -
            a.id
          );
        }

        return (
          dateB -
          dateA
        );
      }
    );

    /* =================================================
       STATS

       Stats are calculated before pagination.
    ================================================= */

    const totalTransactions =
      transactions.length;

    const totalIn =
      transactions
        .filter(
          (transaction) =>
            transaction.direction ===
            "IN"
        )
        .reduce(
          (
            total,
            transaction
          ) =>
            total +
            safeNumber(
              transaction.quantity
            ),
          0
        );

    const totalOut =
      transactions
        .filter(
          (transaction) =>
            transaction.direction ===
            "OUT"
        )
        .reduce(
          (
            total,
            transaction
          ) =>
            total +
            safeNumber(
              transaction.quantity
            ),
          0
        );

    /* =================================================
       PAGINATION
    ================================================= */

    const total =
      transactions.length;

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          total /
            limit
        )
      );

    const safePage =
      Math.min(
        page,
        totalPages
      );

    const start =
      (
        safePage -
        1
      ) *
      limit;

    const paginatedTransactions =
      transactions.slice(
        start,
        start +
          limit
      );

    /* =================================================
       SUCCESS
    ================================================= */

    return NextResponse.json(
      {
        success: true,

        transactions:
          paginatedTransactions,

        stats: {
          totalTransactions,
          totalIn,
          totalOut,
        },

        pagination: {
          page:
            safePage,

          limit,

          total,

          totalPages,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "INVENTORY TRANSACTIONS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        transactions: [],

        stats: {
          totalTransactions: 0,
          totalIn: 0,
          totalOut: 0,
        },

        error:
          error instanceof
          Error
            ? error.message
            : "Failed to load inventory history.",
      },
      {
        status: 500,
      }
    );
  }
}