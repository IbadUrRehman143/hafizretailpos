"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import SalesHeader from "./salesHeader";
import SalesStats from "./salesStats";
import SalesTable from "./salesTable";

/* =====================================================
   TYPES
===================================================== */

export type PaymentMethod =
  | "Cash"
  | "Bank"
  | "Credit"
  | "Other";

export type SaleStatus =
  | "Paid"
  | "Partial"
  | "Unpaid";

export type Customer = {
  id: number;
  name: string;
  phone: string;
};

export type Product = {
  id: number;
  name: string;
  category: string;
  unit: "KG" | "PCS";
  price: number;
};

export type SaleItem = {
  id?: number;

  productId: number;

  productName: string;

  quantity: number;

  unit: "KG" | "PCS";

  price: number;

  total: number;

  /*
   * ADMIN ONLY
   */

  purchasePrice: number;

  costAmount: number;

  profitAmount: number;
};

export type Sale = {
  id: number;

  invoiceNo: string;

  date: string;

  customerId: number;

  customerName: string;

  customerPhone: string;

  items: SaleItem[];

  subtotal: number;

  discount: number;

  tax: number;

  grandTotal: number;

  paidAmount: number;

  remainingAmount: number;

  changeAmount: number;

  paymentMethod: PaymentMethod;

  status: SaleStatus;

  notes: string;

  /*
   * ADMIN ONLY
   */

  costAmount: number;

  profitAmount: number;

  profitMargin: number;
};

/* =====================================================
   API TYPES
===================================================== */

type ApiInvoiceItem = {
  id?: number;

  productId?: number;

  productName?: string;

  productType?: string;

  unit?: string;

  quantity?: number;

  rate?: number;

  amount?: number;

  purchasePrice?: number;

  costAmount?: number;

  profitAmount?: number;
};

type ApiPayment = {
  id?: number;

  method?: string;

  amount?: number;
};

type ApiInvoice = {
  id?: number;

  invoiceNumber?: string;

  customerId?: number | null;

  customerName?: string;

  customerPhone?: string;

  subtotal?: number;

  tax?: number;

  total?: number;

  paidAmount?: number;

  remainingBalance?: number;

  changeAmount?: number;

  status?: string;

  finalized?: boolean;

  createdAt?: string;

  updatedAt?: string;

  notes?: string;

  items?: ApiInvoiceItem[];

  payments?: ApiPayment[];

  costAmount?: number;

  profitAmount?: number;

  profitMargin?: number;
};

/* =====================================================
   API ERROR
===================================================== */

async function getErrorMessage(
  response: Response
) {
  try {
    const data =
      (await response.json()) as {
        message?: string;
      };

    return (
      data.message ||
      "Something went wrong."
    );
  } catch {
    return "Something went wrong.";
  }
}

/* =====================================================
   STATUS
===================================================== */

function normalizeStatus(
  value: unknown
): SaleStatus {
  const status =
    String(
      value || ""
    ).toUpperCase();

  if (
    status === "PAID"
  ) {
    return "Paid";
  }

  if (
    status === "PARTIAL"
  ) {
    return "Partial";
  }

  return "Unpaid";
}

/* =====================================================
   PAYMENT METHOD
===================================================== */

function normalizePaymentMethod(
  value: unknown,
  status: SaleStatus
): PaymentMethod {
  const method =
    String(
      value || ""
    ).toLowerCase();

  if (
    method === "bank"
  ) {
    return "Bank";
  }

  if (
    method === "credit"
  ) {
    return "Credit";
  }

  if (
    method === "other"
  ) {
    return "Other";
  }

  if (
    method === "cash"
  ) {
    return "Cash";
  }

  if (
    status === "Unpaid"
  ) {
    return "Credit";
  }

  return "Cash";
}

/* =====================================================
   DATE FORMAT
===================================================== */

function formatDate(
  value: unknown
) {
  if (
    !value
  ) {
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
    return String(
      value
    );
  }

  return date.toLocaleString(
    "en-PK",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  );
}

