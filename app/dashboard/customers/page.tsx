"use client";

import { useMemo, useState } from "react";

type Customer = {
  id: number;
  name: string;
  phone: string;
  whatsapp: boolean;
  totalPurchases: number;
  totalAmount: number;
  lastPurchase: string;
  status: "Active" | "Inactive";
};

const initialCustomers: Customer[] = [
  {
    id: 1,
    name: "Muhammad Ali",
    phone: "0300-1234567",
    whatsapp: true,
    totalPurchases: 12,
    totalAmount: 185000,
    lastPurchase: "Today",
    status: "Active",
  },
  {
    id: 2,
    name: "Abdul Rehman",
    phone: "0312-7654321",
    whatsapp: true,
    totalPurchases: 8,
    totalAmount: 92000,
    lastPurchase: "Yesterday",
    status: "Active",
  },
  {
    id: 3,
    name: "Sajid Khan",
    phone: "0333-4567890",
    whatsapp: false,
    totalPurchases: 5,
    totalAmount: 48000,
    lastPurchase: "2 days ago",
    status: "Active",
  },
  {
    id: 4,
    name: "Irfan Ahmad",
    phone: "0345-9876543",
    whatsapp: true,
    totalPurchases: 3,
    totalAmount: 27500,
    lastPurchase: "5 days ago",
    status: "Active",
  },
  {
    id: 5,
    name: "Usman Khan",
    phone: "0301-1112233",
    whatsapp: false,
    totalPurchases: 1,
    totalAmount: 8500,
    lastPurchase: "12 days ago",
    status: "Inactive",
  },
];

export default function CustomersPage() {
  const [customers, setCustomers] =
    useState<Customer[]>(initialCustomers);

  const [search, setSearch] = useState("");

  const filteredCustomers = useMemo(() => {
    const text = search.trim().toLowerCase();

    if (!text) return customers;

    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(text) ||
        customer.phone.toLowerCase().includes(text)
    );
  }, [customers, search]);

  const totalCustomers = customers.length;

  const activeCustomers = customers.filter(
    (customer) => customer.status === "Active"
  ).length;

  const whatsappCustomers = customers.filter(
    (customer) => customer.whatsapp
  ).length;

  const totalRevenue = customers.reduce(
    (sum, customer) => sum + customer.totalAmount,
    0
  );

  const formatPrice = (price: number) =>
    `Rs. ${price.toLocaleString("en-PK")}`;

  const addCustomer = () => {
    window.alert(
      "Add Customer form will be connected in the next step."
    );
  };

  const viewCustomer = (customer: Customer) => {
    window.alert(
      `Customer Details\n\nName: ${customer.name}\nPhone: ${customer.phone}\nPurchases: ${customer.totalPurchases}\nTotal: ${formatPrice(
        customer.totalAmount
      )}`
    );
  };

  const editCustomer = (customer: Customer) => {
    window.alert(`Edit Customer\n\n${customer.name}`);
  };

  const deleteCustomer = (id: number) => {
    const customer = customers.find(
      (item) => item.id === id
    );

    if (!customer) return;

    const confirmed = window.confirm(
      `Delete ${customer.name}?`
    );

    if (!confirmed) return;

    setCustomers((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">

      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Customers
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your customers and purchase history
          </p>
        </div>

        <button
          type="button"
          onClick={addCustomer}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-95"
        >
          + Add Customer
        </button>

      </div>

      {/* SUMMARY */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Total Customers
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {totalCustomers}
          </p>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Active Customers
          </p>

          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {activeCustomers}
          </p>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            WhatsApp Customers
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-600">
            {whatsappCustomers}
          </p>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Customer Revenue
          </p>

          <p className="mt-2 text-xl font-bold text-slate-900">
            {formatPrice(totalRevenue)}
          </p>

        </div>

      </div>

      {/* CUSTOMER LIST */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* SEARCH */}
        <div className="border-b border-slate-200 p-4 sm:p-5">

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search customer by name or phone..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />

        </div>

        {/* RESULT */}
        <div className="border-b border-slate-200 px-5 py-4">

          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-bold text-slate-800">
              {filteredCustomers.length}
            </span>{" "}
            customer
            {filteredCustomers.length !== 1 ? "s" : ""}
          </p>

        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">

          <table className="w-full min-w-262.5">

            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">

                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Customer
                </th>

                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Phone
                </th>

                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  WhatsApp
                </th>

                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Purchases
                </th>

                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Total Amount
                </th>

                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Last Purchase
                </th>

                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                  Actions
                </th>

              </tr>
            </thead>

            <tbody>

              {filteredCustomers.length === 0 ? (

                <tr>

                  <td
                    colSpan={8}
                    className="px-5 py-16 text-center"
                  >

                    <div className="text-4xl">
                      👤
                    </div>

                    <h3 className="mt-3 font-bold text-slate-800">
                      No customers found
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Try another name or phone number.
                    </p>

                  </td>

                </tr>

              ) : (

                filteredCustomers.map((customer) => (

                  <tr
                    key={customer.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >

                    {/* CUSTOMER */}
                    <td className="px-5 py-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600">
                          {customer.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>

                          <p className="font-bold text-slate-900">
                            {customer.name}
                          </p>

                          <p className="text-xs text-slate-500">
                            Customer #{customer.id}
                          </p>

                        </div>

                      </div>

                    </td>

                    {/* PHONE */}
                    <td className="px-5 py-4 text-sm font-medium text-slate-700">
                      {customer.phone}
                    </td>

                    {/* WHATSAPP */}
                    <td className="px-5 py-4">

                      {customer.whatsapp ? (
                        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                          Not Available
                        </span>
                      )}

                    </td>

                    {/* PURCHASES */}
                    <td className="px-5 py-4">

                      <span className="font-bold text-slate-800">
                        {customer.totalPurchases}
                      </span>

                    </td>

                    {/* TOTAL */}
                    <td className="px-5 py-4">

                      <span className="font-bold text-slate-900">
                        {formatPrice(
                          customer.totalAmount
                        )}
                      </span>

                    </td>

                    {/* LAST PURCHASE */}
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {customer.lastPurchase}
                    </td>

                    {/* STATUS */}
                    <td className="px-5 py-4">

                      <span
                        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${
                          customer.status ===
                          "Active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {customer.status}
                      </span>

                    </td>

                    {/* ACTIONS */}
                    <td className="px-5 py-4">

                      <div className="flex justify-end gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            viewCustomer(customer)
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                        >
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            editCustomer(customer)
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteCustomer(customer.id)
                          }
                          className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}