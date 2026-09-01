"use client";

import { useRef, useState } from "react";

type Props = {
  weights: number[];
  onChange: (weights: number[]) => void;
  disabled?: boolean;
};

export default function QuickBundleEntry({ weights, onChange, disabled = false }: Props) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addBundle() {
    const weight = Number(value.trim());

    if (!Number.isFinite(weight) || weight <= 0) {
      alert("Please enter a valid bundle weight greater than 0 KG.");
      inputRef.current?.focus();
      return;
    }

    onChange([...weights, weight]);
    setValue("");

    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Quick Bundle Entry</h4>
          <p className="mt-1 text-xs text-slate-500">Type one bundle weight and press Enter.</p>
        </div>
        <span className="mt-2 inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 sm:mt-0">
          Next: B-{String(weights.length + 1).padStart(3, "0")}
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={value}
            disabled={disabled}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addBundle();
              }
            }}
            placeholder="e.g. 34"
            className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 pr-12 text-sm outline-none focus:border-blue-400 disabled:bg-slate-100"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
            KG
          </span>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={addBundle}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add Bundle
        </button>
      </div>
    </div>
  );
}
