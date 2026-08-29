import { NextResponse } from "next/server";
import { db } from "@/src/prisma/db";

/* =========================================================
   GET ALL SUPPLIERS
========================================================= */

export async function GET() {
  try {
    const suppliers =
      await db.orm.public.Supplier.all();

    const purchases =
      await db.orm.public.Purchase.all();

    const result =
      suppliers
        .map((supplier) => {
          const supplierPurchases =
            purchases.filter(
              (purchase) =>
                Number(
                  purchase.supplierId
                ) ===
                Number(
                  supplier.id
                )
            );

          const totalPurchases =
            supplierPurchases.reduce(
              (sum, purchase) =>
                sum +
                Number(
                  purchase.subtotal ||
                    0
                ),
              0
            );

          const totalPaid =
            supplierPurchases.reduce(
              (sum, purchase) =>
                sum +
                Number(
                  purchase.paidAmount ||
                    0
                ),
              0
            );

          const payable =
            supplierPurchases.reduce(
              (sum, purchase) =>
                sum +
                Number(
                  purchase.remainingBalance ||
                    0
                ),
              0
            );

          const lastPurchase =
            supplierPurchases.length >
            0
              ? supplierPurchases
                  .slice()
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
                  )[0]
              : null;

          let paymentStatus:
            | "PAID"
            | "PARTIAL"
            | "UNPAID" =
            "UNPAID";

          if (
            supplierPurchases.length ===
            0
          ) {
            paymentStatus =
              "UNPAID";
          } else if (
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

          return {
            ...supplier,

            purchaseCount:
              supplierPurchases.length,

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
          };
        })
        .sort(
          (a, b) =>
            Number(b.id) -
            Number(a.id)
        );

    return NextResponse.json(
      {
        success: true,
        suppliers: result,
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
          error instanceof Error
            ? error.message
            : "Failed to load suppliers.",
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

    const name = String(
      body.name || ""
    ).trim();

    const phone = String(
      body.phone || ""
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

    const existingSuppliers =
      await db.orm.public.Supplier.all();

    const duplicate =
      existingSuppliers.find(
        (supplier) => {
          const sameName =
            String(
              supplier.name || ""
            )
              .trim()
              .toLowerCase() ===
            name.toLowerCase();

          const samePhone =
            phone !== "" &&
            String(
              supplier.phone || ""
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
            "Supplier already exists.",
        },
        {
          status: 409,
        }
      );
    }

    const supplier =
      await db.orm.public.Supplier.create(
        {
          name,
          phone,
        }
      );

    return NextResponse.json(
      {
        success: true,
        message:
          "Supplier created successfully.",
        supplier: {
          ...supplier,

          purchaseCount: 0,
          totalPurchases: 0,
          totalPaid: 0,
          payable: 0,
          paymentStatus:
            "UNPAID",

          lastPurchase: null,
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
          error instanceof Error
            ? error.message
            : "Supplier creation failed.",
      },
      {
        status: 500,
      }
    );
  }
}