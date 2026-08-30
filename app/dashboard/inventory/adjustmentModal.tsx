"use client";

import {
  Loader2,
} from "lucide-react";

import type {
  InventoryItem,
} from "./inventoryTypes";

import {
  safeNumber,
} from "./inventoryUtils";

/* =====================================================
   PROPS
===================================================== */

type AdjustmentModalProps = {
  open: boolean;

  item:
    | InventoryItem
    | null;

  adjustmentType:
    | "add"
    | "remove";

  setAdjustmentType: (
    value:
      | "add"
      | "remove"
  ) => void;

  adjustmentAmount:
    string;

  setAdjustmentAmount: (
    value: string
  ) => void;

  saving: boolean;

  onClose: () => void;

  onSubmit: (
    event:
      React.FormEvent<HTMLFormElement>
  ) => void;
};

/* =====================================================
   WEIGHT HELPERS
===================================================== */

function parseWeightEntries(
  value: string
) {
  return value
    .split("+")
    .map((entry) =>
      safeNumber(
        entry.trim()
      )
    )
    .filter(
      (entry) =>
        entry > 0
    );
}

function calculateWeightTotal(
  value: string
) {
  return parseWeightEntries(
    value
  ).reduce(
    (
      total,
      weight
    ) =>
      total + weight,
    0
  );
}

function getBundleCount(
  value: string
) {
  return parseWeightEntries(
    value
  ).length;
}

function formatNumber(
  value: number
) {
  return value.toLocaleString(
    "en-PK",
    {
      maximumFractionDigits:
        2,
    }
  );
}

/* =====================================================
   ADJUSTMENT MODAL
===================================================== */

