"use client";

import {
  useState,
} from "react";

import type {
  PaymentMethod,
  Sale,
} from "./page";

type Props = {
  sale: Sale;

  onClose:
    () => void;

  onSuccess:
    () =>
      | void
      | Promise<void>;
};

async function getErrorMessage(
  response: Response
) {
  try {
    const data =
      (await response.json()) as {
        message?: string;
      };

    return (
      data.message ||
      "Something went wrong."
    );
  } catch {
    return "Something went wrong.";
  }
}

function currency(
  value: number
) {
  return `Rs. ${Number(
    value || 0
  ).toLocaleString(
    "en-PK",
    {
      maximumFractionDigits:
        2,
    }
  )}`;
}

export default function ReceivePaymentModal({
  sale,
  onClose,
  onSuccess,
}: Props) {
  const [
    amount,
    setAmount,
  ] =
    useState(
      ""
    );

  const [
    method,
    setMethod,
  ] =
    useState<PaymentMethod>(
      "Cash"
    );

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const paymentAmount =
    Math.max(
      0,
      Number(
        amount
      ) || 0
    );

  const afterRemaining =
    Math.max(
      0,
      sale.remainingAmount -
        paymentAmount
    );

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      saving
    ) {
      return;
    }

    setError("");

    if (
      paymentAmount <=
      0
    ) {
      setError(
        "Payment amount must be greater than 0."
      );

      return;
    }

    if (
      paymentAmount >
      sale.remainingAmount
    ) {
      setError(
        `Maximum payment is ${currency(
          sale.remainingAmount
        )}.`
      );

      return;
    }

    try {
      setSaving(
        true
      );

      const response =
        await fetch(
          `/api/invoices/${sale.id}/payments`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                amount:
                  paymentAmount,

                method,
              }),
          }
        );

      if (
        !response.ok
      ) {
        throw new Error(
          await getErrorMessage(
            response
          )
        );
      }

      const data =
        (await response.json()) as {
          message?: string;
        };

      alert(
        data.message ||
          "Payment received successfully."
      );

      await onSuccess();
    } catch (error) {
      console.error(
        "PAYMENT ERROR:",
        error
      );

      setError(
        error instanceof
          Error
          ? error.message
          : "Unable to receive payment."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-start justify-between border-b p-6">

          <div>

            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              Customer Payment
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Receive Payment
            </h2>

            <p className="mt-1 text-sm font-semibold text-blue-700">
              {sale.invoiceNo}
            </p>

          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              saving
            }
            className="h-10 w-10 rounded-full bg-slate-100 text-xl"
          >
            ×
          </button>

        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-5 p-6"
        >

          {error && (

            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>

          )}

          {/* CUSTOMER */}

          <div className="rounded-2xl bg-slate-50 p-4">

            <p className="text-xs text-slate-500">
              Customer
            </p>

            <p className="mt-1 font-bold">
              {sale.customerName}
            </p>

            {sale.customerPhone && (

              <p className="text-sm text-slate-500">
                {sale.customerPhone}
              </p>

            )}

          </div>

          {/* BALANCE */}

          <div className="grid grid-cols-3 gap-3">

            <BalanceCard
              label="Invoice Total"
              value={
                currency(
                  sale.grandTotal
                )
              }
            />

            <BalanceCard
              label="Already Paid"
              value={
                currency(
                  sale.paidAmount
                )
              }
            />

            <BalanceCard
              label="Remaining"
              value={
                currency(
                  sale.remainingAmount
                )
              }
              strong
            />

          </div>

          {/* AMOUNT */}

          <label className="block">

            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Receive Amount
            </span>

            <input
              type="number"
              min="0"
              max={
                sale.remainingAmount
              }
              step="0.01"
              value={
                amount
              }
              onChange={(
                event
              ) =>
                setAmount(
                  event.target.value
                )
              }
              placeholder="0"
              disabled={
                saving
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />

          </label>

          {/* PAYMENT METHOD */}

          <label className="block">

            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Payment Method
            </span>

            <select
              value={
                method
              }
              onChange={(
                event
              ) =>
                setMethod(
                  event.target.value as PaymentMethod
                )
              }
              disabled={
                saving
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none"
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

          </label>

          {/* PREVIEW */}

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">

            <div className="flex justify-between text-sm">

              <span className="text-slate-600">
                Receiving
              </span>

              <span className="font-bold text-emerald-700">
                {currency(
                  paymentAmount
                )}
              </span>

            </div>

            <div className="mt-2 flex justify-between border-t border-emerald-200 pt-2">

              <span className="font-semibold text-slate-700">
                Remaining After Payment
              </span>

              <span className="font-bold text-slate-900">
                {currency(
                  afterRemaining
                )}
              </span>

            </div>

          </div>

          {/* BUTTONS */}

          <div className="flex gap-3 border-t pt-5">

            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                saving
              }
              className="flex-1 rounded-xl border px-5 py-3 text-sm font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                sale.remainingAmount <=
                  0
              }
              className="flex-1 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Receiving..."
                : "Receive Payment"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

function BalanceCard({
  label,
  value,
  strong = false,
}: {
  label: string;

  value: string;

  strong?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 ${
        strong
          ? "bg-red-50"
          : "bg-slate-50"
      }`}
    >

      <p className="text-[11px] text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1 text-sm font-bold ${
          strong
            ? "text-red-600"
            : "text-slate-900"
        }`}
      >
        {value}
      </p>

    </div>
  );
}