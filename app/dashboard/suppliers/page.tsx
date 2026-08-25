"use client";

import { useMemo, useState } from "react";

type CustomerType = "Retail" | "Wholesale" | "Regular";
type CustomerStatus = "Active" | "Inactive";

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
};

const initialCustomers: Customer[] = [
  {
    id: 1,
    name: "Muhammad Ali",
    phone: "03001234567",
    whatsapp: "03001234567",
    address: "Main Bazar",
    type: "Regular",
    openingBalance: 5000,
    creditLimit: 20000,
    status: "Active",
    totalSales: 45000,
    totalPaid: 40000,
  },
  {
    id: 2,
    name: "Khan Electronics",
    phone: "03111234567",
    whatsapp: "03111234567",
    address: "Sadar Bazar",
    type: "Wholesale",
    openingBalance: 10000,
    creditLimit: 50000,
    status: "Active",
    totalSales: 120000,
    totalPaid: 100000,
  },
  {
    id: 3,
    name: "Ahmad Khan",
    phone: "03221234567",
    whatsapp: "03221234567",
    address: "High School Road",
    type: "Retail",
    openingBalance: 0,
    creditLimit: 10000,
    status: "Inactive",
    totalSales: 15000,
    totalPaid: 15000,
  },
];

export default function CustomersPage() {
  const [customers, setCustomers] =
    useState<Customer[]>(initialCustomers);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [form, setForm] = useState<Customer>({
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
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        customer.name.toLowerCase().includes(searchText) ||
        customer.phone.includes(search) ||
        customer.whatsapp.includes(search) ||
        customer.address.toLowerCase().includes(searchText);

      const matchesType =
        typeFilter === "All" ||
        customer.type === typeFilter;

      const matchesStatus =
        statusFilter === "All" ||
        customer.status === statusFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus
      );
    });
  }, [customers, search, typeFilter, statusFilter]);

  const totalCustomers = customers.length;

  const activeCustomers = customers.filter(
    (customer) => customer.status === "Active"
  ).length;

  const wholesaleCustomers = customers.filter(
    (customer) => customer.type === "Wholesale"
  ).length;

  const totalReceivable = customers.reduce(
    (total, customer) =>
      total +
      customer.openingBalance +
      customer.totalSales -
      customer.totalPaid,
    0
  );

  function updateForm(
    field: keyof Customer,
    value: string | number
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm({
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
    });

    setEditingId(null);
  }

  function openAddCustomer() {
    resetForm();
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    resetForm();
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("Customer name is required.");
      return;
    }

    if (!form.phone.trim()) {
      alert("Phone number is required.");
      return;
    }

    if (editingId !== null) {
      setCustomers((previous) =>
        previous.map((customer) =>
          customer.id === editingId
            ? {
                ...form,
                id: editingId,
              }
            : customer
        )
      );
    } else {
      setCustomers((previous) => [
        ...previous,
        {
          ...form,
          id: Date.now(),
        },
      ]);
    }

    closeForm();
  }

  function editCustomer(customer: Customer) {
    setForm({
      ...customer,
    });

    setEditingId(customer.id);
    setShowForm(true);
  }

  function deleteCustomer(id: number) {
    const customer = customers.find(
      (item) => item.id === id
    );

    if (!customer) return;

    const confirmed = window.confirm(
      `Delete "${customer.name}"?`
    );

    if (!confirmed) return;

    setCustomers((previous) =>
      previous.filter(
        (customer) => customer.id !== id
      )
    );
  }

  function getBalance(customer: Customer) {
    return (
      customer.openingBalance +
      customer.totalSales -
      customer.totalPaid
    );
  }

  function formatCurrency(value: number) {
    return `Rs. ${value.toLocaleString()}`;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Customers
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage customers, credit and payment history.
            </p>
          </div>

          <button
            onClick={openAddCustomer}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            + Add Customer
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

          <StatCard
            title="Total Customers"
            value={totalCustomers}
          />

          <StatCard
            title="Active Customers"
            value={activeCustomers}
          />

          <StatCard
            title="Wholesale"
            value={wholesaleCustomers}
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Receivable
            </p>

            <p className="mt-2 text-xl font-bold text-red-600">
              {formatCurrency(totalReceivable)}
            </p>
          </div>

        </div>

        {/* Search & Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">

            {/* Search */}
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                🔎
              </span>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search customer, phone or address..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-slate-400 focus:bg-white"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value)
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
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

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
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

        {/* Customer Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full min-w-275">

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
                    Status
                  </TableHead>

                  <TableHead>
                    Actions
                  </TableHead>
                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredCustomers.length === 0 ? (

                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      No customers found.
                    </td>
                  </tr>

                ) : (

                  filteredCustomers.map(
                    (customer) => {

                      const balance =
                        getBalance(customer);

                      return (
                        <tr
                          key={customer.id}
                          className="transition hover:bg-slate-50"
                        >

                          {/* Customer */}
                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                                {customer.name
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <p className="font-semibold text-slate-900">
                                  {customer.name}
                                </p>

                                <p className="mt-1 max-w-45 truncate text-xs text-slate-500">
                                  {customer.address ||
                                    "No address"}
                                </p>
                              </div>

                            </div>

                          </td>

                          {/* Contact */}
                          <td className="px-5 py-4">

                            <p className="text-sm font-medium text-slate-700">
                              {customer.phone}
                            </p>

                            {customer.whatsapp && (
                              <p className="mt-1 text-xs text-green-600">
                                WhatsApp:{" "}
                                {customer.whatsapp}
                              </p>
                            )}

                          </td>

                          {/* Type */}
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
                              {customer.type}
                            </span>

                          </td>

                          {/* Sales */}
                          <td className="px-5 py-4 text-sm font-medium text-slate-700">
                            {formatCurrency(
                              customer.totalSales
                            )}
                          </td>

                          {/* Paid */}
                          <td className="px-5 py-4 text-sm font-medium text-green-600">
                            {formatCurrency(
                              customer.totalPaid
                            )}
                          </td>

                          {/* Balance */}
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
                                Math.abs(balance)
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

                          {/* Status */}
                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                customer.status ===
                                "Active"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-red-50 text-red-600"
                              }`}
                            >
                              {customer.status}
                            </span>

                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">

                            <div className="flex gap-2">

                              <button
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
                                onClick={() =>
                                  deleteCustomer(
                                    customer.id
                                  )
                                }
                                className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )

                )}

              </tbody>

            </table>

          </div>
        </div>

      </div>

      {/* Add / Edit Modal */}
      {showForm && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">

          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingId !== null
                    ? "Edit Customer"
                    : "Add Customer"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter customer information below.
                </p>
              </div>

              <button
                onClick={closeForm}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600 hover:bg-slate-200"
              >
                ×
              </button>

            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-6 p-6"
            >

              {/* Basic Info */}
              <section className="rounded-2xl border border-slate-200 p-5">

                <h3 className="text-base font-bold text-slate-900">
                  Customer Information
                </h3>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">

                  <Input
                    label="Customer Name"
                    required
                    value={form.name}
                    onChange={(value) =>
                      updateForm("name", value)
                    }
                    placeholder="e.g. Muhammad Ali"
                  />

                  <Input
                    label="Phone Number"
                    required
                    value={form.phone}
                    onChange={(value) =>
                      updateForm("phone", value)
                    }
                    placeholder="03001234567"
                  />

                  <Input
                    label="WhatsApp Number"
                    value={form.whatsapp}
                    onChange={(value) =>
                      updateForm(
                        "whatsapp",
                        value
                      )
                    }
                    placeholder="03001234567"
                  />

                  <Input
                    label="Address"
                    value={form.address}
                    onChange={(value) =>
                      updateForm(
                        "address",
                        value
                      )
                    }
                    placeholder="Customer address"
                  />

                </div>

              </section>

              {/* Customer Type */}
              <section className="rounded-2xl border border-slate-200 p-5">

                <h3 className="text-base font-bold text-slate-900">
                  Customer Type
                </h3>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">

                  <Select
                    label="Customer Type"
                    value={form.type}
                    onChange={(value) =>
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
                    value={form.status}
                    onChange={(value) =>
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

              {/* Credit */}
              <section className="rounded-2xl border border-orange-200 bg-orange-50/40 p-5">

                <h3 className="text-base font-bold text-slate-900">
                  Credit & Balance
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Opening balance and credit limit can
                  be used later for customer payments.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">

                  <Input
                    label="Opening Balance"
                    type="number"
                    value={form.openingBalance}
                    onChange={(value) =>
                      updateForm(
                        "openingBalance",
                        Number(value)
                      )
                    }
                    placeholder="0"
                  />

                  <Input
                    label="Credit Limit"
                    type="number"
                    value={form.creditLimit}
                    onChange={(value) =>
                      updateForm(
                        "creditLimit",
                        Number(value)
                      )
                    }
                    placeholder="0"
                  />

                </div>

              </section>

              {/* Footer */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  {editingId !== null
                    ? "Update Customer"
                    : "Save Customer"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

/* =========================
   Reusable Components
========================= */

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

function TableHead({
  children,
}: {
  children: React.ReactNode;
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
  onChange: (value: string) => void;
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
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
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
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>

    </label>
  );
}