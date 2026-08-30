"use client";

import { averageBundleWeight, sumBundleWeights } from "./bundleUtils";

type Props = {
  weights: number[];
  onChange: (weights: number[]) => void;
  disabled?: boolean;
};

export default function BundleReview({ weights, onChange, disabled = false }: Props) {
  const totalWeight = sumBundleWeights(weights);
  const averageWeight = averageBundleWeight(weights);

  function updateWeight(index: number, rawValue: string) {
    const value = Number(rawValue);
    if (!Number.isFinite(value) || value <= 0) return;

    const next = [...weights];
    next[index] = value;
    onChange(next);
  }

  function removeWeight(index: number) {
    onChange(weights.filter((_, currentIndex) => currentIndex !== index));
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Bundle Review</h4>
          <p className="mt-1 text-xs text-slate-500">Check, edit, or remove bundle weights before saving.</p>
        </div>
        {weights.length > 0 && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (window.confirm("Clear all bundle weights?")) onChange([]);
            }}
            className="w-fit rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl bg-white px-4 py-3">
          <p className="text-xs text-slate-400">Total Bundles</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{weights.length}</p>
        </div>
        <div className="rounded-xl bg-white px-4 py-3">
          <p className="text-xs text-slate-400">Total Weight</p>
          <p className="mt-1 text-lg font-bold text-emerald-700">
            {totalWeight.toLocaleString("en-PK", { maximumFractionDigits: 2 })} KG
          </p>
        </div>
        <div className="rounded-xl bg-white px-4 py-3">
          <p className="text-xs text-slate-400">Average / Bundle</p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {averageWeight.toLocaleString("en-PK", { maximumFractionDigits: 2 })} KG
          </p>
        </div>
      </div>

      {weights.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-emerald-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          No bundles added yet.
        </div>
      ) : (
        <div className="mt-4 max-h-72 overflow-y-auto rounded-xl border border-emerald-100 bg-white">
          <div className="sticky top-0 z-[1] grid grid-cols-[90px_1fr_72px] gap-2 border-b border-slate-100 bg-white px-3 py-2 text-xs font-semibold uppercase text-slate-400">
            <span>Bundle</span>
            <span>Weight (KG)</span>
            <span className="text-right">Action</span>
          </div>

          {weights.map((weight, index) => (
            <div
              key={`${index}-${weight}`}
              className="grid grid-cols-[90px_1fr_72px] items-center gap-2 border-b border-slate-100 px-3 py-2 last:border-b-0"
            >
              <span className="text-xs font-bold text-slate-600">
                B-{String(index + 1).padStart(3, "0")}
              </span>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={weight}
                  disabled={disabled}
                  onBlur={(event) => updateWeight(index, event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      updateWeight(index, event.currentTarget.value);
                      event.currentTarget.blur();
                    }
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-sm outline-none focus:border-emerald-400 disabled:bg-slate-100"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                  KG
                </span>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeWeight(index)}
                className="rounded-lg px-2 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
