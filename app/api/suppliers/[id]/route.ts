import { NextResponse } from "next/server";
import { db } from "@/src/prisma/db";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/* =========================================================
   HELPER
========================================================= */

function parseSupplierId(
  value: string
) {
  const id =
    Number(value);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return null;
  }

  return id;
}

/* =========================================================
   GET SINGLE SUPPLIER
========================================================= */

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id: rawId } =
      await context.params;

    const id =
      parseSupplierId(
        rawId
      );

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid supplier ID.",
        },
        {
          status: 400,
        }
      );
    }

    const supplier =
      await db.orm.public.Supplier.where(
        {
          id,
        }
      ).first();

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Supplier not found.",
        },
        {
          status: 404,
        }
      );
    }

    const purchases =
      await db.orm.public.Purchase.where(
        {
          supplierId: id,
        }
      ).all();

    const purchaseIds =
      purchases.map(
        (purchase) =>
          Number(purchase.id)
      );

    const allItems =
      await db.orm.public.PurchaseItem.all();

    const allPayments =
      await db.orm.public.PurchasePayment.all();

    const purchaseDetails =
      purchases
        .map((purchase) => {
          const items =
            allItems.filter(
              (item) =>
                Number(
                  item.purchaseId
                ) ===
                Number(
                  purchase.id
                )
            );

          const payments =
            allPayments.filter(
              (payment) =>
                Number(
                  payment.purchaseId
                ) ===
                Number(
                  purchase.id
                )
            );

          return {
            ...purchase,
            items,
            payments,
          };
        })
        .sort(
          (a, b) =>
            new Date(
              String(
                b.purchaseDate ||
                  b.createdAt
              )
            ).getTime() -
            new Date(
              String(
                a.purchaseDate ||
                  a.createdAt
              )
            ).getTime()
        );

    const totalPurchases =
      purchases.reduce(
        (sum, purchase) =>
          sum +
          Number(
            purchase.subtotal ||
              0
          ),
        0
      );

    const totalPaid =
      purchases.reduce(
        (sum, purchase) =>
          sum +
          Number(
            purchase.paidAmount ||
              0
          ),
        0
      );

    const payable =
      purchases.reduce(
        (sum, purchase) =>
          sum +
          Number(
            purchase.remainingBalance ||
              0
          ),
        0
      );

    let paymentStatus:
      | "PAID"
      | "PARTIAL"
      | "UNPAID" =
      "UNPAID";

    if (
      purchases.length > 0 &&
      payable <= 0
    ) {
      paymentStatus =
        "PAID";
    } else if (
      totalPaid > 0
    ) {
      paymentStatus =
        "PARTIAL";
    }

    const lastPurchase =
      purchaseDetails.length >
      0
        ? purchaseDetails[0]
        : null;

    return NextResponse.json(
      {
        success: true,

        supplier: {
          ...supplier,

          purchaseCount:
            purchases.length,

          totalPurchases,

          totalPaid,

          payable,

          paymentStatus,

          lastPurchase:
            lastPurchase
              ? String(
                  lastPurchase.purchaseDate ||
                    lastPurchase.createdAt
                )
              : null,

          purchases:
            purchaseDetails,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET SUPPLIER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load supplier.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   UPDATE SUPPLIER
========================================================= */

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const { id: rawId } =
      await context.params;

    const id =
      parseSupplierId(
        rawId
      );

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid supplier ID.",
        },
        {
          status: 400,
        }
      );
    }

    const supplier =
      await db.orm.public.Supplier.where(
        {
          id,
        }
      ).first();

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Supplier not found.",
        },
        {
          status: 404,
        }
      );
    }

    const body =
      await request.json();

    const name = String(
      body.name ||
        supplier.name ||
        ""
    ).trim();

    const phone = String(
      body.phone ??
        supplier.phone ??
        ""
    ).trim();

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Supplier name is required.",
        },
        {
          status: 400,
        }
      );
    }

    const suppliers =
      await db.orm.public.Supplier.all();

    const duplicate =
      suppliers.find(
        (item) => {
          if (
            Number(
              item.id
            ) === id
          ) {
            return false;
          }

          const sameName =
            String(
              item.name || ""
            )
              .trim()
              .toLowerCase() ===
            name.toLowerCase();

          const samePhone =
            phone !== "" &&
            String(
              item.phone || ""
            ).trim() === phone;

          return (
            sameName &&
            (samePhone ||
              phone === "")
          );
        }
      );

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Another supplier with same details already exists.",
        },
        {
          status: 409,
        }
      );
    }

    const updatedSupplier =
      await db.orm.public.Supplier.where(
        {
          id,
        }
      ).update({
        name,
        phone,
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Supplier updated successfully.",
        supplier:
          updatedSupplier,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "UPDATE SUPPLIER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Supplier update failed.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   DELETE SUPPLIER
========================================================= */

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { id: rawId } =
      await context.params;

    const id =
      parseSupplierId(
        rawId
      );

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid supplier ID.",
        },
        {
          status: 400,
        }
      );
    }

    const supplier =
      await db.orm.public.Supplier.where(
        {
          id,
        }
      ).first();

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Supplier not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * IMPORTANT:
     *
     * Supplier ke purchases hain to
     * delete allow nahi karenge.
     *
     * Purchase history preserve rehni chahiye.
     */

    const purchase =
      await db.orm.public.Purchase.where(
        {
          supplierId: id,
        }
      ).first();

    if (purchase) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Supplier delete nahi ho sakta because is supplier ki purchase history mojood hai.",
        },
        {
          status: 409,
        }
      );
    }

    await db.orm.public.Supplier.where(
      {
        id,
      }
    ).delete();

    return NextResponse.json(
      {
        success: true,
        message:
          "Supplier deleted successfully.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "DELETE SUPPLIER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Supplier delete failed.",
      },
      {
        status: 500,
      }
    );
  }
}