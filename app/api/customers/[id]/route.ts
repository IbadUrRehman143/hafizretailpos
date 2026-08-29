import { NextResponse } from "next/server";
import { db } from "@/src/prisma/db";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function safeNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const customerId = Number(id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid customer ID.",
        },
        {
          status: 400,
        }
      );
    }

    const customer =
      await db.orm.public.Customer.where({
        id: customerId,
      }).first();

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer not found.",
        },
        {
          status: 404,
        }
      );
    }

    const invoices =
      await db.orm.public.Invoice.where({
        customerId,
      }).all();

    invoices.sort(
      (a, b) =>
        new Date(String(b.createdAt)).getTime() -
        new Date(String(a.createdAt)).getTime()
    );

    const invoiceIds = invoices.map((invoice) => invoice.id);

    const allItems = await db.orm.public.InvoiceItem.all();
    const allPayments = await db.orm.public.Payment.all();

    const customerInvoices = invoices.map((invoice) => {
      const items = allItems.filter(
        (item) => item.invoiceId === invoice.id
      );

      const payments = allPayments
        .filter(
          (payment) => payment.invoiceId === invoice.id
        )
        .sort(
          (a, b) =>
            new Date(String(b.createdAt)).getTime() -
            new Date(String(a.createdAt)).getTime()
        );

      return {
        ...invoice,
        items,
        payments,
      };
    });

    const totalSales = invoices.reduce(
      (sum, invoice) => sum + safeNumber(invoice.total),
      0
    );

    const totalPaid = invoices.reduce(
      (sum, invoice) => sum + safeNumber(invoice.paidAmount),
      0
    );

    const receivable = invoices.reduce(
      (sum, invoice) =>
        sum + safeNumber(invoice.remainingBalance),
      0
    );

    return NextResponse.json({
      success: true,

      customer: {
        ...customer,

        totalSales,
        totalPaid,
        receivable,

        invoiceCount: invoices.length,

        lastPurchase:
          invoices.length > 0
            ? invoices[0].createdAt
            : null,

        paymentStatus:
          receivable <= 0
            ? "PAID"
            : totalPaid > 0
              ? "PARTIAL"
              : "UNPAID",

        invoices: customerInvoices,
      },

      invoiceIds,
    });
  } catch (error) {
    console.error(
      "GET /api/customers/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load customer.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const customerId = Number(id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid customer ID.",
        },
        {
          status: 400,
        }
      );
    }

    const existingCustomer =
      await db.orm.public.Customer.where({
        id: customerId,
      }).first();

    if (!existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer not found.",
        },
        {
          status: 404,
        }
      );
    }

    const body = await request.json();

    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer name is required.",
        },
        {
          status: 400,
        }
      );
    }

    const customers = await db.orm.public.Customer.all();

    const duplicateCustomer = customers.find((customer) => {
      if (customer.id === customerId) {
        return false;
      }

      const existingName = String(customer.name || "")
        .trim()
        .toLowerCase();

      const existingPhone = String(customer.phone || "").trim();

      const sameName =
        existingName === name.toLowerCase();

      const samePhone =
        phone.length > 0 &&
        existingPhone.length > 0 &&
        existingPhone === phone;

      return sameName || samePhone;
    });

    if (duplicateCustomer) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Another customer with this name or phone already exists.",
        },
        {
          status: 409,
        }
      );
    }

    const customer =
      await db.orm.public.Customer.where({
        id: customerId,
      }).update({
        name,
        phone,
      });

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error(
      "PUT /api/customers/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update customer.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const customerId = Number(id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid customer ID.",
        },
        {
          status: 400,
        }
      );
    }

    const customer =
      await db.orm.public.Customer.where({
        id: customerId,
      }).first();

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer not found.",
        },
        {
          status: 404,
        }
      );
    }

    const invoices =
      await db.orm.public.Invoice.where({
        customerId,
      }).all();

    /*
      IMPORTANT BUSINESS RULE:

      Agar wholesale customer ki invoices already hain,
      customer delete nahi karenge.

      Is se purani sales history aur receivable relation
      safe rahega.
    */

    if (invoices.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This customer has sales history and cannot be deleted.",
        },
        {
          status: 400,
        }
      );
    }

    await db.orm.public.Customer.where({
      id: customerId,
    }).delete();

    return NextResponse.json({
      success: true,
      message: "Customer deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE /api/customers/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete customer.",
      },
      {
        status: 500,
      }
    );
  }
}