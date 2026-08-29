"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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
    refreshing,
    setRefreshing,
  ] =
    useState(false);

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

  async function loadCustomers(
    refresh = false
  ) {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

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
      setRefreshing(false);
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
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to load history."
      );

      setShowHistory(
        false
      );
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
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HEADER */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Wholesale Customers
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Only wholesale customers and their credit history.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                void loadCustomers(
                  true
                )
              }
              disabled={
                refreshing
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
            >
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <button
              type="button"
              onClick={
                addWholesaleCustomer
              }
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              + Add Wholesale Customer
            </button>
          </div>
        </div>

        {/* INFO */}

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
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

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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

        {/* TABLE */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1500px]">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <TableHead>
                    Customer
                  </TableHead>

                  <TableHead>
                    Phone
                  </TableHead>

                  <TableHead>
                    Invoices
                  </TableHead>

                  <TableHead>
                    Total Sales
                  </TableHead>

                  <TableHead>
                    Initial Paid
                  </TableHead>

                  <TableHead>
                    Received
                  </TableHead>

                  <TableHead>
                    Total Paid
                  </TableHead>

                  <TableHead>
                    Remaining
                  </TableHead>

                  <TableHead>
                    Change
                  </TableHead>

                  <TableHead>
                    Last Purchase
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead>
                    Actions
                  </TableHead>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={
                        12
                      }
                      className="px-6 py-16 text-center text-sm text-slate-500"
                    >
                      Loading customers...
                    </td>
                  </tr>
                ) : filteredCustomers.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={
                        12
                      }
                      className="px-6 py-16 text-center text-sm text-slate-500"
                    >
                      No wholesale customers yet.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map(
                    (customer) => (
                      <tr
                        key={
                          customer.id
                        }
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-900">
                            {
                              customer.name
                            }
                          </p>

                          <p className="text-xs text-slate-500">
                            Customer #
                            {
                              customer.id
                            }
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm font-medium">
                          {
                            customer.phone
                          }
                        </td>

                        <td className="px-5 py-4 font-bold">
                          {
                            customer.invoiceCount
                          }
                        </td>

                        <td className="px-5 py-4 font-bold">
                          {formatCurrency(
                            customer.totalSales
                          )}
                        </td>

                        <td className="px-5 py-4 font-bold text-emerald-700">
                          {formatCurrency(
                            customer.initialPaid
                          )}
                        </td>

                        <td className="px-5 py-4 font-bold text-blue-700">
                          {formatCurrency(
                            customer.receivedAmount
                          )}
                        </td>

                        <td className="px-5 py-4 font-bold text-emerald-700">
                          {formatCurrency(
                            customer.totalPaid
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={
                              customer.receivable >
                              0
                                ? "font-bold text-red-600"
                                : "font-bold text-slate-600"
                            }
                          >
                            {formatCurrency(
                              customer.receivable
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-bold text-violet-700">
                          {formatCurrency(
                            customer.changeAmount
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {formatDate(
                            customer.lastPurchase
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge
                            status={
                              customer.paymentStatus
                            }
                          />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                newInvoice(
                                  customer
                                )
                              }
                              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
                            >
                              New Invoice
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void viewHistory(
                                  customer
                                )
                              }
                              className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                            >
                              History
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* HISTORY */}

      {showHistory &&
        selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="max-h-[92vh] w-full max-w-7xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
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

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      newInvoice(
                        selectedCustomer
                      )
                    }
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
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

              <div className="p-6">
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

                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full min-w-[1250px]">
                        <thead className="bg-slate-50">
                          <tr>
                            <TableHead>
                              Invoice
                            </TableHead>

                            <TableHead>
                              Date
                            </TableHead>

                            <TableHead>
                              Total
                            </TableHead>

                            <TableHead>
                              Initial Paid
                            </TableHead>

                            <TableHead>
                              Received Later
                            </TableHead>

                            <TableHead>
                              Total Paid
                            </TableHead>

                            <TableHead>
                              Remaining
                            </TableHead>

                            <TableHead>
                              Change
                            </TableHead>

                            <TableHead>
                              Status
                            </TableHead>
                          </tr>
                        </thead>

                        <tbody>
                          {selectedCustomer.invoices.length ===
                          0 ? (
                            <tr>
                              <td
                                colSpan={
                                  9
                                }
                                className="p-12 text-center text-slate-500"
                              >
                                No wholesale invoices.
                              </td>
                            </tr>
                          ) : (
                            selectedCustomer.invoices.map(
                              (
                                invoice
                              ) => (
                                <tr
                                  key={
                                    invoice.id
                                  }
                                  className="border-t border-slate-100"
                                >
                                  <td className="px-5 py-4 font-bold">
                                    {
                                      invoice.invoiceNumber
                                    }
                                  </td>

                                  <td className="px-5 py-4">
                                    {formatDate(
                                      invoice.createdAt
                                    )}
                                  </td>

                                  <td className="px-5 py-4 font-bold">
                                    {formatCurrency(
                                      invoice.total
                                    )}
                                  </td>

                                  <td className="px-5 py-4 font-bold text-emerald-700">
                                    {formatCurrency(
                                      invoice.initialPaid
                                    )}
                                  </td>

                                  <td className="px-5 py-4 font-bold text-blue-700">
                                    {formatCurrency(
                                      invoice.receivedAmount
                                    )}
                                  </td>

                                  <td className="px-5 py-4 font-bold text-emerald-700">
                                    {formatCurrency(
                                      invoice.totalPaid
                                    )}
                                  </td>

                                  <td className="px-5 py-4 font-bold text-red-600">
                                    {formatCurrency(
                                      invoice.remainingBalance
                                    )}
                                  </td>

                                  <td className="px-5 py-4 font-bold text-violet-700">
                                    {formatCurrency(
                                      invoice.changeAmount
                                    )}
                                  </td>

                                  <td className="px-5 py-4">
                                    <StatusBadge
                                      status={
                                        invoice.status
                                      }
                                    />
                                  </td>
                                </tr>
                              )
                            )
                          )}
                        </tbody>
                      </table>
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
    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
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