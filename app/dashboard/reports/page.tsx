"use client";

import { useState } from "react";

type Sale = {
  id: number;
  date: string;
  customer: string;
  items: number;
  payment: string;
  amount: number;
  status: "Completed" | "Pending";
};

const sales: Sale[] = [
  {
    id: 1001,
    date: "Today",
    customer: "Muhammad Ali",
    items: 3,
    payment: "Cash",
    amount: 68500,
    status: "Completed",
  },
  {
    id: 1002,
    date: "Today",
    customer: "Abdul Rehman",
    items: 2,
    payment: "Card",
    amount: 45000,
    status: "Completed",
  },
  {
    id: 1003,
    date: "Yesterday",
    customer: "Sajid Khan",
    items: 4,
    payment: "Cash",
    amount: 32500,
    status: "Completed",
  },
  {
    id: 1004,
    date: "Yesterday",
    customer: "Irfan Ahmad",
    items: 1,
    payment: "Bank",
    amount: 18500,
    status: "Completed",
  },
  {
    id: 1005,
    date: "2 days ago",
    customer: "Usman Khan",
    items: 2,
    payment: "Cash",
    amount: 12000,
    status: "Pending",
  },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState("Today");

  const formatPrice = (price: number) =>
    `Rs. ${price.toLocaleString("en-PK")}`;

  const completedSales = sales.filter(
    (sale) => sale.status === "Completed"
  );

  const totalSales = completedSales.reduce(
    (sum, sale) => sum + sale.amount,
    0
  );

  const totalOrders = completedSales.length;

  const totalItems = completedSales.reduce(
    (sum, sale) => sum + sale.items,
    0
  );

  const averageOrder =
    totalOrders > 0 ? totalSales / totalOrders : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">

      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Reports
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View sales and business performance
          </p>
        </div>

        <select
          value={period}
          onChange={(event) =>
            setPeriod(event.target.value)
          }
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
        >
          <option>Today</option>
          <option>This Week</option>
          <option>This Month</option>
          <option>This Year</option>
        </select>

      </div>

      {/* SUMMARY */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Total Sales
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatPrice(totalSales)}
          </p>

          <p className="mt-2 text-xs text-emerald-600">
            ↑ Sales revenue
          </p>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Total Orders
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-600">
            {totalOrders}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Completed orders
          </p>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Items Sold
          </p>

          <p className="mt-2 text-2xl font-bold text-purple-600">
            {totalItems}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Total units sold
          </p>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Average Order
          </p>

          <p className="mt-2 text-xl font-bold text-slate-900">
            {formatPrice(averageOrder)}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Per completed order
          </p>

        </div>

      </div>

      {/* REPORT BODY */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_350px]">

        {/* SALES TABLE */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-5">

            <h2 className="text-lg font-bold text-slate-900">
              Sales Report
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Recent sales transactions
            </p>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-187.5">

              <thead>

                <tr className="border-b border-slate-200 bg-slate-50">

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                    Invoice
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                    Customer
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                    Items
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                    Payment
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                    Amount
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {sales.map((sale) => (

                  <tr
                    key={sale.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >

                    <td className="px-5 py-4">

                      <span className="font-bold text-blue-600">
                        #{sale.id}
                      </span>

                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {sale.date}
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {sale.customer}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold">
                      {sale.items}
                    </td>

                    <td className="px-5 py-4">

                      <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                        {sale.payment}
                      </span>

                    </td>

                    <td className="px-5 py-4 font-bold text-slate-900">
                      {formatPrice(sale.amount)}
                    </td>

                    <td className="px-5 py-4">

                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                          sale.status === "Completed"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {sale.status}
                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

        {/* QUICK REPORT */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-5">

            <h2 className="text-lg font-bold text-slate-900">
              Quick Summary
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Payment method breakdown
            </p>

          </div>

          <div className="space-y-4 p-5">

            <div className="rounded-xl bg-slate-50 p-4">

              <div className="flex items-center justify-between">

                <span className="font-semibold text-slate-700">
                  💵 Cash
                </span>

                <span className="font-bold text-slate-900">
                  {formatPrice(
                    completedSales
                      .filter(
                        (sale) =>
                          sale.payment === "Cash"
                      )
                      .reduce(
                        (sum, sale) =>
                          sum + sale.amount,
                        0
                      )
                  )}
                </span>

              </div>

            </div>

            <div className="rounded-xl bg-slate-50 p-4">

              <div className="flex items-center justify-between">

                <span className="font-semibold text-slate-700">
                  💳 Card
                </span>

                <span className="font-bold text-slate-900">
                  {formatPrice(
                    completedSales
                      .filter(
                        (sale) =>
                          sale.payment === "Card"
                      )
                      .reduce(
                        (sum, sale) =>
                          sum + sale.amount,
                        0
                      )
                  )}
                </span>

              </div>

            </div>

            <div className="rounded-xl bg-slate-50 p-4">

              <div className="flex items-center justify-between">

                <span className="font-semibold text-slate-700">
                  🏦 Bank
                </span>

                <span className="font-bold text-slate-900">
                  {formatPrice(
                    completedSales
                      .filter(
                        (sale) =>
                          sale.payment === "Bank"
                      )
                      .reduce(
                        (sum, sale) =>
                          sum + sale.amount,
                        0
                      )
                  )}
                </span>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}