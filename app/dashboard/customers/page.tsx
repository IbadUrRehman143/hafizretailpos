"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

type CustomerType =
  | "Retail"
  | "Wholesale"
  | "Regular";

type CustomerStatus =
  | "Active"
  | "Inactive";

type Customer = {
  id: number;
  name: string;
  phone: string;
  whatsapp: string;
  address: string;
  type: CustomerType;
  openingBalance: number;
  creditLimit: number;
  status: CustomerStatus;

  totalSales: number;
  totalPaid: number;
  receivable: number;
  invoiceCount: number;

  lastPurchase?: string | null;
  paymentStatus?: string;
};

type CustomerPayment = {
  id: number;
  invoiceId: number;
  invoiceNumber: string;
  method: string;
  amount: number;
  createdAt: string;
};

type ApiRecord =
  Record<string, unknown>;

/* =========================================================
   HELPERS
========================================================= */

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
  const number =
    Number(value);

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

function normalizeType(
  value: unknown
): CustomerType {
  const type =
    stringValue(value)
      .trim()
      .toLowerCase();

  if (
    type === "wholesale"
  ) {
    return "Wholesale";
  }

  if (
    type === "retail"
  ) {
    return "Retail";
  }

  return "Regular";
}

function normalizeStatus(
  value: unknown
): CustomerStatus {
  return stringValue(
    value,
    "Active"
  )
    .trim()
    .toLowerCase() ===
    "inactive"
    ? "Inactive"
    : "Active";
}

function normalizeCustomer(
  value: unknown
): Customer {
  const raw =
    isRecord(value)
      ? value
      : {};

  return {
    id:
      numberValue(
        raw.id
      ),

    name:
      stringValue(
        raw.name,
        "Unknown Customer"
      ),

    phone:
      stringValue(
        raw.phone
      ),

    whatsapp:
      stringValue(
        raw.whatsapp
      ),

    address:
      stringValue(
        raw.address
      ),

    type:
      normalizeType(
        raw.type
      ),

    openingBalance:
      numberValue(
        raw.openingBalance
      ),

    creditLimit:
      numberValue(
        raw.creditLimit
      ),

    status:
      normalizeStatus(
        raw.status
      ),

    totalSales:
      numberValue(
        raw.totalSales
      ),

    totalPaid:
      numberValue(
        raw.totalPaid
      ),

    receivable:
      numberValue(
        raw.receivable
      ),

    invoiceCount:
      numberValue(
        raw.invoiceCount
      ),

    lastPurchase:
      raw.lastPurchase
        ? stringValue(
            raw.lastPurchase
          )
        : null,

    paymentStatus:
      stringValue(
        raw.paymentStatus
      ),
  };
}

