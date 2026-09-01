"use client";

import { useState } from "react";

type CheckoutProps = {
  subtotal: number;
  tax: number;
  total: number;
  onConfirm: (
    paymentMethod: string,
    amountReceived: number
  ) => void;
};

export default function Checkout({
  subtotal,
  tax,
  total,
  onConfirm,
}: CheckoutProps) {
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [amountReceived, setAmountReceived] = useState("");

  // Safety: undefined / NaN se bachne ke liye
  const safeSubtotal = Number(subtotal) || 0;
  const safeTax = Number(tax) || 0;
  const safeTotal = Number(total) || 0;

  const received = Number(amountReceived) || 0;

  // Customer ne kam payment ki
  const remainingBalance =
    Math.max(0, safeTotal - received);

  // Customer ne zyada payment ki
  const change =
    Math.max(0, received - safeTotal);

  const formatPrice = (price: number) =>
    `Rs. ${Number(price || 0).toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleConfirm = () => {
    // Cash ke liye amount 0 allow nahi
    if (paymentMethod === "Cash" && received <= 0) {
      alert("Please enter received amount.");
      return;
    }

    /*
      IMPORTANT:
      Partial payment allow hai.

      Example:
      Total = 50,000
      Received = 30,000
      Remaining = 20,000

      Sale complete ho jayegi.
    */

    onConfirm(
      paymentMethod,
      received
    );
  };

  return (
    <div className="space-y-5">

      {/* PAYMENT METHOD */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Payment Method
        </label>

        <div className="grid grid-cols-3 gap-2">

          {["Cash", "Card", "Bank"].map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => {
                setPaymentMethod(method);

                // Card/Bank par previous cash amount clear
                if (method !== "Cash") {
                  setAmountReceived("");
                }
              }}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                paymentMethod === method
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {method}
            </button>
          ))}

        </div>
      </div>

      {/* CASH AMOUNT */}
      {paymentMethod === "Cash" && (
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Amount Received
          </label>

          <input
            type="number"
            min="0"
            value={amountReceived}
            onChange={(event) =>
              setAmountReceived(event.target.value)
            }
            placeholder="Enter received amount"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>
      )}

      {/* ORDER SUMMARY */}
      <div className="rounded-xl bg-slate-50 p-4">

        <div className="space-y-3">

          {/* SUBTOTAL */}
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">
              Subtotal
            </span>

            <span className="font-medium text-slate-800">
              {formatPrice(safeSubtotal)}
            </span>
          </div>

          {/* TAX */}
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">
              Tax
            </span>

            <span className="font-medium text-slate-800">
              {formatPrice(safeTax)}
            </span>
          </div>

          {/* TOTAL */}
          <div className="border-t border-dashed border-slate-200 pt-3">

            <div className="flex justify-between">

              <span className="font-bold text-slate-900">
                Total
              </span>

              <span className="font-bold text-blue-600">
                {formatPrice(safeTotal)}
              </span>

            </div>

          </div>

          {/* RECEIVED */}
          {paymentMethod === "Cash" &&
            received > 0 && (
              <div className="flex justify-between text-sm">

                <span className="font-medium text-slate-600">
                  Received
                </span>

                <span className="font-bold text-slate-900">
                  {formatPrice(received)}
                </span>

              </div>
            )}

          {/* REMAINING BALANCE */}
          {paymentMethod === "Cash" &&
            received > 0 &&
            received < safeTotal && (
              <div className="flex justify-between rounded-lg bg-red-50 px-3 py-2 text-sm">

                <span className="font-semibold text-red-600">
                  Remaining Balance
                </span>

                <span className="font-bold text-red-600">
                  {formatPrice(remainingBalance)}
                </span>

              </div>
            )}

          {/* FULL PAYMENT */}
          {paymentMethod === "Cash" &&
            received === safeTotal &&
            received > 0 && (
              <div className="flex justify-between rounded-lg bg-green-50 px-3 py-2 text-sm">

                <span className="font-semibold text-green-700">
                  Payment Status
                </span>

                <span className="font-bold text-green-600">
                  Paid
                </span>

              </div>
            )}

          {/* CHANGE */}
          {paymentMethod === "Cash" &&
            received > safeTotal && (
              <div className="flex justify-between rounded-lg bg-green-50 px-3 py-2 text-sm">

                <span className="font-semibold text-green-700">
                  Change
                </span>

                <span className="font-bold text-green-600">
                  {formatPrice(change)}
                </span>

              </div>
            )}

          {/* CARD / BANK */}
          {paymentMethod !== "Cash" && (
            <div className="flex justify-between rounded-lg bg-blue-50 px-3 py-2 text-sm">

              <span className="font-semibold text-blue-700">
                Payment
              </span>

              <span className="font-bold text-blue-600">
                Full Payment
              </span>

            </div>
          )}

        </div>
      </div>

      {/* CONFIRM SALE */}
      <button
        type="button"
        onClick={handleConfirm}
        className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-[0.99]"
      >
        Confirm Sale
      </button>

    </div>
  );
}