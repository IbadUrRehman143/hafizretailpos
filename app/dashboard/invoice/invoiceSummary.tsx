"use client";

import type {
  InvoiceStatus,
  InvoiceTotals,
  PaymentMethod,
} from "./invoiceTypes";

import {
  formatPrice,
} from "./InvoiceUtils";

/* =========================================
   PROPS
========================================= */

type Props = {
  totals: InvoiceTotals;

  paymentMethod: PaymentMethod;

  setPaymentMethod: (
    value: PaymentMethod
  ) => void;

  /*
   * String rakha hai taa-ke:
   * - blank field detect ho
   * - number arrows na hon
   * - required validation proper ho
   */
  amountPaid: string;

  setAmountPaid: (
    value: string
  ) => void;

  taxRate: string;

  setTaxRate: (
    value: string
  ) => void;

  status: InvoiceStatus;

  disabled?: boolean;
};

/* =========================================
   HELPERS
========================================= */

function cleanDecimal(
  value: string
) {
  /*
   * Sirf:
   * 0-9
   * aur ek decimal point
   */

  let clean =
    value.replace(
      /[^0-9.]/g,
      ""
    );

  const firstDot =
    clean.indexOf(".");

  if (
    firstDot !== -1
  ) {
    clean =
      clean.slice(
        0,
        firstDot + 1
      ) +
      clean
        .slice(
          firstDot + 1
        )
        .replace(
          /\./g,
          ""
        );
  }

  return clean;
}

function safeNumber(
  value:
    | string
    | number
) {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}

/* =========================================
   COMPONENT
========================================= */

export default function InvoiceSummary({
  totals,

  paymentMethod,

  setPaymentMethod,

  amountPaid,

  setAmountPaid,

  taxRate,

  setTaxRate,

  status,

  disabled = false,
}: Props) {
  const grandTotal =
    Math.max(
      0,
      safeNumber(
        totals.grandTotal
      )
    );

  const paid =
    Math.max(
      0,
      safeNumber(
        amountPaid
      )
    );

  /*
   * Initial Invoice:
   *
   * Received Later = 0
   *
   * Later payment Sales page
   * se receive hoga.
   */

  const receivedLater =
    0;

  const remaining =
    Math.max(
      0,
      grandTotal -
        paid
    );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* HEADER */}

      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-900">
          Payment Summary
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Initial payment and invoice totals
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT */}

        <div className="space-y-4">
          {/* PAYMENT METHOD */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Payment Method{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <select
              value={
                paymentMethod
              }
              disabled={
                disabled
              }
              required
              onChange={(
                event
              ) =>
                setPaymentMethod(
                  event.target
                    .value as PaymentMethod
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
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

          {/* INITIAL PAID */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Initial Paid Amount{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <input
              /*
               * type=text deliberately.
               *
               * Is se browser ke
               * ↑ ↓ number arrows
               * nahi aayenge.
               */
              type="text"
              inputMode="decimal"
              value={
                amountPaid
              }
              required
              disabled={
                disabled
              }
              onChange={(
                event
              ) => {
                setAmountPaid(
                  cleanDecimal(
                    event.target
                      .value
                  )
                );
              }}
              placeholder="30000"
              autoComplete="off"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
            />

            <p className="mt-2 text-xs text-slate-500">
              Example: 30000
            </p>
          </div>

          {/* TAX */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Tax %{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <input
              type="text"
              inputMode="decimal"
              value={
                taxRate
              }
              required
              disabled={
                disabled
              }
              onChange={(
                event
              ) => {
                setTaxRate(
                  cleanDecimal(
                    event.target
                      .value
                  )
                );
              }}
              placeholder="0"
              autoComplete="off"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>

          {/* STATUS */}

          <div>
            <p className="mb-2 block text-sm font-semibold text-slate-700">
              Payment Status
            </p>

            <StatusBadge
              status={
                status
              }
            />
          </div>

          {/* RECEIVED INFO */}

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-bold text-blue-900">
              Received Later
            </p>

            <p className="mt-1 text-xs leading-5 text-blue-700">
              Is field mein kuch enter nahi karna.
              Customer baad mein payment kare to
              Sales page → Receive Payment se amount
              receive hoga. Wo Customer history mein
              Received Amount banega.
            </p>
          </div>
        </div>

        {/* RIGHT TOTALS */}

        <div className="rounded-2xl bg-slate-50 p-5">
          <div className="space-y-4">
            <SummaryRow
              label="Subtotal"
              value={`Rs. ${formatPrice(
                totals.subtotal
              )}`}
            />

            <SummaryRow
              label="Discount"
              value={`Rs. ${formatPrice(
                totals.discount
              )}`}
            />

            <SummaryRow
              label={`Tax (${safeNumber(
                taxRate
              )}%)`}
              value={`Rs. ${formatPrice(
                totals.tax
              )}`}
            />

            {/* GRAND TOTAL */}

            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="text-base font-bold text-slate-900">
                Grand Total
              </span>

              <span className="text-xl font-bold text-blue-700">
                Rs.{" "}
                {formatPrice(
                  grandTotal
                )}
              </span>
            </div>

            {/* INITIAL PAID */}

            <SummaryRow
              label="Initial Paid"
              value={`Rs. ${formatPrice(
                paid
              )}`}
            />

            {/* RECEIVED LATER */}

            <SummaryRow
              label="Received Later"
              value={`Rs. ${formatPrice(
                receivedLater
              )}`}
            />

            {/* TOTAL PAID */}

            <SummaryRow
              label="Total Paid"
              value={`Rs. ${formatPrice(
                paid +
                  receivedLater
              )}`}
            />

            {/* REMAINING */}

            <div
              className={`flex items-center justify-between rounded-xl p-4 ${
                remaining > 0
                  ? "bg-red-50"
                  : "bg-emerald-50"
              }`}
            >
              <span
                className={`font-semibold ${
                  remaining > 0
                    ? "text-red-700"
                    : "text-emerald-700"
                }`}
              >
                Remaining
              </span>

              <span
                className={`text-lg font-bold ${
                  remaining > 0
                    ? "text-red-700"
                    : "text-emerald-700"
                }`}
              >
                Rs.{" "}
                {formatPrice(
                  remaining
                )}
              </span>
            </div>

            {/* INITIAL CHANGE */}

            <div className="flex items-center justify-between rounded-xl bg-slate-100 p-4">
              <span className="font-semibold text-slate-600">
                Change
              </span>

              <span className="text-lg font-bold text-slate-700">
                Rs. 0
              </span>
            </div>

            <p className="text-xs leading-5 text-slate-500">
              Change initial invoice par 0 rahega.
              Later Receive Payment ki latest amount
              Customer/Sales record mein Change ke
              tor par update hogi.
            </p>
          </div>
        </div>
      </div>
    </section>
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
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-right text-sm font-semibold text-slate-900">
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
  const className =
    status === "Paid"
      ? "bg-emerald-100 text-emerald-700"
      : status ===
          "Partial"
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";

  return (
    <span
      className={`inline-flex rounded-full px-4 py-2 text-xs font-bold ${className}`}
    >
      {status}
    </span>
  );
}