function normalizePayment(
  value: unknown
): CustomerPayment {
  const raw =
    isRecord(value)
      ? value
      : {};

  return {
    id:
      numberValue(
        raw.id
      ),

    invoiceId:
      numberValue(
        raw.invoiceId
      ),

    invoiceNumber:
      stringValue(
        raw.invoiceNumber
      ),

    method:
      stringValue(
        raw.method,
        "Cash"
      ),

    amount:
      numberValue(
        raw.amount
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

function createEmptyCustomer(): Customer {
  return {
    id: 0,
    name: "",
    phone: "",
    whatsapp: "",
    address: "",
    type: "Regular",
    openingBalance: 0,
    creditLimit: 0,
    status: "Active",

    totalSales: 0,
    totalPaid: 0,
    receivable: 0,
    invoiceCount: 0,

    lastPurchase: null,
    paymentStatus: "",
  };
}

function formatCurrency(
  value: number
) {
  return `Rs. ${numberValue(
    value
  ).toLocaleString(
    "en-PK",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatDate(
  value: string
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    "en-PK",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

/* =========================================================
   PAGE
========================================================= */

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
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    deletingId,
    setDeletingId,
  ] =
    useState<number | null>(
      null
    );

  const [
    showForm,
    setShowForm,
  ] =
    useState(false);

  const [
    editingId,
    setEditingId,
  ] =
    useState<number | null>(
      null
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    typeFilter,
    setTypeFilter,
  ] =
    useState("All");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("All");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    form,
    setForm,
  ] =
    useState<Customer>(
      createEmptyCustomer()
    );

  /* =========================================================
     RECEIVE PAYMENT STATE
  ========================================================= */

  const [
    paymentCustomer,
    setPaymentCustomer,
  ] =
    useState<Customer | null>(
      null
    );

  const [
    paymentAmount,
    setPaymentAmount,
  ] =
    useState("");

  const [
    paymentMethod,
    setPaymentMethod,
  ] =
    useState("Cash");

  const [
    paymentSaving,
    setPaymentSaving,
  ] =
    useState(false);

  const [
    paymentHistory,
    setPaymentHistory,
  ] =
    useState<CustomerPayment[]>(
      []
    );

  const [
    paymentHistoryLoading,
    setPaymentHistoryLoading,
  ] =
    useState(false);

  /* =========================================================
     LOAD CUSTOMERS
  ========================================================= */

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          "/api/customers",
          {
            method: "GET",
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
            data.error ??
              data.message,
            "Failed to load customers."
          )
        );
      }

      const rawCustomers =
        Array.isArray(
          data.customers
        )
          ? data.customers
          : [];

      const normalized =
        rawCustomers
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
          );

      setCustomers(
        normalized
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

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredCustomers =
    useMemo(() => {
      return customers.filter(
        (customer) => {
          const searchText =
            search
              .trim()
              .toLowerCase();

          const matchesSearch =
            !searchText ||
            customer.name
              .toLowerCase()
              .includes(
                searchText
              ) ||
            customer.phone
              .toLowerCase()
              .includes(
                searchText
              ) ||
            customer.whatsapp
              .toLowerCase()
              .includes(
                searchText
              ) ||
            customer.address
              .toLowerCase()
              .includes(
                searchText
              );

          const matchesType =
            typeFilter ===
              "All" ||
            customer.type ===
              typeFilter;

          const matchesStatus =
            statusFilter ===
              "All" ||
            customer.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesType &&
            matchesStatus
          );
        }
      );
    }, [
      customers,
      search,
      typeFilter,
      statusFilter,
    ]);

  /* =========================================================
     STATS
  ========================================================= */

  const totalCustomers =
    customers.length;

  const activeCustomers =
    customers.filter(
      (customer) =>
        customer.status ===
        "Active"
    ).length;

  const wholesaleCustomers =
    customers.filter(
      (customer) =>
        customer.type ===
        "Wholesale"
    ).length;

  const totalReceivable =
    customers.reduce(
      (
        total,
        customer
      ) =>
        total +
        customer.openingBalance +
        customer.receivable,
      0
    );

  /* =========================================================
     CUSTOMER FORM
  ========================================================= */

  function updateForm(
    field: keyof Customer,
    value: string | number
  ) {
    setForm(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  }

  function resetForm() {
    setForm(
      createEmptyCustomer()
    );

    setEditingId(
      null
    );
  }

  function openAddCustomer() {
    resetForm();

    setShowForm(
      true
    );
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(
      false
    );

    resetForm();
  }

  function editCustomer(
    customer: Customer
  ) {
    setForm({
      ...customer,
    });

    setEditingId(
      customer.id
    );

    setShowForm(
      true
    );
  }

  /* =========================================================
     SAVE CUSTOMER
  ========================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.name.trim()) return;

    if (!form.phone.trim()) return;

    try {
      setSaving(true);

      const url =
        editingId !== null
          ? `/api/customers/${editingId}`
          : "/api/customers";

      const method =
        editingId !== null
          ? "PUT"
          : "POST";

      const response =
        await fetch(
          url,
          {
            method,

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name:
                  form.name.trim(),

                phone:
                  form.phone.trim(),

                whatsapp:
                  form.whatsapp.trim(),

                address:
                  form.address.trim(),

                type:
                  form.type,

                openingBalance:
                  numberValue(
                    form.openingBalance
                  ),

                creditLimit:
                  numberValue(
                    form.creditLimit
                  ),

                status:
                  form.status,
              }),
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
            data.error ??
              data.message,
            editingId !== null
              ? "Unable to update customer."
              : "Unable to save customer."
          )
        );
      }

      await loadCustomers();

      setShowForm(
        false
      );

      resetForm();
} catch {
      // Silent fail: no browser popup.
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     DELETE CUSTOMER
  ========================================================= */

  async function deleteCustomer(
    id: number
  ) {
    const customer =
      customers.find(
        (item) =>
          item.id === id
      );

    if (!customer) {
      return;
    }

    try {
      setDeletingId(id);

      const response =
        await fetch(
          `/api/customers/${id}`,
          {
            method: "DELETE",
          }
        );

      if (response.ok) {
        await loadCustomers();
        return;
      }

      // If permanent delete is blocked because the customer
      // has business history, archive by setting Inactive.
      const fallbackResponse =
        await fetch(
          `/api/customers/${id}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name:
                  customer.name,

                phone:
                  customer.phone,

                whatsapp:
                  customer.whatsapp,

                address:
                  customer.address,

                type:
                  customer.type,

                openingBalance:
                  customer.openingBalance,

                creditLimit:
                  customer.creditLimit,

                status:
                  "Inactive",
              }),
          }
        );

      if (!fallbackResponse.ok) {
        return;
      }

      await loadCustomers();
    } catch {
      // Silent fail:
      // no alert, confirm, or console error overlay.
    } finally {
      setDeletingId(null);
    }
  }

  /* =========================================================
     BALANCE
  ========================================================= */

  function getBalance(
    customer: Customer
  ) {
    return (
      customer.openingBalance +
      customer.receivable
    );
  }

  /* =========================================================
     OPEN RECEIVE PAYMENT
  ========================================================= */

  async function openReceivePayment(
    customer: Customer
  ) {
    if (customer.receivable <= 0) return;

    setPaymentCustomer(
      customer
    );

    setPaymentAmount(
      ""
    );

    setPaymentMethod(
      "Cash"
    );

    setPaymentHistory(
      []
    );

    await loadPaymentHistory(
      customer.id
    );
  }

  /* =========================================================
     CLOSE RECEIVE PAYMENT
  ========================================================= */

  function closeReceivePayment() {
    if (
      paymentSaving
    ) {
      return;
    }

    setPaymentCustomer(
      null
    );

    setPaymentAmount(
      ""
    );

    setPaymentMethod(
      "Cash"
    );

    setPaymentHistory(
      []
    );
  }

  /* =========================================================
     LOAD PAYMENT HISTORY
  ========================================================= */

  async function loadPaymentHistory(
    customerId: number
  ) {
    try {
      setPaymentHistoryLoading(
        true
      );

      const response =
        await fetch(
          `/api/customers/${customerId}/payments`,
          {
            method: "GET",
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
            data.error ??
              data.message,
            "Failed to load payment history."
          )
        );
      }

      const rawPayments =
        Array.isArray(
          data.payments
        )
          ? data.payments
          : [];

      setPaymentHistory(
        rawPayments
          .map(
            normalizePayment
          )
          .filter(
            (payment) =>
              payment.id > 0
          )
      );
    } catch (error) {
setPaymentHistory(
        []
      );
    } finally {
      setPaymentHistoryLoading(
        false
      );
    }
  }

  /* =========================================================
     RECEIVE FULL
  ========================================================= */

  function fillFullPayment() {
    if (
      !paymentCustomer
    ) {
      return;
    }

    setPaymentAmount(
      String(
        paymentCustomer.receivable
      )
    );
  }

  /* =========================================================
     SAVE CUSTOMER PAYMENT
  ========================================================= */

  async function handleReceivePayment(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !paymentCustomer
    ) {
      return;
    }

    const amount =
      numberValue(
        paymentAmount
      );

    if (amount <= 0) return;

    if (amount > paymentCustomer.receivable) return;

    try {
      setPaymentSaving(
        true
      );

      const response =
        await fetch(
          `/api/customers/${paymentCustomer.id}/payments`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                amount,
                paymentMethod,
              }),
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
            data.error ??
              data.message,
            "Unable to receive payment."
          )
        );
      }

      await loadCustomers();
