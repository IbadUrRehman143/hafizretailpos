"use client";

import type {
  InvoiceStatus,
  InvoiceTotals,
  PaymentMethod,
} from "./invoiceTypes";

import {
  formatPrice,
} from "./InvoiceUtils";

type Props = {
  totals: InvoiceTotals;

  paymentMethod: PaymentMethod;

  setPaymentMethod: (
    value: PaymentMethod
  ) => void;

  amountPaid: number;

  setAmountPaid: (
    value: number
  ) => void;

  taxRate: number;

  setTaxRate: (
    value: number
  ) => void;

  status: InvoiceStatus;
};

export default function InvoiceSummary({
  totals,
  paymentMethod,
  setPaymentMethod,
  amountPaid,
  setAmountPaid,
  taxRate,
  setTaxRate,
  status,
}: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">

      {/* =====================================
          PAYMENT
      ===================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <h2 className="text-lg font-bold text-slate-900">
          Payment
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Select payment method, tax and received amount.
        </p>

        {/* PAYMENT METHOD */}

        <div className="mt-5">

          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Payment Method
          </label>

          <select
            value={paymentMethod}
            onChange={(event) =>
              setPaymentMethod(
                event.target.value as PaymentMethod
              )
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
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

        {/* TAX RATE */}

        <div className="mt-4">

          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Tax Rate (%)
          </label>

          <div className="relative">

            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={taxRate}
              onChange={(event) => {
                const value =
                  Number(event.target.value) || 0;

                setTaxRate(
                  Math.min(
                    100,
                    Math.max(
                      0,
                      value
                    )
                  )
                );
              }}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 font-semibold outline-none focus:border-blue-500"
            />

            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-slate-400">
              %
            </span>

          </div>

          <p className="mt-1 text-xs text-slate-500">
            Default tax is 0%. Enter tax only when required.
          </p>

        </div>

        {/* AMOUNT PAID */}

        <div className="mt-4">

          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Amount Paid
          </label>

          <div className="relative">

            <input
              type="number"
              min="0"
              step="any"
              value={amountPaid}
              onChange={(event) =>
                setAmountPaid(
                  Math.max(
                    0,
                    Number(
                      event.target.value
                    ) || 0
                  )
                )
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-14 text-lg font-semibold outline-none focus:border-blue-500"
            />

            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
              Rs.
            </span>

          </div>

        </div>

        {/* PAYMENT STATUS */}

        <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 p-4">

          <span className="text-sm font-semibold text-slate-600">
            Payment Status
          </span>

          <StatusBadge
            status={status}
          />

        </div>

      </section>

      {/* =====================================
          INVOICE SUMMARY
      ===================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <h2 className="text-lg font-bold text-slate-900">
          Invoice Summary
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Complete invoice calculation.
        </p>

        <div className="mt-5 space-y-4">

          {/* SUBTOTAL */}

          <SummaryRow
            label="Subtotal"
            value={`Rs. ${formatPrice(
              totals.subtotal
            )}`}
          />

          {/* DISCOUNT */}

          <SummaryRow
            label="Discount"
            value={`- Rs. ${formatPrice(
              totals.discount
            )}`}
          />

          {/* TAX */}

          <SummaryRow
            label={`Tax (${taxRate}%)`}
            value={`Rs. ${formatPrice(
              totals.tax
            )}`}
          />

          <div className="border-t border-slate-200" />

          {/* GRAND TOTAL */}

          <div className="flex items-center justify-between">

            <span className="font-bold text-slate-900">
              Grand Total
            </span>

            <span className="text-2xl font-bold text-slate-900">
              Rs.{" "}
              {formatPrice(
                totals.grandTotal
              )}
            </span>

          </div>

          <div className="border-t border-slate-100" />

          {/* AMOUNT PAID */}

          <SummaryRow
            label="Amount Paid"
            value={`Rs. ${formatPrice(
              totals.amountPaid
            )}`}
          />

          {/* REMAINING */}

          {totals.remaining > 0 && (

            <div className="flex items-center justify-between rounded-xl bg-red-50 p-4">

              <span className="font-semibold text-red-700">
                Remaining
              </span>

              <span className="font-bold text-red-700">
                Rs.{" "}
                {formatPrice(
                  totals.remaining
                )}
              </span>

            </div>

          )}

          {/* CHANGE */}

          {totals.change > 0 && (

            <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-4">

              <span className="font-semibold text-emerald-700">
                Change
              </span>

              <span className="font-bold text-emerald-700">
                Rs.{" "}
                {formatPrice(
                  totals.change
                )}
              </span>

            </div>

          )}

        </div>

      </section>

    </div>
  );
}

/* =========================================
   SUMMARY ROW
========================================= */

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">

      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="font-semibold text-slate-900">
        {value}
      </span>

    </div>
  );
}

/* =========================================
   STATUS BADGE
========================================= */

function StatusBadge({
  status,
}: {
  status: InvoiceStatus;
}) {
  const styles =
    status === "Paid"
      ? "bg-emerald-100 text-emerald-700"
      : status === "Partial"
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${styles}`}
    >
      {status}
    </span>
  );
}