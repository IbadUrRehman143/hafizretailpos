import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";

function getString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function getBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function getNumber(value: unknown, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

async function getOrCreateSettings() {
  const settings =
    await db.orm.public.Setting.all();

  if (settings.length > 0) {
    return settings[0];
  }

  return await db.orm.public.Setting.create({
    businessName: "Hafiz Retail POS",
    phone: "",
    email: "",
    address: "",
    currency: "PKR",
    invoicePrefix: "INV-",
    taxEnabled: false,
    taxRate: 0,
    lowStockAlert: true,
    lowStockLimit: 5,
    whatsappEnabled: false,
    autoPrint: false,
  });
}

// ======================================================
// GET SETTINGS
// ======================================================

export async function GET() {
  try {
    const settings =
      await getOrCreateSettings();

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error(
      "GET /api/settings error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load settings.",
      },
      {
        status: 500,
      }
    );
  }
}

// ======================================================
// UPDATE SETTINGS
// ======================================================

export async function PUT(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const current =
      await getOrCreateSettings();

    const businessName =
      getString(body.businessName);

    const phone =
      getString(body.phone);

    const email =
      getString(body.email);

    const address =
      getString(body.address);

    const currency =
      getString(
        body.currency,
        "PKR"
      );

    const invoicePrefix =
      getString(
        body.invoicePrefix,
        "INV-"
      );

    const taxEnabled =
      getBoolean(
        body.taxEnabled,
        false
      );

    const taxRate =
      getNumber(
        body.taxRate,
        0
      );

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
          message:
            "Business name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!invoicePrefix) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invoice prefix is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (taxRate < 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tax rate cannot be negative.",
        },
        {
          status: 400,
        }
      );
    }

    if (lowStockLimit < 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Low stock limit cannot be negative.",
        },
        {
          status: 400,
        }
      );
    }

    const settings =
      await db.orm.public.Setting
        .where({
          id: current.id,
        })
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

    return NextResponse.json({
      success: true,
      message:
        "Settings updated successfully.",
      settings,
    });
  } catch (error) {
    console.error(
      "PUT /api/settings error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update settings.",
      },
      {
        status: 500,
      }
    );
  }
}