setPaymentCustomer(
        null
      );

      setPaymentAmount(
        ""
      );

      setPaymentMethod(
        "Cash"
      );

      setPaymentHistory(
        []
      );
    } catch {
      // Silent fail: no browser popup or console overlay.
    } finally {
      setPaymentSaving(
        false
      );
    }
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">

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
                Customers
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage customers, credit, receivables and payment history.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
            <button
              type="button"
              onClick={() => void loadCustomers()}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={openAddCustomer}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto sm:px-5"
            >
              + Add Customer
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* STATS */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <StatCard
            title="Total Customers"
            value={
              totalCustomers
            }
          />

          <StatCard
            title="Active Customers"
            value={
              activeCustomers
            }
          />

          <StatCard
            title="Wholesale"
            value={
              wholesaleCustomers
            }
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Receivable
            </p>

            <p className="mt-2 text-xl font-bold text-red-600">
              {formatCurrency(
                totalReceivable
              )}
            </p>
          </div>
        </div>

        {/* FILTERS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                🔎
              </span>

              <input
                type="text"
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search customer, phone or address..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-slate-400 focus:bg-white"
              />
            </div>

            <select
              value={
                typeFilter
              }
              onChange={(
                event
              ) =>
                setTypeFilter(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            >
              <option value="All">
                All Types
              </option>

              <option value="Regular">
                Regular
              </option>

              <option value="Retail">
                Retail
              </option>

              <option value="Wholesale">
                Wholesale
              </option>
            </select>

            <select
              value={
                statusFilter
              }
              onChange={(
                event
              ) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            >
              <option value="All">
                All Status
              </option>

              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>
            </select>
          </div>
        </div>

        {/* CUSTOMERS LIST */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="px-4 py-12 text-center text-sm text-slate-500 sm:px-6">
              Loading customers...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-slate-500 sm:px-6">
              No customers found.
            </div>
          ) : (
            <>
              {/* Mobile / Tablet cards */}
              <div className="divide-y divide-slate-100 lg:hidden">
                {filteredCustomers.map(
                  (customer) => {
                    const balance =
                      getBalance(
                        customer
                      );

                    return (
                      <div
                        key={customer.id}
                        className="p-4 sm:p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                              {customer.name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">
                                {customer.name}
                              </p>

                              <p className="mt-1 truncate text-xs text-slate-500">
                                {customer.phone || "No phone"}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                              customer.status ===
                              "Active"
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {customer.status}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-400">
                              Type
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-700">
                              {customer.type}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-400">
                              Invoices
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-700">
                              {customer.invoiceCount}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-400">
                              Sales
                            </p>

                            <p className="mt-1 text-sm font-bold text-slate-900">
                              {formatCurrency(
                                customer.totalSales
                              )}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-400">
                              Paid
                            </p>

                            <p className="mt-1 text-sm font-bold text-emerald-600">
                              {formatCurrency(
                                customer.totalPaid
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 rounded-xl bg-slate-50 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs text-slate-400">
                              Balance
                            </span>

                            <span
                              className={`text-sm font-bold ${
                                balance > 0
                                  ? "text-red-600"
                                  : balance < 0
                                    ? "text-green-600"
                                    : "text-slate-600"
                              }`}
                            >
                              {formatCurrency(
                                Math.abs(
                                  balance
                                )
                              )}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-slate-500">
                            {balance > 0
                              ? "Receivable"
                              : balance < 0
                                ? "Advance"
                                : "Clear"}
                          </p>
                        </div>

                        {customer.address && (
                          <div className="mt-3 rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-400">
                              Address
                            </p>

                            <p className="mt-1 text-sm text-slate-600">
                              {customer.address}
                            </p>
                          </div>
                        )}

                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {customer.receivable >
                          0 ? (
                            <button
                              type="button"
                              onClick={() =>
                                void openReceivePayment(
                                  customer
                                )
                              }
                              className="col-span-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 sm:col-span-1"
                            >
                              Receive Payment
                            </button>
                          ) : (
                            <div className="col-span-2 flex items-center justify-center rounded-lg bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700 sm:col-span-1">
                              Fully Paid
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              editCustomer(
                                customer
                              )
                            }
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={
                              deletingId ===
                              customer.id
                            }
                            onClick={() =>
                              void deleteCustomer(
                                customer.id
                              )
                            }
                            className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            {deletingId ===
                            customer.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-312.5">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <TableHead>
                        Customer
                      </TableHead>

                      <TableHead>
                        Contact
                      </TableHead>

                      <TableHead>
                        Type
                      </TableHead>

                      <TableHead>
                        Sales
                      </TableHead>

                      <TableHead>
                        Paid
                      </TableHead>

                      <TableHead>
                        Balance
                      </TableHead>

                      <TableHead>
                        Payment
                      </TableHead>

                      <TableHead>
                        Status
                      </TableHead>

                      <TableHead>
                        Actions
                      </TableHead>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.map(
                      (customer) => {
                        const balance =
                          getBalance(
                            customer
                          );

                        return (
                          <tr
                            key={
                              customer.id
                            }
                            className="transition hover:bg-slate-50"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                                  {customer.name
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <div>
                                  <p className="font-semibold text-slate-900">
                                    {
                                      customer.name
                                    }
                                  </p>

                                  <p className="mt-1 max-w-45 truncate text-xs text-slate-500">
                                    {customer.address ||
                                      "No address"}
                                  </p>

                                  {customer.invoiceCount >
                                    0 && (
                                    <p className="mt-1 text-xs text-blue-600">
                                      {
                                        customer.invoiceCount
                                      }{" "}
                                      invoice(s)
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <p className="text-sm font-medium text-slate-700">
                                {
                                  customer.phone
                                }
                              </p>

                              {customer.whatsapp && (
                                <p className="mt-1 text-xs text-green-600">
                                  WhatsApp:{" "}
                                  {
                                    customer.whatsapp
                                  }
                                </p>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  customer.type ===
                                  "Wholesale"
                                    ? "bg-blue-50 text-blue-700"
                                    : customer.type ===
                                        "Retail"
                                      ? "bg-purple-50 text-purple-700"
                                      : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {
                                  customer.type
                                }
                              </span>
                            </td>

                            <td className="px-5 py-4 text-sm font-medium text-slate-700">
                              {formatCurrency(
                                customer.totalSales
                              )}
                            </td>

                            <td className="px-5 py-4 text-sm font-medium text-green-600">
                              {formatCurrency(
                                customer.totalPaid
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <p
                                className={`text-sm font-bold ${
                                  balance > 0
                                    ? "text-red-600"
                                    : balance < 0
                                      ? "text-green-600"
                                      : "text-slate-600"
                                }`}
                              >
                                {formatCurrency(
                                  Math.abs(
                                    balance
                                  )
                                )}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {balance > 0
                                  ? "Receivable"
                                  : balance < 0
                                    ? "Advance"
                                    : "Clear"}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              {customer.receivable >
                              0 ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void openReceivePayment(
                                      customer
                                    )
                                  }
                                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                                >
                                  Receive Payment
                                </button>
                              ) : (
                                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                  Fully Paid
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  customer.status ===
                                  "Active"
                                    ? "bg-green-50 text-green-700"
                                    : "bg-red-50 text-red-600"
                                }`}
                              >
                                {
                                  customer.status
                                }
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    editCustomer(
                                      customer
                                    )
                                  }
                                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    deletingId ===
                                    customer.id
                                  }
                                  onClick={() =>
                                    void deleteCustomer(
                                      customer.id
                                    )
                                  }
                                  className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                                >
                                  {deletingId ===
                                  customer.id
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* =====================================================
          ADD / EDIT CUSTOMER MODAL
      ===================================================== */}

      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-3 sm:flex sm:items-center sm:justify-center sm:p-4">
          <div className="mx-auto my-4 max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl sm:my-0 sm:rounded-3xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingId !==
                  null
                    ? "Edit Customer"
                    : "Add Customer"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter customer
                  information below.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeForm
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-5 p-4 sm:space-y-6 sm:p-6"
            >
              <section className="rounded-2xl border border-slate-200 p-5">
                <h3 className="text-base font-bold text-slate-900">
                  Customer Information
                </h3>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Customer Name"
                    required
                    value={
                      form.name
                    }
                    onChange={(
                      value
                    ) =>
                      updateForm(
                        "name",
                        value
                      )
                    }
                    placeholder="e.g. Muhammad Ali"
                  />

                  <Input
                    label="Phone Number"
                    required
                    value={
                      form.phone
                    }
                    onChange={(
                      value
                    ) =>
                      updateForm(
                        "phone",
                        value
                      )
                    }
                    placeholder="03001234567"
                  />

                  <Input
                    label="WhatsApp Number"
                    value={
                      form.whatsapp
                    }
                    onChange={(
                      value
                    ) =>
                      updateForm(
                        "whatsapp",
                        value
                      )
                    }
                    placeholder="03001234567"
                  />

                  <Input
                    label="Address"
                    value={
                      form.address
                    }
                    onChange={(
                      value
                    ) =>
                      updateForm(
                        "address",
                        value
                      )
                    }
                    placeholder="Customer address"
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 p-5">
                <h3 className="text-base font-bold text-slate-900">
                  Customer Type
                </h3>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Select
                    label="Customer Type"
                    value={
                      form.type
                    }
                    onChange={(
                      value
                    ) =>
                      updateForm(
                        "type",
                        value as CustomerType
                      )
                    }
                    options={[
                      "Regular",
                      "Retail",
                      "Wholesale",
                    ]}
                  />

                  <Select
                    label="Status"
                    value={
                      form.status
                    }
                    onChange={(
                      value
                    ) =>
                      updateForm(
                        "status",
                        value as CustomerStatus
                      )
                    }
                    options={[
                      "Active",
                      "Inactive",
                    ]}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-orange-200 bg-orange-50/40 p-5">
                <h3 className="text-base font-bold text-slate-900">
                  Credit & Balance
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Opening balance and
                  credit limit for this
                  customer.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Opening Balance"
                    type="number"
                    value={
                      form.openingBalance
                    }
                    onChange={(
                      value
                    ) =>
                      updateForm(
                        "openingBalance",
                        numberValue(
                          value
                        )
                      )
                    }
                    placeholder="0"
                  />

                  <Input
                    label="Credit Limit"
                    type="number"
                    value={
                      form.creditLimit
                    }
                    onChange={(
                      value
                    ) =>
                      updateForm(
                        "creditLimit",
                        numberValue(
                          value
                        )
                      )
                    }
                    placeholder="0"
                  />
                </div>
              </section>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={
                    closeForm
                  }
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId !==
                        null
                      ? "Update Customer"
                      : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          RECEIVE CUSTOMER PAYMENT MODAL
      ===================================================== */}

      {paymentCustomer && (
        <div className="fixed inset-0 z-70 overflow-y-auto bg-slate-950/50 p-3 sm:flex sm:items-center sm:justify-center sm:p-4">
          <div className="mx-auto my-4 max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl sm:my-0 sm:rounded-3xl">

            {/* PAYMENT HEADER */}

            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Receive Payment
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      paymentCustomer.name
                    }

                    {paymentCustomer.phone
                      ? ` • ${paymentCustomer.phone}`
                      : ""}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    paymentSaving
                  }
                  onClick={
                    closeReceivePayment
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600 disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </div>

            {/* ACCOUNT SUMMARY */}

            <div className="grid grid-cols-1 gap-3 border-b border-slate-200 bg-slate-50 p-5 sm:grid-cols-3">
              <PaymentStat
                label="Total Sales"
                value={
                  formatCurrency(
                    paymentCustomer.totalSales
                  )
                }
              />

              <PaymentStat
                label="Total Paid"
                value={
                  formatCurrency(
                    paymentCustomer.totalPaid
                  )
                }
                valueClass="text-emerald-600"
              />

              <PaymentStat
                label="Receivable"
                value={
                  formatCurrency(
                    paymentCustomer.receivable
                  )
                }
                valueClass="text-red-600"
              />
            </div>

            <form
              onSubmit={
                handleReceivePayment
              }
              className="space-y-5 p-4 sm:p-6"
            >
              {/* AMOUNT */}

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="text-sm font-semibold text-slate-700">
                    Payment Amount
                  </label>

                  <button
                    type="button"
                    onClick={
                      fillFullPayment
                    }
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    Receive Full
                  </button>
                </div>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  autoFocus
                  value={
                    paymentAmount
                  }
                  onChange={(
                    event
                  ) =>
                    setPaymentAmount(
                      event.target.value
                    )
                  }
                  placeholder="Enter received amount"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-semibold outline-none transition focus:border-slate-400"
                />
              </div>

              {/* METHOD */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Payment Method
                </label>

                <select
                  value={
                    paymentMethod
                  }
                  onChange={(
                    event
                  ) =>
                    setPaymentMethod(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400"
                >
                  <option value="Cash">
                    Cash
                  </option>

                  <option value="Bank">
                    Bank
                  </option>

                  <option value="Credit">
                    Credit
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

              {/* AFTER PAYMENT */}

              {numberValue(
                paymentAmount
              ) > 0 && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    After Payment
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-600">
                      Remaining Receivable
                    </span>

                    <span className="font-bold text-slate-900">
                      {formatCurrency(
                        Math.max(
                          0,
                          paymentCustomer.receivable -
                            numberValue(
                              paymentAmount
                            )
                        )
                      )}
                    </span>
                  </div>

                  {numberValue(
                    paymentAmount
                  ) ===
                    paymentCustomer.receivable && (
                    <p className="mt-3 text-xs font-semibold text-emerald-700">
                      Account will be fully
                      paid after this payment.
                    </p>
                  )}
                </div>
              )}

              {/* PAYMENT HISTORY */}

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <h3 className="font-bold text-slate-900">
                    Payment History
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Payments recorded against
                    this customer&apos;s invoices.
                  </p>
                </div>

                {paymentHistoryLoading ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">
                    Loading payment history...
                  </div>
                ) : paymentHistory.length ===
                  0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">
                    No payment history found.
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full min-w-130">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b border-slate-100">
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                            Invoice
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                            Method
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                            Date
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-400">
                            Amount
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {paymentHistory.map(
                          (payment) => (
                            <tr
                              key={
                                payment.id
                              }
                            >
                              <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                                {payment.invoiceNumber ||
                                  `Invoice #${payment.invoiceId}`}
                              </td>

                              <td className="px-4 py-3 text-sm text-slate-600">
                                {
                                  payment.method
                                }
                              </td>

                              <td className="px-4 py-3 text-xs text-slate-500">
                                {formatDate(
                                  payment.createdAt
                                )}
                              </td>

                              <td className="px-4 py-3 text-right text-sm font-bold text-emerald-600">
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

              {/* BUTTONS */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={
                    paymentSaving
                  }
                  onClick={
                    closeReceivePayment
                  }
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    paymentSaving
                  }
                  className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {paymentSaving
                    ? "Recording Payment..."
                    : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function PaymentStat({
  label,
  value,
  valueClass = "text-slate-900",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1 font-bold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

function TableHead({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string | number;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      <input
        required={required}
        type={type}
        value={value}
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      >
        {options.map(
          (option) => (
            <option
              key={
                option
              }
              value={
                option
              }
            >
              {option}
            </option>
          )
        )}
      </select>
    </label>
  );
}