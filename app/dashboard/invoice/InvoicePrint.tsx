"use client";

import type {
  Customer,
  InvoiceItem,
  InvoiceStatus,
  InvoiceTotals,
  PaymentMethod,
} from "./invoiceTypes";

import {
  formatPrice,
} from "./InvoiceUtils";

type Props = {
  invoiceNumber: string;

  date: string;

  customer: Customer;

  items: InvoiceItem[];

  totals: InvoiceTotals;

  paymentMethod: PaymentMethod;

  status: InvoiceStatus;

  taxRate: number;

  notes?: string;
};

export default function InvoicePrint({
  invoiceNumber,
  date,
  customer,
  items,
  totals,
  paymentMethod,
  status,
  taxRate,
  notes = "",
}: Props) {
  const printableItems =
    items.filter(
      (item) =>
        item.productId !==
        null
    );

  return (
    <div
      id="invoice-print"
      className="hidden print:block"
    >
      <div className="mx-auto bg-white px-4 py-3 text-black">

        {/* =====================================
            HEADER
        ===================================== */}

        <div className="flex items-start justify-between border-b border-black pb-2">

          <div>

            <h1 className="text-lg font-bold leading-tight">
              HAFIZ RETAIL POS
            </h1>

            <p className="mt-0.5 text-[10px] leading-tight">
              Sales Invoice
            </p>

          </div>

          <div className="text-right">

            <h2 className="text-base font-bold leading-tight">
              INVOICE
            </h2>

            <p className="mt-0.5 text-[10px] leading-tight">
              {invoiceNumber}
            </p>

            <p className="text-[10px] leading-tight">
              Date: {date}
            </p>

          </div>

        </div>

        {/* =====================================
            CUSTOMER + PAYMENT
        ===================================== */}

        <div className="mt-2 grid grid-cols-2 gap-4">

          {/* CUSTOMER */}

          <div>

            <h3 className="text-[10px] font-bold uppercase">
              Bill To
            </h3>

            <div className="mt-1 space-y-0.5 text-[10px] leading-tight">

              <p>
                <strong>Name:</strong>{" "}
                {customer.name ||
                  "Walk-in Customer"}
              </p>

              {customer.phone && (
                <p>
                  <strong>Phone:</strong>{" "}
                  {customer.phone}
                </p>
              )}

              {customer.address && (
                <p>
                  <strong>Address:</strong>{" "}
                  {customer.address}
                </p>
              )}

            </div>

          </div>

          {/* PAYMENT */}

          <div className="text-right">

            <h3 className="text-[10px] font-bold uppercase">
              Payment
            </h3>

            <div className="mt-1 space-y-0.5 text-[10px] leading-tight">

              <p>
                <strong>Method:</strong>{" "}
                {paymentMethod}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {status}
              </p>

            </div>

          </div>

        </div>

        {/* =====================================
            ITEMS TABLE
        ===================================== */}

        <table className="mt-3 w-full table-fixed border-collapse text-[10px] leading-tight">

          <thead>

            <tr className="border-y border-black">

              <th className="w-[5%] py-1 text-left">
                #
              </th>

              <th className="w-[31%] py-1 text-left">
                Product
              </th>

              <th className="w-[16%] py-1 text-right">
                Qty / Weight
              </th>

              <th className="w-[16%] py-1 text-right">
                Price
              </th>

              <th className="w-[14%] py-1 text-right">
                Discount
              </th>

              <th className="w-[18%] py-1 text-right">
                Total
              </th>

            </tr>

          </thead>

          <tbody>

            {printableItems.map(
              (
                item,
                index
              ) => (

                <tr
                  key={
                    item.id
                  }
                  className="border-b border-gray-300"
                >

                  {/* INDEX */}

                  <td className="py-1 align-top">
                    {index + 1}
                  </td>

                  {/* PRODUCT */}

                  <td className="py-1 pr-2 align-top">

                    <div className="truncate font-semibold">
                      {item.name}
                    </div>

                    <div className="mt-0.5 text-[8px] leading-none text-gray-600">
                      {item.type ===
                      "weight"
                        ? "Weight Product"
                        : "Quantity Product"}
                    </div>

                  </td>

                  {/* QTY / WEIGHT */}

                  <td className="py-1 text-right align-top">

                    {item.type ===
                    "weight"
                      ? `${formatPrice(
                          item.weight
                        )} KG`
                      : `${formatPrice(
                          item.quantity
                        )} ${item.unit}`}

                  </td>

                  {/* PRICE */}

                  <td className="py-1 text-right align-top">
                    Rs.{" "}
                    {formatPrice(
                      item.price
                    )}
                  </td>

                  {/* DISCOUNT */}

                  <td className="py-1 text-right align-top">
                    Rs.{" "}
                    {formatPrice(
                      item.discount
                    )}
                  </td>

                  {/* TOTAL */}

                  <td className="py-1 text-right align-top font-semibold">
                    Rs.{" "}
                    {formatPrice(
                      item.total
                    )}
                  </td>

                </tr>

              )
            )}

          </tbody>

        </table>

        {/* =====================================
            BOTTOM AREA
        ===================================== */}

        <div className="mt-3 grid grid-cols-2 gap-6">

          {/* NOTES */}

          <div>

            {notes.trim() && (

              <div className="border-t pt-2">

                <h3 className="text-[10px] font-bold">
                  Notes
                </h3>

                <p className="mt-1 whitespace-pre-wrap text-[9px] leading-tight">
                  {notes}
                </p>

              </div>

            )}

          </div>

          {/* TOTALS */}

          <div className="ml-auto w-full max-w-xs space-y-1">

            <PrintRow
              label="Subtotal"
              value={`Rs. ${formatPrice(
                totals.subtotal
              )}`}
            />

            <PrintRow
              label="Discount"
              value={`Rs. ${formatPrice(
                totals.discount
              )}`}
            />

            <PrintRow
              label={`Tax (${taxRate}%)`}
              value={`Rs. ${formatPrice(
                totals.tax
              )}`}
            />

            <div className="border-t border-black pt-1">

              <PrintRow
                label="Grand Total"
                value={`Rs. ${formatPrice(
                  totals.grandTotal
                )}`}
                bold
              />

            </div>

            <PrintRow
              label="Paid"
              value={`Rs. ${formatPrice(
                totals.amountPaid
              )}`}
            />

            {totals.remaining >
              0 && (

              <PrintRow
                label="Remaining"
                value={`Rs. ${formatPrice(
                  totals.remaining
                )}`}
                bold
              />

            )}

            {totals.change >
              0 && (

              <PrintRow
                label="Change"
                value={`Rs. ${formatPrice(
                  totals.change
                )}`}
                bold
              />

            )}

          </div>

        </div>

        {/* =====================================
            FOOTER
        ===================================== */}

        <div className="mt-3 border-t border-black pt-2 text-center">

          <p className="text-[10px] font-semibold leading-tight">
            Thank you for your business!
          </p>

          <p className="mt-0.5 text-[8px] leading-tight">
            Hafiz Retail POS
          </p>

        </div>

      </div>
    </div>
  );
}

/* =========================================
   PRINT ROW
========================================= */

function PrintRow({
  label,
  value,
  bold = false,
}: {
  label: string;

  value: string;

  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-4 leading-tight ${
        bold
          ? "text-[11px] font-bold"
          : "text-[9px]"
      }`}
    >
      <span>
        {label}
      </span>

      <span className="text-right">
        {value}
      </span>
    </div>
  );
}