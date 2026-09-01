import { NextResponse } from "next/server";
import { db } from "@/src/prisma/db";

/* =========================================================
   HELPERS
========================================================= */

function cleanString(value: unknown) {
  return String(value ?? "").trim();
}

function numberValue(value: unknown) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function normalizeName(value: unknown) {
  return cleanString(value)
    .replace(/\s+/g, " ");
}

/* =========================================================
   GET ALL ACTIVE SUPPLIERS
========================================================= */

export async function GET() {
  try {
    /*
     * Prisma 8 RC:
     * status par direct equality filter avoid kar rahe hain.
     */
    const suppliers =
      await db.orm.public.Supplier.all();

    const activeSuppliers = suppliers
      .filter((supplier) => {
        const status = cleanString(
          supplier.status || "Active"
        ).toLowerCase();

        return ![
          "inactive",
          "archived",
          "deleted",
        ].includes(status);
      })
      .sort(
        (a, b) =>
          Number(b.id) - Number(a.id)
      );

    return NextResponse.json(
      {
        success: true,

        suppliers: activeSuppliers.map(
          (supplier) => ({
            id: Number(supplier.id),

            name: cleanString(
              supplier.name
            ),

            phone: cleanString(
              supplier.phone
            ),

            whatsapp: cleanString(
              supplier.whatsapp
            ),

            email: cleanString(
              supplier.email
            ),

            address: cleanString(
              supplier.address
            ),

            company: cleanString(
              supplier.company
            ),

            notes: cleanString(
              supplier.notes
            ),

            openingBalance: numberValue(
              supplier.openingBalance
            ),

            status: cleanString(
              supplier.status || "Active"
            ),
          })
        ),
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET SUPPLIERS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load suppliers.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   CREATE SUPPLIER
========================================================= */

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    /* =====================================================
       VALUES
    ===================================================== */

    const name =
      normalizeName(body?.name);

    const phone =
      cleanString(body?.phone);

    const whatsapp =
      cleanString(body?.whatsapp);

    const email =
      cleanString(body?.email);

    const address =
      cleanString(body?.address);

    const company =
      cleanString(body?.company);

    const notes =
      cleanString(body?.notes);

    const openingBalance =
      Math.max(
        0,
        numberValue(
          body?.openingBalance
        )
      );

    /* =====================================================
       VALIDATION
    ===================================================== */

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

    /* =====================================================
       CREATE

       IMPORTANT:
       Supplier Purchase se independent hai.

       Add Supplier press hote hi DB mein save hoga.
       Purchase save karna zaroori nahi.
    ===================================================== */

    await db.orm.public.Supplier.create({
      name,
      phone,
      whatsapp,
      email,
      address,
      company,
      notes,
      openingBalance,
      status: "Active",
    });

    /* =====================================================
       GET REAL DATABASE RECORD
    ===================================================== */

    const suppliers =
      await db.orm.public.Supplier.all();

    const createdSupplier = [
      ...suppliers,
    ]
      .sort(
        (a, b) =>
          Number(b.id) -
          Number(a.id)
      )
      .find((supplier) => {
        const supplierName =
          normalizeName(
            supplier.name
          ).toLowerCase();

        const supplierPhone =
          cleanString(
            supplier.phone
          );

        return (
          supplierName ===
            name.toLowerCase() &&
          supplierPhone === phone
        );
      });

    if (!createdSupplier) {
      console.error(
        "CREATED SUPPLIER NOT FOUND:",
        {
          name,
          phone,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Supplier saved but database record could not be reloaded.",
        },
        {
          status: 500,
        }
      );
    }

    const id =
      Number(
        createdSupplier.id
      );

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Supplier saved but database returned invalid ID.",
        },
        {
          status: 500,
        }
      );
    }

    /* =====================================================
       RETURN EXACT SUPPLIER

       page.tsx expects:
       data.supplier
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        supplier: {
          id,

          name: cleanString(
            createdSupplier.name
          ),

          phone: cleanString(
            createdSupplier.phone
          ),

          whatsapp: cleanString(
            createdSupplier.whatsapp
          ),

          email: cleanString(
            createdSupplier.email
          ),

          address: cleanString(
            createdSupplier.address
          ),

          company: cleanString(
            createdSupplier.company
          ),

          notes: cleanString(
            createdSupplier.notes
          ),

          openingBalance: numberValue(
            createdSupplier.openingBalance
          ),

          status: cleanString(
            createdSupplier.status ||
              "Active"
          ),
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE SUPPLIER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to create supplier.",
      },
      {
        status: 500,
      }
    );
  }
}