export default function AdjustmentModal({
  open,
  item,
  adjustmentType,
  setAdjustmentType,
  adjustmentAmount,
  setAdjustmentAmount,
  saving,
  onClose,
  onSubmit,
}: AdjustmentModalProps) {
  if (
    !open ||
    !item
  ) {
    return null;
  }

  /* =================================================
     PRODUCT TYPE
  ================================================= */

  const isWeightProduct =
    item.productType ===
    "weight";

  /* =================================================
     CURRENT WEIGHT ENTRIES
  ================================================= */

  const currentWeightEntries =
    isWeightProduct
      ? parseWeightEntries(
          item.weightEntries ||
            ""
        )
      : [];

  const currentBundleCount =
    currentWeightEntries.length;

  /* =================================================
     ADJUSTMENT VALUE
  ================================================= */

  const adjustmentWeightTotal =
    isWeightProduct &&
    adjustmentType ===
      "add"
      ? calculateWeightTotal(
          adjustmentAmount
        )
      : safeNumber(
          adjustmentAmount
        );

  const addedBundleCount =
    isWeightProduct &&
    adjustmentType ===
      "add"
      ? getBundleCount(
          adjustmentAmount
        )
      : 0;

  const amount =
    adjustmentWeightTotal;

  /* =================================================
     STOCK AFTER ADJUSTMENT
  ================================================= */

  const stockAfterAdjustment =
    Math.max(
      0,
      adjustmentType ===
        "add"
        ? item.stock +
            amount
        : item.stock -
            amount
    );

  /* =================================================
     BUNDLES AFTER ADJUSTMENT
  ================================================= */

  const bundlesAfterAdjustment =
    adjustmentType ===
      "add"
      ? currentBundleCount +
        addedBundleCount
      : currentBundleCount;

  /* =================================================
     VALIDATION
  ================================================= */

  const invalidRemove =
    adjustmentType ===
      "remove" &&
    amount > item.stock;

  const hasValidAmount =
    amount > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-3 sm:p-4">

      {/* =================================================
          CENTER WRAPPER
      ================================================= */}

      <div className="flex min-h-full items-start justify-center py-3 sm:items-center sm:py-6">

        {/* =================================================
            MODAL
        ================================================= */}

        <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6 sm:py-5">

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Adjust Stock
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {item.name}
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
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ×
            </button>

          </div>

          {/* =================================================
              CONTENT
          ================================================= */}

          <div className="max-h-[calc(100vh-100px)] overflow-y-auto">

            {/* =================================================
                CURRENT STOCK
            ================================================= */}

            <div className="px-5 pt-5 sm:px-6 sm:pt-6">

              <div className="rounded-2xl bg-slate-50 p-4">

                <p className="text-xs text-slate-500">
                  Current Stock
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {formatNumber(
                    item.stock
                  )}{" "}
                  {item.unit}
                </p>

                {/* =============================================
                    WEIGHT DETAILS
                ============================================= */}

                {isWeightProduct && (
                  <div className="mt-4 space-y-3">

                    <div className="flex items-center justify-between">

                      <span className="text-xs text-slate-500">
                        Total Bundles
                      </span>

                      <span className="text-sm font-bold text-slate-900">
                        {
                          currentBundleCount
                        }
                      </span>

                    </div>

                    {item.weightEntries && (
                      <div>

                        <p className="text-xs text-slate-500">
                          Weight Entries
                        </p>

                        <p className="mt-1 break-all text-sm font-medium leading-6 text-slate-700">
                          {
                            item.weightEntries
                          }
                        </p>

                      </div>
                    )}

                  </div>
                )}

              </div>

            </div>

            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={
                onSubmit
              }
              className="space-y-5 p-5 sm:p-6"
            >

              {/* ===============================================
                  ADJUSTMENT TYPE
              =============================================== */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Adjustment Type
                </label>

                <div className="grid grid-cols-2 gap-3">

                  <button
                    type="button"
                    disabled={
                      saving
                    }
                    onClick={() => {
                      setAdjustmentType(
                        "add"
                      );

                      setAdjustmentAmount(
                        ""
                      );
                    }}
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition sm:px-4 ${
                      adjustmentType ===
                      "add"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    + Add Stock
                  </button>

                  <button
                    type="button"
                    disabled={
                      saving
                    }
                    onClick={() => {
                      setAdjustmentType(
                        "remove"
                      );

                      setAdjustmentAmount(
                        ""
                      );
                    }}
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition sm:px-4 ${
                      adjustmentType ===
                      "remove"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    − Remove Stock
                  </button>

                </div>

              </div>

              {/* ===============================================
                  WEIGHT PRODUCT — ADD
              =============================================== */}

              {isWeightProduct &&
                adjustmentType ===
                  "add" && (
                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Bundle Weights
                      (KG)
                    </label>

                    <input
                      type="text"
                      value={
                        adjustmentAmount
                      }
                      onChange={(
                        event
                      ) => {
                        const value =
                          event.target.value;

                        const cleaned =
                          value.replace(
                            /[^0-9.+]/g,
                            ""
                          );

                        setAdjustmentAmount(
                          cleaned
                        );
                      }}
                      disabled={
                        saving
                      }
                      placeholder="Example: 45+34+34"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    />

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Har bundle ka
                      weight + se
                      separate karein.
                      Example:
                      45+34+34
                    </p>

                    {/* =========================================
                        ADDED WEIGHT + BUNDLES
                    ========================================= */}

                    {hasValidAmount && (
                      <div className="mt-4 grid grid-cols-2 gap-3">

                        <div className="rounded-2xl bg-slate-50 p-4">

                          <p className="text-xs text-slate-500">
                            Added Weight
                          </p>

                          <p className="mt-1 text-xl font-bold text-slate-900">
                            {formatNumber(
                              amount
                            )}{" "}
                            KG
                          </p>

                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">

                          <p className="text-xs text-slate-500">
                            Added Bundles
                          </p>

                          <p className="mt-1 text-xl font-bold text-slate-900">
                            {
                              addedBundleCount
                            }
                          </p>

                        </div>

                      </div>
                    )}

                  </div>
                )}

              {/* ===============================================
                  WEIGHT PRODUCT — REMOVE
              =============================================== */}

              {isWeightProduct &&
                adjustmentType ===
                  "remove" && (
                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Remove Weight
                      (KG)
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        adjustmentAmount
                      }
                      onChange={(
                        event
                      ) =>
                        setAdjustmentAmount(
                          event.target
                            .value
                        )
                      }
                      disabled={
                        saving
                      }
                      placeholder="Enter KG to remove"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    />

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Weight FIFO
                      basis par old
                      bundles se remove
                      hoga.
                    </p>

                  </div>
                )}

              {/* ===============================================
                  QUANTITY / SIZE PRODUCT
              =============================================== */}

              {!isWeightProduct && (
                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Quantity (
                    {item.unit})
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={
                      adjustmentAmount
                    }
                    onChange={(
                      event
                    ) =>
                      setAdjustmentAmount(
                        event.target
                          .value
                      )
                    }
                    disabled={
                      saving
                    }
                    placeholder={`Enter ${item.unit}`}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  />

                </div>
              )}

              {/* ===============================================
                  PREVIEW
              =============================================== */}

              {hasValidAmount && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">

                  <p className="text-xs font-semibold text-blue-600">
                    Stock After
                    Adjustment
                  </p>

                  <p className="mt-1 text-2xl font-bold text-blue-900">
                    {formatNumber(
                      stockAfterAdjustment
                    )}{" "}
                    {item.unit}
                  </p>

                  {/* =========================================
                      WEIGHT ADD PREVIEW
                  ========================================= */}

                  {isWeightProduct &&
                    adjustmentType ===
                      "add" && (
                      <div className="mt-4 space-y-3 border-t border-blue-100 pt-4">

                        <div className="flex items-center justify-between">

                          <span className="text-xs text-blue-600">
                            Total Bundles
                          </span>

                          <span className="text-sm font-bold text-blue-900">
                            {
                              bundlesAfterAdjustment
                            }
                          </span>

                        </div>

                        <div>

                          <p className="text-xs text-blue-600">
                            New Entries
                          </p>

                          <p className="mt-1 break-all text-sm font-semibold leading-6 text-blue-900">
                            {item.weightEntries
                              ? `${item.weightEntries}+${adjustmentAmount}`
                              : adjustmentAmount}
                          </p>

                        </div>

                      </div>
                    )}

                </div>
              )}

              {/* ===============================================
                  REMOVE WARNING
              =============================================== */}

              {invalidRemove && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3">

                  <p className="text-sm font-medium text-red-700">
                    Cannot remove{" "}
                    {formatNumber(
                      amount
                    )}{" "}
                    {item.unit}.
                    Current stock is
                    only{" "}
                    {formatNumber(
                      item.stock
                    )}{" "}
                    {item.unit}.
                  </p>

                </div>
              )}

              {/* ===============================================
                  FOOTER
              =============================================== */}

              <div className="sticky bottom-0 z-10 -mx-5 flex gap-3 border-t border-slate-200 bg-white px-5 pb-1 pt-5 sm:-mx-6 sm:px-6">

                <button
                  type="button"
                  onClick={
                    onClose
                  }
                  disabled={
                    saving
                  }
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    !hasValidAmount ||
                    invalidRemove
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      Saving...
                    </>
                  ) : (
                    "Update Stock"
                  )}
                </button>

              </div>

            </form>

          </div>

        </div>

      </div>

    </div>
  );
}