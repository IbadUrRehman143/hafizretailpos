"use client";

import { useEffect, useState } from "react";

type InvoiceItem = {
  id: number;
  product: string;
  quantity: number;
  rate: number;
};

const availableProducts = [
  "Washing Machine",
  "Air Cooler",
  "Cotton Mattress",
  "Charpai",
  "Bamboo",
  "Bed Sheet",
  "Pillow",
  "Electric Fan",
];

export default function InvoicePage() {
  const [invoiceNumber, setInvoiceNumber] = useState("INV-1");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [invoiceDate, setInvoiceDate] = useState("");

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 1,
      product: "",
      quantity: 1,
      rate: 0,
    },
  ]);

  const [paidAmount, setPaidAmount] = useState("");

  /*
   * Generate invoice number only on client.
   * This avoids hydration mismatch.
   */
  useEffect(() => {
    const savedNumber =
      localStorage.getItem("hafiz_invoice_number");

    if (!savedNumber) {
      localStorage.setItem(
        "hafiz_invoice_number",
        "1"
      );

      setInvoiceNumber("INV-1");
    } else {
      setInvoiceNumber(
        `INV-${Number(savedNumber)}`
      );
    }

    const now = new Date();

    setInvoiceDate(
      now.toLocaleString("en-PK", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    );
  }, []);

  const formatPrice = (value: number) => {
    return `Rs. ${Number(value || 0).toLocaleString(
      "en-PK",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  /*
   * ADD ITEM
   */
  const addItem = () => {
    setItems((current) => [
      ...current,
      {
        id: Date.now(),
        product: "",
        quantity: 1,
        rate: 0,
      },
    ]);
  };

  /*
   * UPDATE ITEM
   */
  const updateItem = (
    id: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]:
                field === "quantity" ||
                field === "rate"
                  ? Number(value) || 0
                  : value,
            }
          : item
      )
    );
  };

  /*
   * REMOVE ITEM
   */
  const removeItem = (id: number) => {
    setItems((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  /*
   * CALCULATIONS
   */
  const subtotal = items.reduce(
    (sum, item) =>
      sum +
      Number(item.quantity || 0) *
        Number(item.rate || 0),
    0
  );

  const taxRate = 0.05;

  const tax = subtotal * taxRate;

  const total = subtotal + tax;

  const paid = Number(paidAmount) || 0;

  const remainingBalance =
    Math.max(0, total - paid);

  const change =
    Math.max(0, paid - total);

  /*
   * NEW INVOICE
   */
  const createNewInvoice = () => {
    const currentNumber = Number(
      localStorage.getItem(
        "hafiz_invoice_number"
      ) || "1"
    );

    const nextNumber = currentNumber + 1;

    localStorage.setItem(
      "hafiz_invoice_number",
      String(nextNumber)
    );

    setInvoiceNumber(`INV-${nextNumber}`);

    setCustomerName("");
    setCustomerPhone("");
    setPaidAmount("");

    setItems([
      {
        id: Date.now(),
        product: "",
        quantity: 1,
        rate: 0,
      },
    ]);

    const now = new Date();

    setInvoiceDate(
      now.toLocaleString("en-PK", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    );
  };

  /*
   * PRINT
   */
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* SCREEN */}
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 print:hidden">

        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Invoice Maker
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create and print customer invoice
            </p>
          </div>

          <div className="flex gap-2">

            <button
              type="button"
              onClick={createNewInvoice}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              New Invoice
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              🖨️ Print Invoice
            </button>

          </div>
        </div>

        <div className="mx-auto max-w-7xl">

          {/* CUSTOMER INFO */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="mb-5 flex items-center justify-between">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Invoice Information
                </h2>

                <p className="text-sm text-slate-500">
                  Enter customer and invoice details
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
                {invoiceNumber}
              </div>

            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Customer Name
                </label>

                <input
                  type="text"
                  value={customerName}
                  onChange={(e) =>
                    setCustomerName(e.target.value)
                  }
                  placeholder="Customer name"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Customer Phone
                </label>

                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) =>
                    setCustomerPhone(e.target.value)
                  }
                  placeholder="03XX XXXXXXX"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Date & Time
                </label>

                <div className="flex min-h-12 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700">
                  {invoiceDate || "Loading..."}
                </div>
              </div>

            </div>
          </div>

          {/* ITEMS */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-slate-200 p-5">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Invoice Items
                </h2>

                <p className="text-sm text-slate-500">
                  Add products and quantities
                </p>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
              >
                + Add Item
              </button>

            </div>

            <div className="overflow-x-auto p-5">

              <table className="w-full min-w-200 border-collapse">

                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">

                    <th className="px-3 py-3">
                      #
                    </th>

                    <th className="px-3 py-3">
                      Product
                    </th>

                    <th className="px-3 py-3">
                      Quantity
                    </th>

                    <th className="px-3 py-3">
                      Rate
                    </th>

                    <th className="px-3 py-3 text-right">
                      Amount
                    </th>

                    <th className="px-3 py-3">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {items.map((item, index) => {

                    const amount =
                      Number(item.quantity || 0) *
                      Number(item.rate || 0);

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-200"
                      >

                        <td className="px-3 py-4 text-sm font-semibold">
                          {index + 1}
                        </td>

                        <td className="px-3 py-4">

                          <select
                            value={item.product}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "product",
                                e.target.value
                              )
                            }
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                          >

                            <option value="">
                              Select Product
                            </option>

                            {availableProducts.map(
                              (product) => (
                                <option
                                  key={product}
                                  value={product}
                                >
                                  {product}
                                </option>
                              )
                            )}

                          </select>

                        </td>

                        <td className="px-3 py-4">

                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "quantity",
                                e.target.value
                              )
                            }
                            className="w-28 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                          />

                        </td>

                        <td className="px-3 py-4">

                          <input
                            type="number"
                            min="0"
                            value={item.rate}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "rate",
                                e.target.value
                              )
                            }
                            className="w-32 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                          />

                        </td>

                        <td className="px-3 py-4 text-right font-bold text-slate-900">
                          {formatPrice(amount)}
                        </td>

                        <td className="px-3 py-4">

                          <button
                            type="button"
                            onClick={() =>
                              removeItem(item.id)
                            }
                            disabled={items.length === 1}
                            className="rounded-lg px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-300"
                          >
                            Remove
                          </button>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>

            {/* SUMMARY */}
            <div className="border-t border-slate-200 p-5">

              <div className="ml-auto max-w-md space-y-3">

                <div className="flex justify-between text-sm">

                  <span className="text-slate-500">
                    Subtotal
                  </span>

                  <span className="font-semibold">
                    {formatPrice(subtotal)}
                  </span>

                </div>

                <div className="flex justify-between text-sm">

                  <span className="text-slate-500">
                    Tax (5%)
                  </span>

                  <span className="font-semibold">
                    {formatPrice(tax)}
                  </span>

                </div>

                <div className="border-t border-dashed border-slate-300 pt-3">

                  <div className="flex justify-between">

                    <span className="text-lg font-bold">
                      Total
                    </span>

                    <span className="text-xl font-bold text-blue-600">
                      {formatPrice(total)}
                    </span>

                  </div>

                </div>

                {/* PAID */}
                <div className="flex items-center justify-between gap-4 pt-3">

                  <label className="text-sm font-semibold text-slate-700">
                    Paid Amount
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={paidAmount}
                    onChange={(e) =>
                      setPaidAmount(e.target.value)
                    }
                    placeholder="0"
                    className="w-40 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-right text-sm font-semibold outline-none focus:border-blue-500"
                  />

                </div>

                {/* REMAINING */}
                {paid > 0 &&
                  paid < total && (
                    <div className="flex justify-between rounded-xl bg-red-50 px-4 py-3">

                      <span className="font-bold text-red-600">
                        Remaining Balance
                      </span>

                      <span className="font-bold text-red-600">
                        {formatPrice(
                          remainingBalance
                        )}
                      </span>

                    </div>
                  )}

                {/* PAID */}
                {paid === total &&
                  paid > 0 && (
                    <div className="flex justify-between rounded-xl bg-green-50 px-4 py-3">

                      <span className="font-bold text-green-700">
                        Payment Status
                      </span>

                      <span className="font-bold text-green-600">
                        PAID
                      </span>

                    </div>
                  )}

                {/* CHANGE */}
                {paid > total && (
                  <div className="flex justify-between rounded-xl bg-green-50 px-4 py-3">

                    <span className="font-bold text-green-700">
                      Change
                    </span>

                    <span className="font-bold text-green-600">
                      {formatPrice(change)}
                    </span>

                  </div>
                )}

              </div>

            </div>

          </div>

        </div>
      </div>

      {/* PRINT VERSION */}
      <div className="invoice-print hidden">

        <div className="print-header">

          <div>
            <h1>HAFIZ RETAIL POS</h1>
            <p>Retail Sales Invoice</p>
          </div>

          <div className="print-invoice-number">
            {invoiceNumber}
          </div>

        </div>

        <div className="print-info">

          <div>
            <strong>Customer:</strong>{" "}
            {customerName || "Walk-in Customer"}
          </div>

          <div>
            <strong>Phone:</strong>{" "}
            {customerPhone || "-"}
          </div>

          <div>
            <strong>Date:</strong>{" "}
            {invoiceDate || "-"}
          </div>

        </div>

        <table className="print-table">

          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>

            {items
              .filter(
                (item) =>
                  item.product.trim() !== ""
              )
              .map((item, index) => {

                const amount =
                  Number(item.quantity || 0) *
                  Number(item.rate || 0);

                return (
                  <tr key={item.id}>

                    <td>
                      {index + 1}
                    </td>

                    <td>
                      {item.product}
                    </td>

                    <td>
                      {item.quantity}
                    </td>

                    <td>
                      {formatPrice(item.rate)}
                    </td>

                    <td>
                      {formatPrice(amount)}
                    </td>

                  </tr>
                );
              })}

          </tbody>

        </table>

        <div className="print-summary">

          <div>
            <span>Subtotal</span>
            <strong>
              {formatPrice(subtotal)}
            </strong>
          </div>

          <div>
            <span>Tax</span>
            <strong>
              {formatPrice(tax)}
            </strong>
          </div>

          <div className="print-total">
            <span>Total</span>
            <strong>
              {formatPrice(total)}
            </strong>
          </div>

          <div>
            <span>Paid</span>
            <strong>
              {formatPrice(paid)}
            </strong>
          </div>

          {remainingBalance > 0 && (
            <div className="print-balance">
              <span>Remaining Balance</span>
              <strong>
                {formatPrice(
                  remainingBalance
                )}
              </strong>
            </div>
          )}

          {change > 0 && (
            <div className="print-change">
              <span>Change</span>
              <strong>
                {formatPrice(change)}
              </strong>
            </div>
          )}

        </div>

        <div className="print-footer">
          Thank you for shopping with us!
        </div>

      </div>

      <style jsx global>{`
        @media print {

          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          body {
            background: white !important;
          }

          .invoice-print {
            display: block !important;
            width: 100%;
            font-family: Arial, Helvetica, sans-serif;
            color: #111827;
          }

          .print-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            border-bottom: 2px solid #111827;
            padding-bottom: 12px;
            margin-bottom: 15px;
          }

          .print-header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
          }

          .print-header p {
            margin: 4px 0 0;
            font-size: 13px;
            color: #4b5563;
          }

          .print-invoice-number {
            border: 1px solid #111827;
            padding: 8px 14px;
            font-size: 15px;
            font-weight: 700;
          }

          .print-info {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            border-bottom: 1px solid #9ca3af;
            padding-bottom: 12px;
            margin-bottom: 15px;
            font-size: 13px;
          }

          .print-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }

          .print-table th,
          .print-table td {
            border: 1px solid #374151;
            padding: 8px 10px;
            text-align: left;
          }

          .print-table th {
            background: #f3f4f6 !important;
            font-weight: 700;
          }

          .print-table th:nth-child(1),
          .print-table td:nth-child(1) {
            width: 45px;
            text-align: center;
          }

          .print-table th:nth-child(3),
          .print-table td:nth-child(3) {
            width: 90px;
            text-align: center;
          }

          .print-table th:nth-child(4),
          .print-table td:nth-child(4),
          .print-table th:nth-child(5),
          .print-table td:nth-child(5) {
            text-align: right;
          }

          .print-summary {
            width: 350px;
            margin-left: auto;
            margin-top: 18px;
            font-size: 13px;
          }

          .print-summary > div {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
          }

          .print-total {
            border-top: 2px solid #111827;
            border-bottom: 1px solid #111827;
            margin-top: 5px;
            padding: 8px 0 !important;
            font-size: 16px;
            font-weight: 800;
          }

          .print-balance {
            color: #b91c1c;
            font-weight: 700;
          }

          .print-change {
            color: #15803d;
            font-weight: 700;
          }

          .print-footer {
            border-top: 1px solid #9ca3af;
            margin-top: 25px;
            padding-top: 10px;
            text-align: center;
            font-size: 12px;
          }

        }
      `}</style>
    </>
  );
}