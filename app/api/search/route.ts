import {
  NextRequest,
  NextResponse,
} from "next/server";

import { db } from "@/src/prisma/db";

// ======================================================
// GLOBAL SEARCH
// ======================================================

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const query =
      searchParams
        .get("q")
        ?.trim() || "";

    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        query,
        results: [],
      });
    }

    const search =
      query.toLowerCase();

    // ==================================================
    // LOAD DATABASE DATA
    // ==================================================

    const [
      products,
      customers,
      suppliers,
      invoices,
      purchases,
    ] = await Promise.all([
      db.orm.public.Product.all(),
      db.orm.public.Customer.all(),
      db.orm.public.Supplier.all(),
      db.orm.public.Invoice.all(),
      db.orm.public.Purchase.all(),
    ]);

    // ==================================================
    // PRODUCTS
    // ==================================================

    const productResults =
      products
        .filter((product) => {
          return (
            String(product.name)
              .toLowerCase()
              .includes(search) ||
            String(
              product.category || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              product.brand || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              product.model || ""
            )
              .toLowerCase()
              .includes(search)
          );
        })
        .slice(0, 5)
        .map((product) => ({
          id: `product-${product.id}`,

          recordId:
            product.id,

          type: "product",

          title:
            product.name,

          subtitle:
            [
              product.category,
              product.brand,
              product.model,
            ]
              .filter(Boolean)
              .join(" • "),

          href:
            `/dashboard/product?search=${encodeURIComponent(
              product.name
            )}`,
        }));

    // ==================================================
    // CUSTOMERS
    // ==================================================

    const customerResults =
      customers
        .filter((customer) => {
          return (
            String(customer.name)
              .toLowerCase()
              .includes(search) ||
            String(
              customer.phone || ""
            )
              .toLowerCase()
              .includes(search)
          );
        })
        .slice(0, 5)
        .map((customer) => ({
          id: `customer-${customer.id}`,

          recordId:
            customer.id,

          type: "customer",

          title:
            customer.name,

          subtitle:
            customer.phone || "",

          href:
            `/dashboard/customers?search=${encodeURIComponent(
              customer.name
            )}`,
        }));

    // ==================================================
    // SUPPLIERS
    // ==================================================

    const supplierResults =
      suppliers
        .filter((supplier) => {
          return (
            String(supplier.name)
              .toLowerCase()
              .includes(search) ||
            String(
              supplier.phone || ""
            )
              .toLowerCase()
              .includes(search)
          );
        })
        .slice(0, 5)
        .map((supplier) => ({
          id: `supplier-${supplier.id}`,

          recordId:
            supplier.id,

          type: "supplier",

          title:
            supplier.name,

          subtitle:
            supplier.phone || "",

          href:
            `/dashboard/suppliers?search=${encodeURIComponent(
              supplier.name
            )}`,
        }));

    // ==================================================
    // INVOICES / SALES
    // ==================================================

    const invoiceResults =
      invoices
        .filter((invoice) => {
          return (
            String(
              invoice.invoiceNumber || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              invoice.customerName || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              invoice.customerPhone || ""
            )
              .toLowerCase()
              .includes(search)
          );
        })
        .slice(0, 5)
        .map((invoice) => ({
          id: `invoice-${invoice.id}`,

          recordId:
            invoice.id,

          type: "invoice",

          title:
            invoice.invoiceNumber,

          subtitle:
            invoice.customerName ||
            "Retail Customer",

          href:
            `/dashboard/sales?invoice=${encodeURIComponent(
              invoice.invoiceNumber
            )}`,
        }));

    // ==================================================
    // PURCHASES
    // ==================================================

    const purchaseResults =
      purchases
        .filter((purchase) => {
          return (
            String(
              purchase.purchaseNumber ||
                ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              purchase.supplierName ||
                ""
            )
              .toLowerCase()
              .includes(search)
          );
        })
        .slice(0, 5)
        .map((purchase) => ({
          id: `purchase-${purchase.id}`,

          recordId:
            purchase.id,

          type: "purchase",

          title:
            purchase.purchaseNumber,

          subtitle:
            purchase.supplierName ||
            "Supplier",

          href:
            `/dashboard/purchases?purchase=${encodeURIComponent(
              purchase.purchaseNumber
            )}`,
        }));

    // ==================================================
    // COMBINE RESULTS
    // ==================================================

    const results = [
      ...productResults,
      ...customerResults,
      ...supplierResults,
      ...invoiceResults,
      ...purchaseResults,
    ].slice(0, 15);

    return NextResponse.json({
      success: true,
      query,
      results,
    });
  } catch (error) {
    console.error(
      "GET /api/search error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to search database.",
        results: [],
      },
      {
        status: 500,
      }
    );
  }
}