"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import SalesHeader from "./salesHeader";
import SalesStats from "./salesStats";
import SalesTable from "./salesTable";
import SaleModal from "./saleModal";
import ReceivePaymentModal from "./receivePaymentModal";

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

  /* ADMIN ONLY */

  purchasePrice: number;

  costAmount: number;

  profitAmount: number;
};

export type SalePayment = {
  id: number;

  method: PaymentMethod;

  amount: number;

  createdAt?: string;
};

export type Sale = {
  id: number;

  invoiceNo: string;

  date: string;

  customerId: number;

  customerName: string;

  customerPhone: string;

  items: SaleItem[];

  payments: SalePayment[];

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

  /* ADMIN ONLY */

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

  createdAt?: string;
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
      String(
        value
      )
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
   CURRENCY
===================================================== */

function formatCurrency(
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

  /* =================================================
     TOTALS
  ================================================= */

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

  const status =
    normalizeStatus(
      raw.status
    );

  /* =================================================
     PAYMENTS
  ================================================= */

  const rawPayments =
    Array.isArray(
      raw.payments
    )
      ? raw.payments
      : [];

  const normalizedPayments:
    SalePayment[] =
    rawPayments
      .map(
        (
          payment
        ) => {
          const amount =
            Math.max(
              0,
              Number(
                payment.amount
              ) || 0
            );

          const method =
            normalizePaymentMethod(
              payment.method,
              amount > 0
                ? "Partial"
                : "Unpaid"
            );

          return {
            id:
              Number(
                payment.id
              ) || 0,

            method,

            amount,

            createdAt:
              payment.createdAt,
          };
        }
      )
      .filter(
        (
          payment
        ) =>
          payment.amount >
          0
      )
      .sort(
        (
          a,
          b
        ) =>
          b.id -
          a.id
      );

  const latestPayment =
    normalizedPayments[0];

  /* =================================================
     CHANGE = LATEST RECEIVE PAYMENT

     Business rule:

     Payment #1 = initial invoice payment
     Payment #2+ = later Receive Payment

     Example:

     Grand Total  = 30,000
     Initial Paid = 20,000
     Receive Now  = 5,000

     Change       = 5,000
  ================================================= */

  const savedChangeAmount =
    Math.max(
      0,
      Number(
        raw.changeAmount
      ) || 0
    );

  const latestReceivePayment =
    normalizedPayments.length > 1
      ? normalizedPayments[0].amount
      : 0;

  const changeAmount =
    latestReceivePayment > 0
      ? latestReceivePayment
      : normalizedPayments.length > 1
        ? savedChangeAmount
        : 0;

  const paymentMethod =
    latestPayment
      ? latestPayment.method
      : normalizePaymentMethod(
          undefined,
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
      (
        item
      ) => {
        const rawUnit =
          String(
            item.unit ||
              "PCS"
          ).toUpperCase();

        const unit:
          | "KG"
          | "PCS" =
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

          /* ADMIN ONLY */

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

  /* =================================================
     FINAL SALE
  ================================================= */

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

    payments:
      normalizedPayments,

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

  /* =================================================
     SALES
  ================================================= */

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
    useState(
      true
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  /* =================================================
     FILTERS
  ================================================= */

  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState(
      "All"
    );

  /* =================================================
     VIEW SALE
  ================================================= */

  const [
    selectedSale,
    setSelectedSale,
  ] =
    useState<Sale | null>(
      null
    );

  /* =================================================
     EDIT SALE
  ================================================= */

  const [
    editingSale,
    setEditingSale,
  ] =
    useState<Sale | null>(
      null
    );

  /* =================================================
     RECEIVE PAYMENT
  ================================================= */

  const [
    receivingPaymentSale,
    setReceivingPaymentSale,
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

          setError(
            ""
          );

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

  useEffect(
    () => {
      void loadSales();
    },
    [
      loadSales,
    ]
  );

  /* =====================================================
     STATS
  ===================================================== */

  const totalSales =
    useMemo(
      () =>
        sales.reduce(
          (
            total,
            sale
          ) =>
            total +
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
            total,
            sale
          ) =>
            total +
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
            total,
            sale
          ) =>
            total +
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
            total,
            sale
          ) =>
            total +
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
     VIEW SALE
  ===================================================== */

  function handleView(
    sale: Sale
  ) {
    setSelectedSale(
      sale
    );
  }

  /* =====================================================
     EDIT SALE
  ===================================================== */

  function handleEdit(
    sale: Sale
  ) {
    setSelectedSale(
      null
    );

    setEditingSale(
      sale
    );
  }

  async function handleSaleUpdated() {
    setEditingSale(
      null
    );

    setSelectedSale(
      null
    );

    await loadSales();
  }

  /* =====================================================
     RECEIVE PAYMENT
  ===================================================== */

  function handleReceivePayment(
    sale: Sale
  ) {
    if (
      sale.remainingAmount <=
      0
    ) {
      alert(
        `${sale.invoiceNo} is already fully paid.`
      );

      return;
    }

    setSelectedSale(
      null
    );

    setReceivingPaymentSale(
      sale
    );
  }

  async function handlePaymentSuccess() {
    setReceivingPaymentSale(
      null
    );

    setSelectedSale(
      null
    );

    await loadSales();
  }

  /* =====================================================
     DELETE SALE
  ===================================================== */

  async function handleDelete(
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

    const confirmed =
      window.confirm(
        `Delete ${sale.invoiceNo}?\n\nSold stock will be restored automatically. This action cannot be undone.`
      );

    if (
      !confirmed
    ) {
      return;
    }

    try {
      const response =
        await fetch(
          `/api/invoices/${sale.id}`,
          {
            method:
              "DELETE",
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

      const data =
        (await response.json()) as {
          message?: string;
        };

      setSales(
        (
          currentSales
        ) =>
          currentSales.filter(
            (
              item
            ) =>
              item.id !==
              id
          )
      );

      setSelectedSale(
        (
          currentSale
        ) =>
          currentSale?.id ===
          id
            ? null
            : currentSale
      );

      setEditingSale(
        (
          currentSale
        ) =>
          currentSale?.id ===
          id
            ? null
            : currentSale
      );

      setReceivingPaymentSale(
        (
          currentSale
        ) =>
          currentSale?.id ===
          id
            ? null
            : currentSale
      );

      alert(
        data.message ||
          `${sale.invoiceNo} deleted successfully. Stock restored.`
      );
    } catch (error) {
      console.error(
        "DELETE SALE ERROR:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Unable to delete sale."
      );
    }
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">

      <div className="mx-auto max-w-7xl space-y-6">

        {/* HEADER */}

        <SalesHeader
          onAdd={
            handleAdd
          }
        />

        {/* ERROR */}

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

        {/* LOADING */}

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

            {/* STATS */}

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

            {/* TABLE */}

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

      {/* ===============================================
          VIEW SALE MODAL
      =============================================== */}

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
          onReceivePayment={() =>
            handleReceivePayment(
              selectedSale
            )
          }
        />

      )}

      {/* ===============================================
          EDIT SALE MODAL
      =============================================== */}

      {editingSale && (

        <SaleModal
          sale={
            editingSale
          }
          onClose={() =>
            setEditingSale(
              null
            )
          }
          onUpdated={
            handleSaleUpdated
          }
        />

      )}

      {/* ===============================================
          RECEIVE PAYMENT MODAL
      =============================================== */}

      {receivingPaymentSale && (

        <ReceivePaymentModal
          sale={
            receivingPaymentSale
          }
          onClose={() =>
            setReceivingPaymentSale(
              null
            )
          }
          onSuccess={
            handlePaymentSuccess
          }
        />

      )}

    </div>
  );
}

/* =====================================================
   ADMIN SALE VIEW MODAL
===================================================== */

function SaleViewModal({
  sale,
  onClose,
  onReceivePayment,
}: {
  sale: Sale;

  onClose:
    () => void;

  onReceivePayment:
    () => void;
}) {
  function printInvoice() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div
        id="sales-print-invoice"
        className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-xl"
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-start justify-between border-b p-6">

          <div>

            <h2 className="text-2xl font-bold text-slate-900">
              Sale Details
            </h2>

            <p className="mt-1 font-bold text-blue-700">
              {sale.invoiceNo}
            </p>

          </div>

          <div className="text-right">

            <p className="font-bold text-slate-900">
              Hafiz Retail POS
            </p>

            <p className="text-xs text-slate-500">
              Admin Sales Record
            </p>

          </div>

        </div>

        {/* =================================================
            CUSTOMER
        ================================================= */}

        <div className="grid gap-4 border-b p-6 sm:grid-cols-2">

          <div>

            <p className="text-xs font-semibold text-slate-400">
              CUSTOMER
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {sale.customerName}
            </p>

            {sale.customerPhone && (

              <p className="text-sm text-slate-500">
                {sale.customerPhone}
              </p>

            )}

          </div>

          <div className="sm:text-right">

            <p className="text-xs font-semibold text-slate-400">
              DATE
            </p>

            <p className="mt-1 text-sm text-slate-700">
              {sale.date}
            </p>

          </div>

        </div>

        {/* =================================================
            ITEMS
        ================================================= */}

        <div className="p-6">

          <div className="overflow-x-auto rounded-xl border border-slate-200">

            <table className="w-full min-w-[800px]">

              <thead className="bg-slate-50">

                <tr>

                  <th className="p-3 text-left text-xs font-semibold text-slate-500">
                    Product
                  </th>

                  <th className="p-3 text-center text-xs font-semibold text-slate-500">
                    Qty
                  </th>

                  <th className="p-3 text-right text-xs font-semibold text-slate-500">
                    Sale Price
                  </th>

                  <th className="p-3 text-right text-xs font-semibold text-slate-500">
                    Purchase
                  </th>

                  <th className="p-3 text-right text-xs font-semibold text-slate-500">
                    Cost
                  </th>

                  <th className="p-3 text-right text-xs font-semibold text-slate-500">
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
                      className="border-t border-slate-100"
                    >

                      <td className="p-3 text-sm font-medium text-slate-900">
                        {item.productName}
                      </td>

                      <td className="p-3 text-center text-sm text-slate-700">
                        {item.quantity}{" "}
                        {item.unit}
                      </td>

                      <td className="p-3 text-right text-sm text-slate-700">
                        {formatCurrency(
                          item.price
                        )}
                      </td>

                      <td className="p-3 text-right text-sm text-slate-700">
                        {formatCurrency(
                          item.purchasePrice
                        )}
                      </td>

                      <td className="p-3 text-right text-sm text-slate-700">
                        {formatCurrency(
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
                        {formatCurrency(
                          item.profitAmount
                        )}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

          {/* =================================================
              ADMIN PROFIT
          ================================================= */}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <AdminCard
              title="Sale Amount"
              value={
                formatCurrency(
                  sale.grandTotal
                )
              }
            />

            <AdminCard
              title="Cost Amount"
              value={
                formatCurrency(
                  sale.costAmount
                )
              }
            />

            <AdminCard
              title="Profit"
              value={
                formatCurrency(
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

          {/* =================================================
              INVOICE PAYMENT TOTAL
          ================================================= */}

          <div className="ml-auto mt-6 max-w-sm space-y-3 rounded-2xl border border-slate-200 p-5">

            <InvoiceRow
              label="Subtotal"
              value={
                formatCurrency(
                  sale.subtotal
                )
              }
            />

            <InvoiceRow
              label="Discount"
              value={`- ${formatCurrency(
                sale.discount
              )}`}
            />

            <InvoiceRow
              label="Tax"
              value={
                formatCurrency(
                  sale.tax
                )
              }
            />

            <div className="flex justify-between border-t pt-3 text-lg font-bold">

              <span>
                Grand Total
              </span>

              <span>
                {formatCurrency(
                  sale.grandTotal
                )}
              </span>

            </div>

            <InvoiceRow
              label="Paid"
              value={
                formatCurrency(
                  sale.paidAmount
                )
              }
            />

            {/* =========================================
                REMAINING
            ========================================= */}

            <InvoiceRow
              label="Remaining"
              value={
                formatCurrency(
                  sale.remainingAmount
                )
              }
            />

            {/* =========================================
                CHANGE AMOUNT
            ========================================= */}

            <div
              className={`flex items-center justify-between rounded-xl px-3 py-3 ${
                sale.changeAmount > 0
                  ? "bg-emerald-50"
                  : "bg-slate-100"
              }`}
            >

              <span
                className={`text-sm font-semibold ${
                  sale.changeAmount > 0
                    ? "text-emerald-700"
                    : "text-slate-600"
                }`}
              >
                Change
              </span>

              <span
                className={`font-bold ${
                  sale.changeAmount > 0
                    ? "text-emerald-700"
                    : "text-slate-700"
                }`}
              >
                {formatCurrency(
                  sale.changeAmount
                )}
              </span>

            </div>

          </div>

          {/* =================================================
              PAYMENT STATUS
          ================================================= */}

          <div className="mt-5 rounded-xl bg-slate-50 p-4">

            <div className="flex justify-between gap-4">

              <span className="text-sm text-slate-500">
                Last Payment Method
              </span>

              <span className="font-semibold text-slate-900">
                {sale.paymentMethod}
              </span>

            </div>

            <div className="mt-3 flex justify-between gap-4">

              <span className="text-sm text-slate-500">
                Status
              </span>

              <StatusBadge
                status={
                  sale.status
                }
              />

            </div>

          </div>

          {/* =================================================
              PAYMENT HISTORY
          ================================================= */}

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">

            <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h3 className="font-bold text-slate-900">
                  Payment History
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  All payments received against this invoice.
                </p>

              </div>

              <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {sale.payments.length}{" "}
                {sale.payments.length ===
                1
                  ? "Payment"
                  : "Payments"}
              </span>

            </div>

            {sale.payments.length ===
            0 ? (

              <div className="p-5 text-sm text-slate-500">
                No payment received yet.
              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead className="bg-slate-50">

                    <tr>

                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                        #
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                        Payment Method
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                        Date
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">
                        Amount
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {sale.payments.map(
                      (
                        payment,
                        index
                      ) => (

                        <tr
                          key={
                            payment.id ||
                            index
                          }
                          className="border-t border-slate-100"
                        >

                          <td className="px-5 py-3 text-sm text-slate-600">
                            {index +
                            1}
                          </td>

                          <td className="px-5 py-3 text-sm font-semibold text-slate-800">
                            {payment.method}
                          </td>

                          <td className="px-5 py-3 text-sm text-slate-500">
                            {payment.createdAt
                              ? formatDate(
                                  payment.createdAt
                                )
                              : "-"}
                          </td>

                          <td className="px-5 py-3 text-right text-sm font-bold text-emerald-600">
                            {formatCurrency(
                              payment.amount
                            )}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

          {/* =================================================
              NOTES
          ================================================= */}

          {sale.notes && (

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Notes
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                {sale.notes}
              </p>

            </div>

          )}

        </div>

        {/* =================================================
            BUTTONS
        ================================================= */}

        <div className="flex flex-col gap-3 border-t p-6 print:hidden sm:flex-row">

          {sale.remainingAmount >
            0 && (

            <button
              type="button"
              onClick={
                onReceivePayment
              }
              className="flex-1 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              💰 Receive Payment
            </button>

          )}

          <button
            type="button"
            onClick={
              printInvoice
            }
            className="flex-1 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            🖨 Print Sale Record
          </button>

          <button
            type="button"
            onClick={
              onClose
            }
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>

        </div>

      </div>

      {/* =================================================
          PRINT CSS
      ================================================= */}

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
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-height: none !important;
            overflow: visible !important;
            box-shadow: none !important;
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
   INVOICE ROW
===================================================== */

function InvoiceRow({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div className="flex justify-between gap-4">

      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-right text-sm font-semibold text-slate-900">
        {value}
      </span>

    </div>
  );
}

/* =====================================================
   STATUS BADGE
===================================================== */

function StatusBadge({
  status,
}: {
  status: SaleStatus;
}) {
  const className =
    status ===
    "Paid"
      ? "bg-emerald-100 text-emerald-700"
      : status ===
          "Partial"
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${className}`}
    >
      {status}
    </span>
  );
}