/* =====================================================
   NORMALIZE SALE
===================================================== */

function normalizeSale(
  value: unknown
): Sale | null {
  if (
    typeof value !==
      "object" ||
    value === null
  ) {
    return null;
  }

  const raw =
    value as ApiInvoice;

  const id =
    Number(
      raw.id
    ) || 0;

  if (
    id <= 0
  ) {
    return null;
  }

  const subtotal =
    Math.max(
      0,
      Number(
        raw.subtotal
      ) || 0
    );

  const tax =
    Math.max(
      0,
      Number(
        raw.tax
      ) || 0
    );

  const grandTotal =
    Math.max(
      0,
      Number(
        raw.total
      ) || 0
    );

  const discount =
    Math.max(
      0,
      subtotal +
        tax -
        grandTotal
    );

  const paidAmount =
    Math.max(
      0,
      Number(
        raw.paidAmount
      ) || 0
    );

  const remainingAmount =
    Math.max(
      0,
      Number(
        raw.remainingBalance
      ) || 0
    );

  const changeAmount =
    Math.max(
      0,
      Number(
        raw.changeAmount
      ) || 0
    );

  const status =
    normalizeStatus(
      raw.status
    );

  /* =================================================
     PAYMENTS
  ================================================= */

  const payments =
    Array.isArray(
      raw.payments
    )
      ? raw.payments
      : [];

  const payment =
    payments[0];

  const paymentMethod =
    normalizePaymentMethod(
      payment?.method,
      status
    );

  /* =================================================
     ITEMS
  ================================================= */

  const rawItems =
    Array.isArray(
      raw.items
    )
      ? raw.items
      : [];

  const items:
    SaleItem[] =
    rawItems.map(
      (item) => {
        const rawUnit =
          String(
            item.unit ||
              "PCS"
          ).toUpperCase();

        const unit:
          "KG" | "PCS" =
          rawUnit ===
          "KG"
            ? "KG"
            : "PCS";

        return {
          id:
            Number(
              item.id
            ) || undefined,

          productId:
            Number(
              item.productId
            ) || 0,

          productName:
            String(
              item.productName ||
                "Product"
            ),

          quantity:
            Math.max(
              0,
              Number(
                item.quantity
              ) || 0
            ),

          unit,

          price:
            Math.max(
              0,
              Number(
                item.rate
              ) || 0
            ),

          total:
            Math.max(
              0,
              Number(
                item.amount
              ) || 0
            ),

          /* PRIVATE */

          purchasePrice:
            Math.max(
              0,
              Number(
                item.purchasePrice
              ) || 0
            ),

          costAmount:
            Math.max(
              0,
              Number(
                item.costAmount
              ) || 0
            ),

          profitAmount:
            Number(
              item.profitAmount
            ) || 0,
        };
      }
    );

  /* =================================================
     PROFIT
  ================================================= */

  const costAmount =
    Number.isFinite(
      Number(
        raw.costAmount
      )
    )
      ? Number(
          raw.costAmount
        )
      : items.reduce(
          (
            total,
            item
          ) =>
            total +
            item.costAmount,
          0
        );

  const profitAmount =
    Number.isFinite(
      Number(
        raw.profitAmount
      )
    )
      ? Number(
          raw.profitAmount
        )
      : items.reduce(
          (
            total,
            item
          ) =>
            total +
            item.profitAmount,
          0
        );

  const profitMargin =
    Number.isFinite(
      Number(
        raw.profitMargin
      )
    )
      ? Number(
          raw.profitMargin
        )
      : grandTotal >
          0
      ? (
          profitAmount /
          grandTotal
        ) *
        100
      : 0;

  return {
    id,

    invoiceNo:
      String(
        raw.invoiceNumber ||
          `INV-${String(
            id
          ).padStart(
            4,
            "0"
          )}`
      ),

    date:
      formatDate(
        raw.createdAt
      ),

    customerId:
      Number(
        raw.customerId
      ) || 0,

    customerName:
      String(
        raw.customerName ||
          "Walk-in Customer"
      ),

    customerPhone:
      String(
        raw.customerPhone ||
          ""
      ),

    items,

    subtotal,

    discount,

    tax,

    grandTotal,

    paidAmount,

    remainingAmount,

    changeAmount,

    paymentMethod,

    status,

    notes:
      String(
        raw.notes ||
          ""
      ),

    costAmount,

    profitAmount,

    profitMargin,
  };
}

