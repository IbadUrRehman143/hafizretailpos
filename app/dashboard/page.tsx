import Link from "next/link";

import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Users,
  Package,
  Boxes,
  Truck,
  AlertTriangle,
  ArrowRight,
  ReceiptText,
} from "lucide-react";

import DashboardLayout from "../components/layout/dashboardLayout";
import StatCard from "../dashboard/statCard";

import { db } from "@/src/prisma/db";

/* =====================================================
   HELPERS
===================================================== */

function numberValue(value: unknown) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

/* =====================================================
   CURRENCY
===================================================== */

function formatCurrency(value: number) {
  return `Rs. ${Number(
    value || 0
  ).toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  })}`;
}

/* =====================================================
   DATE KEY
   Pakistan Timezone
===================================================== */

function getDateKey(
  value: string | Date
) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "Asia/Karachi",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    ).formatToParts(date);

  const year =
    parts.find(
      (part) =>
        part.type ===
        "year"
    )?.value || "";

  const month =
    parts.find(
      (part) =>
        part.type ===
        "month"
    )?.value || "";

  const day =
    parts.find(
      (part) =>
        part.type ===
        "day"
    )?.value || "";

  return `${year}-${month}-${day}`;
}

/* =====================================================
   DISPLAY DATE
===================================================== */

