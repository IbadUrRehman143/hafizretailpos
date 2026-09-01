import {
  NextRequest,
  NextResponse,
} from "next/server";

import { db } from "@/src/prisma/db";

/* =========================================================
   HELPERS
========================================================= */

function parseSupplierId(
  value: string
) {
  const id = Number(value);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return null;
  }

  return id;
}

function cleanString(
  value: unknown
) {
  return String(
    value ?? ""
  ).trim();
}

/* =========================================================
   GET ONE SUPPLIER
========================================================= */

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id: rawId } =
      await context.params;

    const id =
      parseSupplierId(rawId);

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
      await db.orm.public.Supplier
        .where({
          id,
        })
        .first();

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

    return NextResponse.json({
      success: true,
      supplier,
    });
  } catch (error) {
    console.error(
      "GET SUPPLIER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load supplier.",
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
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id: rawId } =
      await context.params;

    const id =
      parseSupplierId(rawId);

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

    const current =
      await db.orm.public.Supplier
        .where({
          id,
        })
        .first();

    if (!current) {
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

    const name =
      cleanString(
        body?.name ??
          current.name
      ).replace(
        /\s+/g,
        " "
      );

    const phone =
      cleanString(
        body?.phone ??
          current.phone
      );

    const status =
      cleanString(
        body?.status ??
          current.status ??
          "Active"
      );

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

    await db.orm.public.Supplier
      .where({
        id,
      })
      .update({
        name,
        phone,
        status,
      });

    const updated =
      await db.orm.public.Supplier
        .where({
          id,
        })
        .first();

    return NextResponse.json({
      success: true,
      supplier: updated,
    });
  } catch (error) {
    console.error(
      "UPDATE SUPPLIER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to update supplier.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   DELETE SUPPLIER

   RULE:

   1. Supplier has NO Purchase history
      -> permanent delete.

   2. Supplier HAS Purchase history
      -> status = Inactive
      -> supplier disappears from dropdown
      -> old purchases remain safe.
========================================================= */

export async function DELETE(
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    /* =====================================================
       ID
    ===================================================== */

    const { id: rawId } =
      await context.params;

    const id =
      parseSupplierId(rawId);

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

    /* =====================================================
       FIND SUPPLIER
    ===================================================== */

    const supplier =
      await db.orm.public.Supplier
        .where({
          id,
        })
        .first();

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

    /* =====================================================
       CHECK PURCHASE HISTORY

       Prisma 8 RC mein supplierId non-ID filter
       avoid kar rahe hain.

       all() + JS some()
    ===================================================== */

    const purchases =
      await db.orm.public.Purchase.all();

    const hasPurchaseHistory =
      purchases.some(
        (purchase) =>
          Number(
            purchase.supplierId
          ) === id
      );

    /* =====================================================
       HAS PURCHASE HISTORY
       DO NOT HARD DELETE
    ===================================================== */

    if (
      hasPurchaseHistory
    ) {
      await db.orm.public.Supplier
        .where({
          id,
        })
        .update({
          status:
            "Inactive",
        });

      return NextResponse.json(
        {
          success: true,

          mode:
            "deactivated",

          supplierId:
            id,

          message:
            "Supplier removed from active list. Purchase history preserved.",
        },
        {
          status: 200,
        }
      );
    }

    /* =====================================================
       NO HISTORY
       PERMANENT DELETE
    ===================================================== */

    await db.orm.public.Supplier
      .where({
        id,
      })
      .delete();

    return NextResponse.json(
      {
        success: true,

        mode:
          "deleted",

        supplierId:
          id,

        message:
          "Supplier permanently deleted.",
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
          "Failed to delete supplier.",
      },
      {
        status: 500,
      }
    );
  }
}