/* =====================================================
   PAGE
===================================================== */

export default function SalesPage() {
  const router =
    useRouter();

  const [
    sales,
    setSales,
  ] =
    useState<Sale[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("All");

  const [
    selectedSale,
    setSelectedSale,
  ] =
    useState<Sale | null>(
      null
    );

  /* =====================================================
     LOAD SALES
  ===================================================== */

  const loadSales =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError("");

          const response =
            await fetch(
              "/api/invoices",
              {
                method:
                  "GET",

                cache:
                  "no-store",
              }
            );

          if (
            !response.ok
          ) {
            throw new Error(
              await getErrorMessage(
                response
              )
            );
          }

          const data:
            unknown =
            await response.json();

          if (
            !Array.isArray(
              data
            )
          ) {
            throw new Error(
              "Invalid invoices response."
            );
          }

          const cleanSales =
            data
              .map(
                normalizeSale
              )
              .filter(
                (
                  sale
                ): sale is Sale =>
                  sale !==
                  null
              )
              .sort(
                (
                  a,
                  b
                ) =>
                  b.id -
                  a.id
              );

          setSales(
            cleanSales
          );
        } catch (error) {
          console.error(
            "LOAD SALES ERROR:",
            error
          );

          setSales(
            []
          );

          setError(
            error instanceof
              Error
              ? error.message
              : "Unable to load sales."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    void loadSales();
  }, [
    loadSales,
  ]);

  /* =====================================================
     STATS
  ===================================================== */

  const totalSales =
    useMemo(
      () =>
        sales.reduce(
          (
            sum,
            sale
          ) =>
            sum +
            sale.grandTotal,
          0
        ),
      [
        sales,
      ]
    );

  const totalReceived =
    useMemo(
      () =>
        sales.reduce(
          (
            sum,
            sale
          ) =>
            sum +
            sale.paidAmount,
          0
        ),
      [
        sales,
      ]
    );

  const totalReceivable =
    useMemo(
      () =>
        sales.reduce(
          (
            sum,
            sale
          ) =>
            sum +
            sale.remainingAmount,
          0
        ),
      [
        sales,
      ]
    );

  const totalProfit =
    useMemo(
      () =>
        sales.reduce(
          (
            sum,
            sale
          ) =>
            sum +
            sale.profitAmount,
          0
        ),
      [
        sales,
      ]
    );

  /* =====================================================
     NEW SALE
  ===================================================== */

  function handleAdd() {
    router.push(
      "/dashboard/invoice"
    );
  }

  /* =====================================================
     VIEW
  ===================================================== */

  function handleView(
    sale: Sale
  ) {
    setSelectedSale(
      sale
    );
  }

  /* =====================================================
     EDIT
  ===================================================== */

  function handleEdit(
    sale: Sale
  ) {
    alert(
      `${sale.invoiceNo} edit system stock adjustment ke saath next step mein connect hoga.`
    );
  }

  /* =====================================================
     DELETE
  ===================================================== */

  function handleDelete(
    id: number
  ) {
    const sale =
      sales.find(
        (
          item
        ) =>
          item.id ===
          id
      );

    if (
      !sale
    ) {
      return;
    }

    alert(
      `${sale.invoiceNo} delete/cancel stock restore ke saath next step mein connect hoga.`
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">

      <div className="mx-auto max-w-7xl space-y-6">

        <SalesHeader
          onAdd={
            handleAdd
          }
        />

        {error && (

          <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-sm font-semibold text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadSales()
              }
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>

          </div>

        )}

        {loading ? (

          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">

            <p className="font-semibold text-slate-700">
              Loading sales...
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Reading invoices and profit from PostgreSQL
            </p>

          </div>

        ) : (

          <>
            <SalesStats
              totalSales={
                totalSales
              }
              totalReceived={
                totalReceived
              }
              totalReceivable={
                totalReceivable
              }
              totalProfit={
                totalProfit
              }
              totalInvoices={
                sales.length
              }
            />

            <SalesTable
              sales={
                sales
              }
              search={
                search
              }
              setSearch={
                setSearch
              }
              statusFilter={
                statusFilter
              }
              setStatusFilter={
                setStatusFilter
              }
              onView={
                handleView
              }
              onEdit={
                handleEdit
              }
              onDelete={
                handleDelete
              }
            />
          </>

        )}

      </div>

      {selectedSale && (

        <SaleViewModal
          sale={
            selectedSale
          }
          onClose={() =>
            setSelectedSale(
              null
            )
          }
        />

      )}

    </div>
  );
}