function formatDate(
  value: unknown
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(
      String(value)
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleString(
    "en-PK",
    {
      timeZone:
        "Asia/Karachi",

      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  );
}

/* =====================================================
   TREND
===================================================== */

function calculateTrend(
  today: number,
  yesterday: number
) {
  if (yesterday <= 0) {
    if (today > 0) {
      return {
        value: "+100%",
        up: true,
      };
    }

    return {
      value: "0%",
      up: true,
    };
  }

  const percentage =
    ((today - yesterday) /
      yesterday) *
    100;

  const up =
    percentage >= 0;

  return {
    value: `${
      up ? "+" : ""
    }${percentage.toFixed(
      1
    )}%`,

    up,
  };
}

/* =====================================================
   WEIGHT STOCK
===================================================== */

function calculateWeightStock(
  value: unknown
) {
  return String(
    value || ""
  )
    .split("+")
    .map((item) =>
      Number(item.trim())
    )
    .filter(
      (item) =>
        Number.isFinite(
          item
        ) && item > 0
    )
    .reduce(
      (
        total,
        weight
      ) =>
        total + weight,
      0
    );
}

/* =====================================================
   STATUS BADGE
===================================================== */

function StatusBadge({
  status,
}: {
  status: unknown;
}) {
  const normalized =
    String(
      status || ""
    ).toUpperCase();

  const label =
    normalized === "PAID"
      ? "Paid"
      : normalized ===
          "PARTIAL"
        ? "Partial"
        : "Unpaid";

  const className =
    normalized === "PAID"
      ? "bg-emerald-100 text-emerald-700"
      : normalized ===
          "PARTIAL"
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

/* =====================================================
   OVERALL CARD
===================================================== */

function OverallCard({
  title,
  value,
  description,
  href,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </h3>

          <p className="mt-2 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-600">
        Open {title}

        <ArrowRight
          size={14}
          className="transition group-hover:translate-x-1"
        />
      </div>
    </Link>
  );
}

/* =====================================================
   DASHBOARD
===================================================== */

export default async function DashboardPage() {
  /* =================================================
     DATABASE
  ================================================= */

  const [
    invoices,
    invoiceItems,
    customers,
    products,
    suppliers,
  ] =
    await Promise.all([
      db.orm.public.Invoice.all(),

      db.orm.public.InvoiceItem.all(),

      db.orm.public.Customer.all(),

      db.orm.public.Product.all(),

      db.orm.public.Supplier.all(),
    ]);

  /* =================================================
     TODAY / YESTERDAY
  ================================================= */

  const now =
    new Date();

  const todayKey =
    getDateKey(now);

  const yesterdayDate =
    new Date(now);

  yesterdayDate.setDate(
    yesterdayDate.getDate() -
      1
  );

  const yesterdayKey =
    getDateKey(
      yesterdayDate
    );

  /* =================================================
     TODAY INVOICES
  ================================================= */

  const todayInvoices =
    invoices.filter(
      (invoice) =>
        getDateKey(
          String(
            invoice.createdAt
          )
        ) === todayKey
    );

  const yesterdayInvoices =
    invoices.filter(
      (invoice) =>
        getDateKey(
          String(
            invoice.createdAt
          )
        ) ===
        yesterdayKey
    );

  /* =================================================
     TODAY SALES
  ================================================= */

  const todaySales =
    todayInvoices.reduce(
      (
        total,
        invoice
      ) =>
        total +
        numberValue(
          invoice.total
        ),
      0
    );

  const yesterdaySales =
    yesterdayInvoices.reduce(
      (
        total,
        invoice
      ) =>
        total +
        numberValue(
          invoice.total
        ),
      0
    );

  /* =================================================
     TODAY ORDERS
  ================================================= */

  const todayOrders =
    todayInvoices.length;

  const yesterdayOrders =
    yesterdayInvoices.length;

  /* =================================================
     TODAY PROFIT
  ================================================= */

  const todayInvoiceIds =
    new Set(
      todayInvoices.map(
        (invoice) =>
          Number(invoice.id)
      )
    );

  const yesterdayInvoiceIds =
    new Set(
      yesterdayInvoices.map(
        (invoice) =>
          Number(invoice.id)
      )
    );

  const todayProfit =
    invoiceItems.reduce(
      (
        total,
        item
      ) => {
        if (
          !todayInvoiceIds.has(
            Number(
              item.invoiceId
            )
          )
        ) {
          return total;
        }

        return (
          total +
          numberValue(
            item.profitAmount
          )
        );
      },
      0
    );

  const yesterdayProfit =
    invoiceItems.reduce(
      (
        total,
        item
      ) => {
        if (
          !yesterdayInvoiceIds.has(
            Number(
              item.invoiceId
            )
          )
        ) {
          return total;
        }

        return (
          total +
          numberValue(
            item.profitAmount
          )
        );
      },
      0
    );

  /* =================================================
     TODAY CUSTOMERS
  ================================================= */

  const todayCustomers =
    customers.filter(
      (customer) =>
        getDateKey(
          String(
            customer.createdAt
          )
        ) === todayKey
    ).length;

  const yesterdayCustomers =
    customers.filter(
      (customer) =>
        getDateKey(
          String(
            customer.createdAt
          )
        ) ===
        yesterdayKey
    ).length;

  /* =================================================
     TRENDS
  ================================================= */

  const salesTrend =
    calculateTrend(
      todaySales,
      yesterdaySales
    );

  const orderTrend =
    calculateTrend(
      todayOrders,
      yesterdayOrders
    );

  const profitTrend =
    calculateTrend(
      todayProfit,
      yesterdayProfit
    );

  const customerTrend =
    calculateTrend(
      todayCustomers,
      yesterdayCustomers
    );

  /* =================================================
     OVERALL DATA
  ================================================= */

  const totalProducts =
    products.length;

  const totalSuppliers =
    suppliers.length;

  const totalSales =
    invoices.reduce(
      (
        total,
        invoice
      ) =>
        total +
        numberValue(
          invoice.total
        ),
      0
    );

  const totalInvoices =
    invoices.length;

  /* =================================================
     INVENTORY DATA
  ================================================= */

  const inventoryProducts =
    products.map(
      (product) => {
        const type =
          String(
            product.type ||
              "quantity"
          );

        const stock =
          type === "weight"
            ? calculateWeightStock(
                product.weightEntries
              )
            : Math.max(
                0,
                numberValue(
                  product.quantity
                )
              );

        return {
          id: Number(
            product.id
          ),

          name: String(
            product.name
          ),

          type,

          unit:
            type === "weight"
              ? "KG"
              : String(
                  product.unit ||
                    "PCS"
                ),

          stock,
        };
      }
    );

  const inStockProducts =
    inventoryProducts.filter(
      (product) =>
        product.stock > 0
    ).length;

  const outOfStockProducts =
    inventoryProducts.filter(
      (product) =>
        product.stock <= 0
    ).length;

  /* =================================================
     LOW STOCK
  ================================================= */

  const lowStockProducts =
    inventoryProducts
      .filter(
        (product) => {
          if (
            product.type ===
            "weight"
          ) {
            return (
              product.stock >
                0 &&
              product.stock <=
                50
            );
          }

          return (
            product.stock > 0 &&
            product.stock <=
              10
          );
        }
      )
      .sort(
        (a, b) =>
          a.stock -
          b.stock
      )
      .slice(0, 5);

  /* =================================================
     RECENT SALES
  ================================================= */

  const recentSales =
    [...invoices]
      .sort(
        (a, b) =>
          Number(b.id) -
          Number(a.id)
      )
      .slice(0, 5);

  /* =================================================
     LAST 7 DAYS SALES
  ================================================= */

  const last7Days =
    Array.from(
      {
        length: 7,
      },
      (
        _,
        index
      ) => {
        const date =
          new Date(now);

        date.setDate(
          date.getDate() -
            (6 - index)
        );

        const key =
          getDateKey(date);

        const total =
          invoices.reduce(
            (
              sum,
              invoice
            ) => {
              const invoiceKey =
                getDateKey(
                  String(
                    invoice.createdAt
                  )
                );

              if (
                invoiceKey !==
                key
              ) {
                return sum;
              }

              return (
                sum +
                numberValue(
                  invoice.total
                )
              );
            },
            0
          );

        const label =
          date.toLocaleDateString(
            "en-PK",
            {
              timeZone:
                "Asia/Karachi",

              weekday:
                "short",
            }
          );

        return {
          key,
          label,
          total,
        };
      }
    );

  const maxDaySales =
    Math.max(
      1,
      ...last7Days.map(
        (day) =>
          day.total
      )
    );

  /* =================================================
     UI
  ================================================= */

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* =============================================
            HEADER
        ============================================= */}

        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Hafiz Retail POS business overview.
            </p>
          </div>

          <Link
            href="/dashboard/invoice"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <ShoppingCart
              size={18}
            />

            + New Sale
          </Link>
        </div>

        {/* =============================================
            TODAY SECTION
        ============================================= */}

        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Today
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Aaj ki business performance.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {/* TODAY SALES */}

          <Link
            href="/dashboard/sales"
            className="block transition hover:-translate-y-0.5"
          >
            <StatCard
              title="Today's Sales"
              value={formatCurrency(
                todaySales
              )}
              description="vs. yesterday"
              trend={
                salesTrend.value
              }
              trendUp={
                salesTrend.up
              }
              icon={
                <DollarSign
                  size={21}
                />
              }
            />
          </Link>

          {/* TODAY ORDERS */}

          <Link
            href="/dashboard/sales"
            className="block transition hover:-translate-y-0.5"
          >
            <StatCard
              title="Today's Orders"
              value={String(
                todayOrders
              )}
              description="vs. yesterday"
              trend={
                orderTrend.value
              }
              trendUp={
                orderTrend.up
              }
              icon={
                <ShoppingCart
                  size={21}
                />
              }
            />
          </Link>

          {/* TODAY PROFIT */}

          <Link
            href="/dashboard/sales"
            className="block transition hover:-translate-y-0.5"
          >
            <StatCard
              title="Today's Profit"
              value={formatCurrency(
                todayProfit
              )}
              description="vs. yesterday"
              trend={
                profitTrend.value
              }
              trendUp={
                profitTrend.up
              }
              icon={
                <TrendingUp
                  size={21}
                />
              }
            />
          </Link>

          {/* TODAY CUSTOMERS */}

          <Link
            href="/dashboard/customers"
            className="block transition hover:-translate-y-0.5"
          >
            <StatCard
              title="Today's Customers"
              value={String(
                todayCustomers
              )}
              description="vs. yesterday"
              trend={
                customerTrend.value
              }
              trendUp={
                customerTrend.up
              }
              icon={
                <Users
                  size={21}
                />
              }
            />
          </Link>
        </div>

        {/* =============================================
            OVERALL BUSINESS
        ============================================= */}

        <div className="mb-4 mt-9">
          <h2 className="text-lg font-bold text-slate-900">
            Overall Business
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Poore system ka current data.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {/* INVENTORY */}

          <OverallCard
            title="Inventory"
            value={String(
              inStockProducts
            )}
            description={`${lowStockProducts.length} low stock • ${outOfStockProducts} out of stock`}
            href="/dashboard/inventory"
            icon={
              <Boxes
                size={22}
              />
            }
          />

          {/* PRODUCTS */}

          <OverallCard
            title="Products"
            value={String(
              totalProducts
            )}
            description="Total registered products"
            href="/dashboard/product"
            icon={
              <Package
                size={22}
              />
            }
          />

          {/* SALES */}

          <OverallCard
            title="Sales"
            value={formatCurrency(
              totalSales
            )}
            description={`${totalInvoices} total invoices`}
            href="/dashboard/sales"
            icon={
              <ReceiptText
                size={22}
              />
            }
          />

          {/* SUPPLIERS */}

          <OverallCard
            title="Suppliers"
            value={String(
              totalSuppliers
            )}
            description="Total registered suppliers"
            href="/dashboard/suppliers"
            icon={
              <Truck
                size={22}
              />
            }
          />
        </div>

        {/* =============================================
            SALES OVERVIEW
        ============================================= */}

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Sales Overview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Real sales performance over the last 7 days.
              </p>
            </div>

            <Link
              href="/dashboard/sales"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View Sales

              <ArrowRight
                size={16}
              />
            </Link>
          </div>

          {/* CHART */}

          <div className="mt-8">
            <div className="flex h-64 items-end gap-3 rounded-xl bg-slate-50 p-5">
              {last7Days.map(
                (day) => {
                  const percentage =
                    day.total > 0
                      ? Math.max(
                          5,
                          (day.total /
                            maxDaySales) *
                            100
                        )
                      : 2;

                  return (
                    <div
                      key={
                        day.key
                      }
                      className="flex h-full flex-1 flex-col items-center justify-end"
                    >
                      <p className="mb-2 hidden text-xs font-semibold text-slate-500 md:block">
                        {day.total > 0
                          ? formatCurrency(
                              day.total
                            )
                          : ""}
                      </p>

                      <div className="flex h-full w-full items-end justify-center">
                        <div
                          className="w-full max-w-16 rounded-t-lg bg-blue-500 transition hover:bg-blue-600"
                          style={{
                            height: `${percentage}%`,
                          }}
                          title={`${day.label}: ${formatCurrency(
                            day.total
                          )}`}
                        />
                      </div>

                      <span className="mt-3 text-xs font-semibold text-slate-500">
                        {day.label}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {/* =============================================
            RECENT SALES + LOW STOCK
        ============================================= */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* RECENT SALES */}

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="font-bold text-slate-900">
                  Recent Sales
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Latest invoices from PostgreSQL.
                </p>
              </div>

              <Link
                href="/dashboard/sales"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View All
              </Link>
            </div>

            {recentSales.length ===
            0 ? (
              <div className="p-8 text-center">
                <ShoppingCart
                  size={32}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm text-slate-500">
                  No sales yet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentSales.map(
                  (invoice) => (
                    <Link
                      key={Number(
                        invoice.id
                      )}
                      href="/dashboard/sales"
                      className="flex items-center justify-between gap-4 p-4 transition hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">
                          {String(
                            invoice.invoiceNumber
                          )}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {String(
                            invoice.customerName ||
                              "Walk-in Customer"
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(
                            invoice.createdAt
                          )}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-slate-900">
                          {formatCurrency(
                            numberValue(
                              invoice.total
                            )
                          )}
                        </p>

                        <div className="mt-2">
                          <StatusBadge
                            status={
                              invoice.status
                            }
                          />
                        </div>
                      </div>
                    </Link>
                  )
                )}
              </div>
            )}
          </div>

          {/* LOW STOCK */}

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="font-bold text-slate-900">
                  Low Stock
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Products that need your attention.
                </p>
              </div>

              <Link
                href="/dashboard/inventory"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View Inventory
              </Link>
            </div>

            {lowStockProducts.length ===
            0 ? (
              <div className="p-8 text-center">
                <Package
                  size={32}
                  className="mx-auto text-emerald-400"
                />

                <p className="mt-3 font-semibold text-emerald-600">
                  Stock looks good
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  No low stock products right now.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {lowStockProducts.map(
                  (product) => (
                    <Link
                      key={
                        product.id
                      }
                      href="/dashboard/inventory"
                      className="flex items-center justify-between gap-4 p-4 transition hover:bg-slate-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                          <AlertTriangle
                            size={
                              19
                            }
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {
                              product.name
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Low stock warning
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-amber-600">
                          {product.stock.toLocaleString(
                            "en-PK",
                            {
                              maximumFractionDigits:
                                2,
                            }
                          )}{" "}
                          {
                            product.unit
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          remaining
                        </p>
                      </div>
                    </Link>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}