import { NextResponse } from "next/server";
import { db } from "@/src/prisma/db";

function safeNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export async function GET() {
  try {
    const [customers, invoices] = await Promise.all([
      db.orm.public.Customer.all(),
      db.orm.public.Invoice.all(),
    ]);

    const customerList = customers
      .map((customer) => {
        const customerInvoices = invoices.filter(
          (invoice) => invoice.customerId === customer.id
        );

        const totalSales = customerInvoices.reduce(
          (sum, invoice) => sum + safeNumber(invoice.total),
          0
        );

        const totalPaid = customerInvoices.reduce(
          (sum, invoice) => sum + safeNumber(invoice.paidAmount),
          0
        );

        const receivable = customerInvoices.reduce(
          (sum, invoice) => sum + safeNumber(invoice.remainingBalance),
          0
        );

        const invoiceCount = customerInvoices.length;

        const sortedInvoices = [...customerInvoices].sort(
          (a, b) =>
            new Date(String(b.createdAt)).getTime() -
            new Date(String(a.createdAt)).getTime()
        );

        const lastInvoice = sortedInvoices[0];

        return {
          ...customer,

          totalSales,
          totalPaid,
          receivable,
          invoiceCount,

          lastPurchase: lastInvoice?.createdAt || null,

          paymentStatus:
            receivable <= 0
              ? "PAID"
              : totalPaid > 0
                ? "PARTIAL"
                : "UNPAID",
        };
      })
      .sort((a, b) => b.id - a.id);

    return NextResponse.json({
      success: true,
      customers: customerList,
    });
  } catch (error) {
    console.error("GET /api/customers error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load customers.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
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
      const existingName = String(customer.name || "")
        .trim()
        .toLowerCase();

      const existingPhone = String(customer.phone || "").trim();

      const sameName = existingName === name.toLowerCase();

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
          error: "Customer already exists.",
          customer: duplicateCustomer,
        },
        {
          status: 409,
        }
      );
    }

    const customer = await db.orm.public.Customer.create({
      name,
      phone,
    });

    return NextResponse.json(
      {
        success: true,
        customer,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("POST /api/customers error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create customer.",
      },
      {
        status: 500,
      }
    );
  }
}