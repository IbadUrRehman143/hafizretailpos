"use client";

import type { FormEvent } from "react";
import type { InventoryItem } from "./inventoryTypes";

type AdjustmentType = "add" | "remove";

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
}: {
  open: boolean;
  item: InventoryItem | null;
  adjustmentType: AdjustmentType;
  setAdjustmentType: (value: AdjustmentType) => void;
  adjustmentAmount: string;
  setAdjustmentAmount: (value: string) => void;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (!open || !item) return null;

  const isWeight = item.productType === "weight";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Stock Adjustment
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {item.name} · Current stock: {item.stock} {item.unit}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 p-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Adjustment Type
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAdjustmentType("add")}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                  adjustmentType === "add"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                + Add Stock
              </button>

              <button
                type="button"
                onClick={() => setAdjustmentType("remove")}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                  adjustmentType === "remove"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                − Remove Stock
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              {isWeight && adjustmentType === "add"
                ? "Bundle Weights"
                : isWeight
                  ? "Weight"
                  : "Quantity"}
            </label>

            <input
              type="text"
              value={adjustmentAmount}
              onChange={(event) => setAdjustmentAmount(event.target.value)}
              placeholder={
                isWeight && adjustmentType === "add"
                  ? "Example: 45+34+56"
                  : isWeight
                    ? "Example: 20"
                    : "Example: 5"
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
            />

            {isWeight && adjustmentType === "add" && (
              <p className="mt-2 text-xs text-slate-500">
                Har physical bundle ka exact KG alag enter karein, + se separate.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Adjustment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
