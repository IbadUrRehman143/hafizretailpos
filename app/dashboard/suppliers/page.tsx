"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type PaymentStatus = "PAID" | "PARTIAL" | "UNPAID";

type Customer = {
  id: number;
  name: string;
  phone: string;

  invoiceCount: number;

  totalSales: number;

  initialPaid: number;
  receivedAmount: number;
  totalPaid: number;

  receivable: number;
  changeAmount: number;

  lastPurchase: string | null;

  paymentStatus: PaymentStatus;
};

type CustomerInvoice = {
  id: number;
  invoiceNumber: string;

  total: number;

  initialPaid: number;
  receivedAmount: number;
  totalPaid: number;

  remainingBalance: number;
  changeAmount: number;

  paymentMethod: string;
  status: PaymentStatus;

  createdAt: string;
};

type CustomerDetails = Customer & {
  invoices: CustomerInvoice[];
};

type ApiRecord = Record<string, unknown>;

function isRecord(
  value: unknown
): value is ApiRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function numberValue(
  value: unknown
) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function stringValue(
  value: unknown,
  fallback = ""
) {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  return String(value);
}

function formatCurrency(
  value: number
) {
  return `Rs. ${numberValue(
    value
  ).toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(
  value: string | null | undefined
) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleDateString(
    "en-PK",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function normalizeStatus(
  value: unknown
): PaymentStatus {
  const status = String(
    value || ""
  ).toUpperCase();

  if (status === "PAID") {
    return "PAID";
  }

  if (status === "PARTIAL") {
    return "PARTIAL";
  }

  return "UNPAID";
}

function normalizeCustomer(
  value: unknown
): Customer {
  const raw = isRecord(value)
    ? value
    : {};

  return {
    id: numberValue(raw.id),

    name: stringValue(
      raw.name,
      "Unknown Customer"
    ),

    phone: stringValue(
      raw.phone
    ),

    invoiceCount:
      numberValue(
        raw.invoiceCount
      ),

    totalSales:
      numberValue(
        raw.totalSales
      ),

    initialPaid:
      numberValue(
        raw.initialPaid
      ),

    receivedAmount:
      numberValue(
        raw.receivedAmount
      ),

    totalPaid:
      numberValue(
        raw.totalPaid
      ),

    receivable:
      numberValue(
        raw.receivable
      ),

    changeAmount:
      numberValue(
        raw.changeAmount
      ),

    lastPurchase:
      raw.lastPurchase
        ? String(
            raw.lastPurchase
          )
        : null,

    paymentStatus:
      normalizeStatus(
        raw.paymentStatus
      ),
  };
}

function normalizeInvoice(
  value: unknown
): CustomerInvoice {
  const raw = isRecord(value)
    ? value
    : {};

  return {
    id:
      numberValue(
        raw.id
      ),

    invoiceNumber:
      stringValue(
        raw.invoiceNumber,
        "-"
      ),

    total:
      numberValue(
        raw.total
      ),

    initialPaid:
      numberValue(
        raw.initialPaid
      ),

    receivedAmount:
      numberValue(
        raw.receivedAmount
      ),

    totalPaid:
      numberValue(
        raw.totalPaid ??
          raw.paidAmount
      ),

    remainingBalance:
      numberValue(
        raw.remainingBalance
      ),

    changeAmount:
      numberValue(
        raw.changeAmount
      ),

    paymentMethod:
      stringValue(
        raw.paymentMethod,
        "Cash"
      ),

    status:
      normalizeStatus(
        raw.status
      ),

    createdAt:
      stringValue(
        raw.createdAt
      ),
  };
}

async function readApi(
  response: Response
): Promise<ApiRecord> {
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  try {
    const parsed: unknown =
      JSON.parse(text);

    return isRecord(parsed)
      ? parsed
      : {};
  } catch {
    throw new Error(
      `Invalid server response (${response.status}).`
    );
  }
}

export default function CustomersPage() {
  const router = useRouter();

  const [
    customers,
    setCustomers,
  ] =
    useState<Customer[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);
const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      "ALL" | PaymentStatus
    >("ALL");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    selectedCustomer,
    setSelectedCustomer,
  ] =
    useState<CustomerDetails | null>(
      null
    );

  const [
    showHistory,
    setShowHistory,
  ] =
    useState(false);

  const [
    historyLoading,
    setHistoryLoading,
  ] =
    useState(false);

  async function loadCustomers() {
    try {
      setLoading(true);

      setError("");

      const response =
        await fetch(
          "/api/customers",
          {
            cache: "no-store",
          }
        );

      const data =
        await readApi(
          response
        );

      if (
        !response.ok ||
        data.success === false
      ) {
        throw new Error(
          stringValue(
            data.message ??
              data.error,
            "Failed to load customers."
          )
        );
      }

      const values =
        Array.isArray(
          data.customers
        )
          ? data.customers
          : [];

      setCustomers(
        values
          .map(
            normalizeCustomer
          )
          .filter(
            (customer) =>
              customer.id > 0
          )
          .sort(
            (a, b) =>
              b.id - a.id
          )
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load customers."
      );
    } finally {
      setLoading(false);
}
  }

  useEffect(() => {
    void loadCustomers();
  }, []);

  function addWholesaleCustomer() {
    /*
      IMPORTANT:

      Customer pehle create
      nahi hoga.

      Direct Wholesale
      Invoice open hoga.

      Invoice save hone par
      customer create hoga.
    */

    window.location.href =
      "/dashboard/invoice?saleType=WHOLESALE";
  }

  function newInvoice(
    customer: Customer
  ) {
    const params =
      new URLSearchParams({
        saleType:
          "WHOLESALE",

        customerId:
          String(
            customer.id
          ),

        customerName:
          customer.name,

        customerPhone:
          customer.phone,
      });

    window.location.href =
      `/dashboard/invoice?${params.toString()}`;
  }

  async function viewHistory(
    customer: Customer
  ) {
    try {
      setSelectedCustomer({
        ...customer,
        invoices: [],
      });

      setShowHistory(
        true
      );

      setHistoryLoading(
        true
      );

      const response =
        await fetch(
          `/api/customers/${customer.id}`,
          {
            cache: "no-store",
          }
        );

      const data =
        await readApi(
          response
        );

      if (
        !response.ok ||
        data.success === false
      ) {
        throw new Error(
          stringValue(
            data.message ??
              data.error,
            "Unable to load history."
          )
        );
      }

      const rawCustomer =
        isRecord(
          data.customer
        )
          ? data.customer
          : {};

      const customerData =
        normalizeCustomer(
          rawCustomer
        );

      const invoices =
        Array.isArray(
          rawCustomer.invoices
        )
          ? rawCustomer.invoices.map(
              normalizeInvoice
            )
          : [];

      setSelectedCustomer({
        ...customerData,
        invoices,
      });
    } catch {
      setShowHistory(false);
    } finally {
      setHistoryLoading(
        false
      );
    }
  }

  const filteredCustomers =
    useMemo(() => {
      const text =
        search
          .trim()
          .toLowerCase();

      return customers.filter(
        (customer) => {
          const searchMatch =
            !text ||
            customer.name
              .toLowerCase()
              .includes(text) ||
            customer.phone.includes(
              text
            ) ||
            String(
              customer.id
            ).includes(text);

          const statusMatch =
            statusFilter ===
              "ALL" ||
            customer.paymentStatus ===
              statusFilter;

          return (
            searchMatch &&
            statusMatch
          );
        }
      );
    }, [
      customers,
      search,
      statusFilter,
    ]);

  const stats =
    useMemo(() => {
      return {
        customers:
          customers.length,

        sales:
          customers.reduce(
            (sum, item) =>
              sum +
              item.totalSales,
            0
          ),

        paid:
          customers.reduce(
            (sum, item) =>
              sum +
              item.initialPaid,
            0
          ),

        received:
          customers.reduce(
            (sum, item) =>
              sum +
              item.receivedAmount,
            0
          ),

        remaining:
          customers.reduce(
            (sum, item) =>
              sum +
              item.receivable,
            0
          ),
      };
    }, [customers]);

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-4 sm:space-y-6">
        {/* HEADER */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Back to Dashboard"
              title="Back to Dashboard"
            >
              <ArrowLeft size={19} />
            </button>

            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Wholesale Customers
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Only wholesale customers and their credit history.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={addWholesaleCustomer}
            className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 sm:w-auto"
          >
            + Add Wholesale Customer
          </button>
        </div>

        {/* INFO */}

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-5">
          <p className="font-bold text-blue-900">
            Wholesale Flow
          </p>

          <p className="mt-1 text-sm text-blue-700">
            Add Wholesale Customer par click karte hi Invoice Maker open
            hoga. Customer Name + 11 digit Phone + products + payment
            enter karein. Invoice save hote hi customer automatically
            Customers list aur Sales mein aa jayega.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* STATS */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-5">
          <StatCard
            label="Customers"
            value={
              stats.customers
            }
          />

          <StatCard
            label="Total Sales"
            value={formatCurrency(
              stats.sales
            )}
          />

          <StatCard
            label="Initial Paid"
            value={formatCurrency(
              stats.paid
            )}
          />

          <StatCard
            label="Received Later"
            value={formatCurrency(
              stats.received
            )}
          />

          <StatCard
            label="Remaining"
            value={formatCurrency(
              stats.remaining
            )}
            danger={
              stats.remaining > 0
            }
          />
        </div>

        {/* FILTER */}

        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px]">
          <input
            value={
              search
            }
            onChange={(
              event
            ) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search name, phone or customer ID..."
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />

          <select
            value={
              statusFilter
            }
            onChange={(
              event
            ) =>
              setStatusFilter(
                event.target
                  .value as
                  | "ALL"
                  | PaymentStatus
              )
            }
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
          >
            <option value="ALL">
              All Status
            </option>

            <option value="PAID">
              Paid
            </option>

            <option value="PARTIAL">
              Partial
            </option>

            <option value="UNPAID">
              Unpaid
            </option>
          </select>
        </div>

        {/* CUSTOMERS LIST */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="px-4 py-14 text-center text-sm text-slate-500 sm:px-6">
              Loading customers...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="px-4 py-14 text-center text-sm text-slate-500 sm:px-6">
              No wholesale customers yet.
            </div>
          ) : (
            <>
              {/* MOBILE / TABLET CARDS */}

              <div className="divide-y divide-slate-100 xl:hidden">
                {filteredCustomers.map(
                  (customer) => (
                    <div
                      key={customer.id}
                      className="p-4 sm:p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900">
                            {customer.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Customer #{customer.id}
                          </p>

                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {customer.phone || "No phone"}
                          </p>
                        </div>

                        <StatusBadge
                          status={customer.paymentStatus}
                        />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-400">
                            Invoices
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-900">
                            {customer.invoiceCount}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-400">
                            Total Sales
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-900">
                            {formatCurrency(customer.totalSales)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-emerald-50 p-3">
                          <p className="text-xs text-emerald-600">
                            Total Paid
                          </p>

                          <p className="mt-1 text-sm font-bold text-emerald-700">
                            {formatCurrency(customer.totalPaid)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-red-50 p-3">
                          <p className="text-xs text-red-500">
                            Remaining
                          </p>

                          <p className="mt-1 text-sm font-bold text-red-600">
                            {formatCurrency(customer.receivable)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-400">
                            Received Later
                          </p>

                          <p className="mt-1 text-sm font-bold text-blue-700">
                            {formatCurrency(customer.receivedAmount)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-400">
                            Last Purchase
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {formatDate(customer.lastPurchase)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            newInvoice(customer)
                          }
                          className="rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                        >
                          New Invoice
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void viewHistory(customer)
                          }
                          className="rounded-lg bg-blue-50 px-3 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                        >
                          History
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* DESKTOP TABLE */}

              <div className="hidden xl:block">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[10%]" />
                    <col className="w-[8%]" />
                    <col className="w-[6%]" />
                    <col className="w-[8%]" />
                    <col className="w-[8%]" />
                    <col className="w-[8%]" />
                    <col className="w-[8%]" />
                    <col className="w-[8%]" />
                    <col className="w-[7%]" />
                    <col className="w-[10%]" />
                    <col className="w-[7%]" />
                    <col className="w-[12%]" />
                  </colgroup>
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Invoices</TableHead>
                      <TableHead>Total Sales</TableHead>
                      <TableHead>Initial Paid</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead>Total Paid</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Change</TableHead>
                      <TableHead>Last Purchase</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCustomers.map(
                      (customer) => (
                        <tr
                          key={customer.id}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="px-3 py-4">
                            <p className="break-words text-[13px] font-bold leading-tight text-slate-900">
                              {customer.name}
                            </p>

                            <p className="text-xs text-slate-500">
                              Customer #{customer.id}
                            </p>
                          </td>

                          <td className="px-2.5 py-4 text-[13px] font-medium">
                            {customer.phone}
                          </td>

                          <td className="px-2.5 py-4 text-[13px] font-bold">
                            {customer.invoiceCount}
                          </td>

                          <td className="px-2.5 py-4 text-[13px] font-bold">
                            {formatCurrency(customer.totalSales)}
                          </td>

                          <td className="px-2.5 py-4 text-[13px] font-bold text-emerald-700">
                            {formatCurrency(customer.initialPaid)}
                          </td>

                          <td className="px-2.5 py-4 text-[13px] font-bold text-blue-700">
                            {formatCurrency(customer.receivedAmount)}
                          </td>

                          <td className="px-2.5 py-4 text-[13px] font-bold text-emerald-700">
                            {formatCurrency(customer.totalPaid)}
                          </td>

                          <td className="px-3 py-4">
                            <span
                              className={
                                customer.receivable > 0
                                  ? "font-bold text-red-600"
                                  : "font-bold text-slate-600"
                              }
                            >
                              {formatCurrency(customer.receivable)}
                            </span>
                          </td>

                          <td className="px-2.5 py-4 text-[13px] font-bold text-violet-700">
                            {formatCurrency(customer.changeAmount)}
                          </td>

                          <td className="px-2.5 py-4 text-[13px] text-slate-500">
                            {formatDate(customer.lastPurchase)}
                          </td>

                          <td className="px-3 py-4">
                            <StatusBadge
                              status={customer.paymentStatus}
                            />
                          </td>

                          <td className="px-3 py-4">
                            <div className="flex w-full gap-2 sm:w-auto">
                              <button
                                type="button"
                                onClick={() =>
                                  newInvoice(customer)
                                }
                                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
                              >
                                New Invoice
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void viewHistory(customer)
                                }
                                className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                              >
                                History
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* HISTORY */}

      {showHistory &&
        selectedCustomer && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-3 sm:flex sm:items-center sm:justify-center sm:p-4">
            <div className="mx-auto my-4 max-h-[94vh] w-full max-w-7xl overflow-y-auto rounded-2xl bg-white shadow-2xl sm:my-0 sm:rounded-3xl">
              <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
                <div>
                  <h2 className="text-xl font-bold">
                    {
                      selectedCustomer.name
                    }
                  </h2>

                  <p className="text-sm text-slate-500">
                    {
                      selectedCustomer.phone
                    }
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      newInvoice(
                        selectedCustomer
                      )
                    }
                    className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white sm:flex-none"
                  >
                    + New Invoice
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setShowHistory(
                        false
                      )
                    }
                    className="h-9 w-9 rounded-full bg-slate-100 font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                {historyLoading ? (
                  <div className="py-16 text-center">
                    Loading...
                  </div>
                ) : (
                  <>
                    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                      <StatCard
                        label="Invoices"
                        value={
                          selectedCustomer.invoiceCount
                        }
                      />

                      <StatCard
                        label="Sales"
                        value={formatCurrency(
                          selectedCustomer.totalSales
                        )}
                      />

                      <StatCard
                        label="Initial Paid"
                        value={formatCurrency(
                          selectedCustomer.initialPaid
                        )}
                      />

                      <StatCard
                        label="Received Later"
                        value={formatCurrency(
                          selectedCustomer.receivedAmount
                        )}
                      />

                      <StatCard
                        label="Total Paid"
                        value={formatCurrency(
                          selectedCustomer.totalPaid
                        )}
                      />

                      <StatCard
                        label="Remaining"
                        value={formatCurrency(
                          selectedCustomer.receivable
                        )}
                        danger={
                          selectedCustomer.receivable >
                          0
                        }
                      />
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                      {selectedCustomer.invoices.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                          No wholesale invoices.
                        </div>
                      ) : (
                        <>
                          <div className="divide-y divide-slate-100 xl:hidden">
                            {selectedCustomer.invoices.map(
                              (invoice) => (
                                <div
                                  key={invoice.id}
                                  className="p-4"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="break-words font-bold text-slate-900">
                                        {invoice.invoiceNumber}
                                      </p>

                                      <p className="mt-1 text-xs text-slate-500">
                                        {formatDate(invoice.createdAt)}
                                      </p>
                                    </div>

                                    <StatusBadge
                                      status={invoice.status}
                                    />
                                  </div>

                                  <div className="mt-4 grid grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-slate-50 p-3">
                                      <p className="text-xs text-slate-400">
                                        Total
                                      </p>

                                      <p className="mt-1 text-sm font-bold text-slate-900">
                                        {formatCurrency(invoice.total)}
                                      </p>
                                    </div>

                                    <div className="rounded-xl bg-emerald-50 p-3">
                                      <p className="text-xs text-emerald-600">
                                        Total Paid
                                      </p>

                                      <p className="mt-1 text-sm font-bold text-emerald-700">
                                        {formatCurrency(invoice.totalPaid)}
                                      </p>
                                    </div>

                                    <div className="rounded-xl bg-red-50 p-3">
                                      <p className="text-xs text-red-500">
                                        Remaining
                                      </p>

                                      <p className="mt-1 text-sm font-bold text-red-600">
                                        {formatCurrency(invoice.remainingBalance)}
                                      </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3">
                                      <p className="text-xs text-slate-400">
                                        Change
                                      </p>

                                      <p className="mt-1 text-sm font-bold text-violet-700">
                                        {formatCurrency(invoice.changeAmount)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>

                          <div className="hidden xl:block">
                            <table className="w-full table-fixed">
                              <thead className="bg-slate-50">
                                <tr>
                                  <TableHead>Invoice</TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Total</TableHead>
                                  <TableHead>Initial Paid</TableHead>
                                  <TableHead>Received Later</TableHead>
                                  <TableHead>Total Paid</TableHead>
                                  <TableHead>Remaining</TableHead>
                                  <TableHead>Change</TableHead>
                                  <TableHead>Status</TableHead>
                                </tr>
                              </thead>

                              <tbody>
                                {selectedCustomer.invoices.map(
                                  (invoice) => (
                                    <tr
                                      key={invoice.id}
                                      className="border-t border-slate-100"
                                    >
                                      <td className="px-2.5 py-4 text-[13px] font-bold">
                                        {invoice.invoiceNumber}
                                      </td>

                                      <td className="px-3 py-4">
                                        {formatDate(invoice.createdAt)}
                                      </td>

                                      <td className="px-2.5 py-4 text-[13px] font-bold">
                                        {formatCurrency(invoice.total)}
                                      </td>

                                      <td className="px-2.5 py-4 text-[13px] font-bold text-emerald-700">
                                        {formatCurrency(invoice.initialPaid)}
                                      </td>

                                      <td className="px-2.5 py-4 text-[13px] font-bold text-blue-700">
                                        {formatCurrency(invoice.receivedAmount)}
                                      </td>

                                      <td className="px-2.5 py-4 text-[13px] font-bold text-emerald-700">
                                        {formatCurrency(invoice.totalPaid)}
                                      </td>

                                      <td className="px-5 py-4 font-bold text-red-600">
                                        {formatCurrency(invoice.remainingBalance)}
                                      </td>

                                      <td className="px-2.5 py-4 text-[13px] font-bold text-violet-700">
                                        {formatCurrency(invoice.changeAmount)}
                                      </td>

                                      <td className="px-3 py-4">
                                        <StatusBadge
                                          status={invoice.status}
                                        />
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

function TableHead({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <th className="px-3 py-4 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function StatCard({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-xl font-bold ${
          danger
            ? "text-red-600"
            : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: PaymentStatus;
}) {
  if (status === "PAID") {
    return (
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
        Paid
      </span>
    );
  }

  if (
    status === "PARTIAL"
  ) {
    return (
      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
        Partial
      </span>
    );
  }

  return (
    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
      Unpaid
    </span>
  );
}