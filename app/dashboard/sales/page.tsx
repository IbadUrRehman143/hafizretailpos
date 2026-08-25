"use client";

import { useState } from "react";
import SalesHeader from "./salesHeader";
import SalesStats from "./salesStats";
import SalesTable from "./salesTable";
import SaleModal from "./saleModal";

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
  productId: number;
  productName: string;
  quantity: number;
  unit: "KG" | "PCS";
  price: number;
  total: number;
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
  grandTotal: number;

  paidAmount: number;
  remainingAmount: number;

  paymentMethod: PaymentMethod;
  status: SaleStatus;

  notes: string;
};

export const customers: Customer[] = [
  {
    id: 1,
    name: "Ahmad Khan",
    phone: "03001234567",
  },
  {
    id: 2,
    name: "Muhammad Ali",
    phone: "03111234567",
  },
  {
    id: 3,
    name: "Bilal Traders",
    phone: "03221234567",
  },
  {
    id: 4,
    name: "Walk-in Customer",
    phone: "",
  },
];

export const products: Product[] = [
  {
    id: 1,
    name: "Cotton",
    category: "Cotton",
    unit: "KG",
    price: 250,
  },
  {
    id: 2,
    name: "Washing Machine",
    category: "Appliances",
    unit: "PCS",
    price: 55000,
  },
  {
    id: 3,
    name: "Pedestal Fan",
    category: "Electronics",
    unit: "PCS",
    price: 8500,
  },
  {
    id: 4,
    name: "Ceiling Fan",
    category: "Electronics",
    unit: "PCS",
    price: 9000,
  },
  {
    id: 5,
    name: "Charpai 6x3",
    category: "Furniture",
    unit: "PCS",
    price: 7500,
  },
];

const initialSales: Sale[] = [
  {
    id: 1,
    invoiceNo: "INV-0001",
    date: "2026-08-25 10:30 AM",

    customerId: 1,
    customerName: "Ahmad Khan",
    customerPhone: "03001234567",

    items: [
      {
        productId: 3,
        productName: "Pedestal Fan",
        quantity: 2,
        unit: "PCS",
        price: 8500,
        total: 17000,
      },
    ],

    subtotal: 17000,
    discount: 0,
    grandTotal: 17000,

    paidAmount: 17000,
    remainingAmount: 0,

    paymentMethod: "Cash",
    status: "Paid",

    notes: "",
  },

  {
    id: 2,
    invoiceNo: "INV-0002",
    date: "2026-08-25 12:15 PM",

    customerId: 2,
    customerName: "Muhammad Ali",
    customerPhone: "03111234567",

    items: [
      {
        productId: 2,
        productName: "Washing Machine",
        quantity: 1,
        unit: "PCS",
        price: 55000,
        total: 55000,
      },
    ],

    subtotal: 55000,
    discount: 0,
    grandTotal: 55000,

    paidAmount: 30000,
    remainingAmount: 25000,

    paymentMethod: "Cash",
    status: "Partial",

    notes: "Remaining payment next week.",
  },

  {
    id: 3,
    invoiceNo: "INV-0003",
    date: "2026-08-24 04:20 PM",

    customerId: 4,
    customerName: "Walk-in Customer",
    customerPhone: "",

    items: [
      {
        productId: 1,
        productName: "Cotton",
        quantity: 40,
        unit: "KG",
        price: 250,
        total: 10000,
      },
    ],

    subtotal: 10000,
    discount: 500,
    grandTotal: 9500,

    paidAmount: 0,
    remainingAmount: 9500,

    paymentMethod: "Credit",
    status: "Unpaid",

    notes: "",
  },
];

