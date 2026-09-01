import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";
import {
  getBusinessSettings,
  normalizeInvoicePrefix,
} from "@/src/lib/businessSettings";

function getString(
  value: unknown,
  fallback = ""
) {
  return typeof value === "string"
    ? value.trim()
    : fallback;
}

function getBoolean(
  value: unknown,
  fallback = false
) {
  return typeof value === "boolean"
    ? value
    : fallback;
}

function getNumber(
  value: unknown,
  fallback = 0
) {
  const number = Number(value);
  return Number.isFinite(number)
    ? number
    : fallback;
}

export async function GET() {
  try {
    const settings =
      await getBusinessSettings();

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error(
      "GET /api/settings:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load settings.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const current =
      await getBusinessSettings();

    const businessName =
      getString(body.businessName);

    const phone =
      getString(body.phone);

    const email =
      getString(body.email);

    const address =
      getString(body.address);

    const currencyRaw =
      getString(body.currency, "PKR")
        .toUpperCase();

    const currency =
      ["PKR", "SAR", "USD"].includes(
        currencyRaw
      )
        ? currencyRaw
        : "PKR";

    const invoicePrefix =
      normalizeInvoicePrefix(
        body.invoicePrefix
      );

    const taxEnabled =
      getBoolean(body.taxEnabled, false);

    const taxRate =
      getNumber(body.taxRate, 0);

    const lowStockAlert =
      getBoolean(
        body.lowStockAlert,
        true
      );

    const lowStockLimit =
      getNumber(
        body.lowStockLimit,
        5
      );

    const whatsappEnabled =
      getBoolean(
        body.whatsappEnabled,
        false
      );

    const autoPrint =
      getBoolean(
        body.autoPrint,
        false
      );

    if (!businessName) {
      return NextResponse.json(
        {
          success: false,
          message: "Business name is required.",
        },
        { status: 400 }
      );
    }

    if (taxRate < 0 || taxRate > 100) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tax rate must be between 0 and 100.",
        },
        { status: 400 }
      );
    }

    if (lowStockLimit < 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Low stock limit cannot be negative.",
        },
        { status: 400 }
      );
    }

    const settings =
      await db.transaction(async (tx) => {
        const updated =
          await tx.orm.public.Setting
            .where({ id: current.id })
            .update({
              businessName,
              phone,
              email,
              address,
              currency,
              invoicePrefix,
              taxEnabled,
              taxRate,
              lowStockAlert,
              lowStockLimit,
              whatsappEnabled,
              autoPrint,
            });

        await tx.orm.public.AuditLog.create({
          module: "Settings",
          action: "UPDATE",
          description:
            "Application settings updated.",
          status: "Success",
        });

        return updated;
      });

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully.",
      settings,
    });
  } catch (error) {
    console.error(
      "PUT /api/settings:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update settings.",
      },
      { status: 500 }
    );
  }
}