/* =====================================================
   ADMIN SALE VIEW
===================================================== */

function SaleViewModal({
  sale,
  onClose,
}: {
  sale: Sale;

  onClose:
    () => void;
}) {
  function currency(
    value: number
  ) {
    return `Rs. ${Number(
      value || 0
    ).toLocaleString(
      "en-PK",
      {
        maximumFractionDigits:
          2,
      }
    )}`;
  }

  function printInvoice() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div
        id="sales-print-invoice"
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-xl"
      >

        {/* HEADER */}

        <div className="flex items-start justify-between border-b p-6">

          <div>

            <h2 className="text-2xl font-bold">
              Sale Details
            </h2>

            <p className="mt-1 font-bold text-blue-700">
              {sale.invoiceNo}
            </p>

          </div>

          <div className="text-right">

            <p className="font-bold">
              Hafiz Retail POS
            </p>

            <p className="text-xs text-slate-500">
              Admin Sales Record
            </p>

          </div>

        </div>

        {/* CUSTOMER */}

        <div className="grid grid-cols-2 gap-4 border-b p-6">

          <div>

            <p className="text-xs font-semibold text-slate-400">
              CUSTOMER
            </p>

            <p className="mt-1 font-semibold">
              {sale.customerName}
            </p>

            {sale.customerPhone && (

              <p className="text-sm text-slate-500">
                {sale.customerPhone}
              </p>

            )}

          </div>

          <div className="text-right">

            <p className="text-xs font-semibold text-slate-400">
              DATE
            </p>

            <p className="mt-1 text-sm">
              {sale.date}
            </p>

          </div>

        </div>

        {/* ITEMS */}

        <div className="p-6">

          <div className="overflow-x-auto rounded-xl border">

            <table className="w-full min-w-200">

              <thead className="bg-slate-50">

                <tr>

                  <th className="p-3 text-left text-xs">
                    Product
                  </th>

                  <th className="p-3 text-center text-xs">
                    Qty
                  </th>

                  <th className="p-3 text-right text-xs">
                    Sale Price
                  </th>

                  <th className="p-3 text-right text-xs">
                    Purchase
                  </th>

                  <th className="p-3 text-right text-xs">
                    Cost
                  </th>

                  <th className="p-3 text-right text-xs">
                    Profit
                  </th>

                </tr>

              </thead>

              <tbody>

                {sale.items.map(
                  (
                    item,
                    index
                  ) => (

                    <tr
                      key={`${item.productId}-${index}`}
                      className="border-t"
                    >

                      <td className="p-3 text-sm">
                        {item.productName}
                      </td>

                      <td className="p-3 text-center text-sm">
                        {item.quantity}{" "}
                        {item.unit}
                      </td>

                      <td className="p-3 text-right text-sm">
                        {currency(
                          item.price
                        )}
                      </td>

                      <td className="p-3 text-right text-sm">
                        {currency(
                          item.purchasePrice
                        )}
                      </td>

                      <td className="p-3 text-right text-sm">
                        {currency(
                          item.costAmount
                        )}
                      </td>

                      <td
                        className={`p-3 text-right text-sm font-bold ${
                          item.profitAmount >=
                          0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {currency(
                          item.profitAmount
                        )}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

          {/* ADMIN PROFIT */}

          <div className="mt-6 grid gap-4 md:grid-cols-4">

            <AdminCard
              title="Sale Amount"
              value={
                currency(
                  sale.grandTotal
                )
              }
            />

            <AdminCard
              title="Cost Amount"
              value={
                currency(
                  sale.costAmount
                )
              }
            />

            <AdminCard
              title="Profit"
              value={
                currency(
                  sale.profitAmount
                )
              }
              profit={
                sale.profitAmount
              }
            />

            <AdminCard
              title="Profit Margin"
              value={`${sale.profitMargin.toFixed(
                2
              )}%`}
              profit={
                sale.profitAmount
              }
            />

          </div>

          {/* PAYMENT */}

          <div className="ml-auto mt-6 max-w-sm space-y-3">

            <InvoiceRow
              label="Subtotal"
              value={
                currency(
                  sale.subtotal
                )
              }
            />

            <InvoiceRow
              label="Discount"
              value={`- ${currency(
                sale.discount
              )}`}
            />

            <InvoiceRow
              label="Tax"
              value={
                currency(
                  sale.tax
                )
              }
            />

            <div className="flex justify-between border-t pt-3 text-lg font-bold">

              <span>
                Grand Total
              </span>

              <span>
                {currency(
                  sale.grandTotal
                )}
              </span>

            </div>

            <InvoiceRow
              label="Paid"
              value={
                currency(
                  sale.paidAmount
                )
              }
            />

            <InvoiceRow
              label="Remaining"
              value={
                currency(
                  sale.remainingAmount
                )
              }
            />

          </div>

          <div className="mt-5 rounded-xl bg-slate-50 p-4">

            <div className="flex justify-between">

              <span className="text-sm text-slate-500">
                Payment Method
              </span>

              <span className="font-semibold">
                {sale.paymentMethod}
              </span>

            </div>

            <div className="mt-2 flex justify-between">

              <span className="text-sm text-slate-500">
                Status
              </span>

              <span className="font-semibold">
                {sale.status}
              </span>

            </div>

          </div>

        </div>

        {/* BUTTONS */}

        <div className="flex gap-3 border-t p-6 print:hidden">

          <button
            type="button"
            onClick={
              printInvoice
            }
            className="flex-1 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            🖨 Print Sale Record
          </button>

          <button
            type="button"
            onClick={
              onClose
            }
            className="rounded-xl border px-5 py-3 text-sm font-semibold"
          >
            Close
          </button>

        </div>

      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          body * {
            visibility: hidden;
          }

          #sales-print-invoice,
          #sales-print-invoice * {
            visibility: visible;
          }

          #sales-print-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

    </div>
  );
}

/* =====================================================
   ADMIN CARD
===================================================== */

function AdminCard({
  title,
  value,
  profit,
}: {
  title: string;

  value: string;

  profit?: number;
}) {
  const hasProfit =
    typeof profit ===
    "number";

  const positive =
    !hasProfit ||
    profit >= 0;

  return (
    <div
      className={`rounded-xl border p-4 ${
        hasProfit
          ? positive
            ? "border-emerald-200 bg-emerald-50"
            : "border-red-200 bg-red-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <p className="text-xs font-semibold text-slate-500">
        {title}
      </p>

      <p
        className={`mt-1 text-lg font-bold ${
          hasProfit
            ? positive
              ? "text-emerald-700"
              : "text-red-700"
            : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/* =====================================================
   ROW
===================================================== */

function InvoiceRow({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div className="flex justify-between">

      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-sm font-semibold">
        {value}
      </span>

    </div>
  );
}