export default function SalesPage() {
  const [sales, setSales] =
    useState<Sale[]>(initialSales);

  const [showModal, setShowModal] =
    useState(false);

  const [editingSale, setEditingSale] =
    useState<Sale | null>(null);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [selectedSale, setSelectedSale] =
    useState<Sale | null>(null);

  const totalSales = sales.reduce(
    (sum, sale) =>
      sum + sale.grandTotal,
    0
  );

  const totalReceived = sales.reduce(
    (sum, sale) =>
      sum + sale.paidAmount,
    0
  );

  const totalReceivable = sales.reduce(
    (sum, sale) =>
      sum + sale.remainingAmount,
    0
  );

  function handleAdd() {
    setEditingSale(null);
    setShowModal(true);
  }

  function handleEdit(sale: Sale) {
    setEditingSale(sale);
    setShowModal(true);
  }

  function handleSave(sale: Sale) {
    if (editingSale) {
      setSales((previous) =>
        previous.map((item) =>
          item.id === sale.id
            ? sale
            : item
        )
      );
    } else {
      setSales((previous) => [
        sale,
        ...previous,
      ]);
    }

    setShowModal(false);
    setEditingSale(null);
  }

  function handleDelete(id: number) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this sale?"
      );

    if (!confirmed) return;

    setSales((previous) =>
      previous.filter(
        (sale) =>
          sale.id !== id
      )
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">

      <div className="mx-auto max-w-7xl space-y-6">

        <SalesHeader
          onAdd={handleAdd}
        />

        <SalesStats
          totalSales={totalSales}
          totalReceived={
            totalReceived
          }
          totalReceivable={
            totalReceivable
          }
          totalInvoices={
            sales.length
          }
        />

        <SalesTable
          sales={sales}
          search={search}
          setSearch={setSearch}
          statusFilter={
            statusFilter
          }
          setStatusFilter={
            setStatusFilter
          }
          onView={
            setSelectedSale
          }
          onEdit={
            handleEdit
          }
          onDelete={
            handleDelete
          }
        />

      </div>

      {showModal && (
        <SaleModal
          sale={editingSale}
          onClose={() => {
            setShowModal(false);
            setEditingSale(null);
          }}
          onSave={handleSave}
        />
      )}

      {selectedSale && (
        <InvoiceModal
          sale={selectedSale}
          onClose={() =>
            setSelectedSale(null)
          }
        />
      )}

    </div>
  );
}

/* =====================================================
   INVOICE MODAL
===================================================== */

function InvoiceModal({
  sale,
  onClose,
}: {
  sale: Sale;
  onClose: () => void;
}) {
  function formatCurrency(
    value: number
  ) {
    return `Rs. ${value.toLocaleString()}`;
  }

  function printInvoice() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div
        id="print-invoice"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"
      >

        <div className="flex items-start justify-between border-b p-6">

          <div>
            <h2 className="text-2xl font-bold">
              INVOICE
            </h2>

            <p className="text-sm text-slate-500">
              {sale.invoiceNo}
            </p>
          </div>

          <div className="text-right">
            <p className="font-bold">
              Hafiz Retail POS
            </p>

            <p className="text-xs text-slate-500">
              Sales Invoice
            </p>
          </div>

        </div>

        <div className="grid grid-cols-2 gap-4 border-b p-6">

          <div>
            <p className="text-xs text-slate-400">
              CUSTOMER
            </p>

            <p className="font-semibold">
              {sale.customerName}
            </p>

            {sale.customerPhone && (
              <p className="text-sm text-slate-500">
                {sale.customerPhone}
              </p>
            )}
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400">
              DATE
            </p>

            <p className="text-sm">
              {sale.date}
            </p>
          </div>

        </div>

        <div className="p-6">

          <div className="overflow-hidden rounded-xl border">

            <table className="w-full">

              <thead className="bg-slate-50">

                <tr>
                  <th className="p-3 text-left text-xs">
                    Product
                  </th>

                  <th className="p-3 text-center text-xs">
                    Qty
                  </th>

                  <th className="p-3 text-right text-xs">
                    Price
                  </th>

                  <th className="p-3 text-right text-xs">
                    Total
                  </th>
                </tr>

              </thead>

              <tbody>

                {sale.items.map(
                  (item) => (
                    <tr
                      key={
                        item.productId
                      }
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
                        {formatCurrency(
                          item.price
                        )}
                      </td>

                      <td className="p-3 text-right text-sm font-semibold">
                        {formatCurrency(
                          item.total
                        )}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

          <div className="ml-auto mt-6 max-w-sm space-y-3">

            <InvoiceRow
              label="Subtotal"
              value={formatCurrency(
                sale.subtotal
              )}
            />

            <InvoiceRow
              label="Discount"
              value={`- ${formatCurrency(
                sale.discount
              )}`}
            />

            <div className="flex justify-between border-t pt-3 font-bold">

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
              value={formatCurrency(
                sale.paidAmount
              )}
            />

            <InvoiceRow
              label="Remaining"
              value={formatCurrency(
                sale.remainingAmount
              )}
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

          {sale.notes && (
            <div className="mt-5">
              <p className="text-xs text-slate-400">
                NOTES
              </p>

              <p className="text-sm">
                {sale.notes}
              </p>
            </div>
          )}

        </div>

        <div className="flex gap-3 border-t p-6">

          <button
            onClick={printInvoice}
            className="flex-1 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            🖨 Print Invoice
          </button>

          <button
            onClick={onClose}
            className="rounded-xl border px-5 py-3 text-sm font-semibold"
          >
            Close
          </button>

        </div>

      </div>
    </div>
  );
}

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