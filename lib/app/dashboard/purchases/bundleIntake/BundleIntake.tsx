"use client";

import { useMemo, useState } from "react";
import QuickBundleEntry from "./QuickBundleEntry";
import BulkBundleEntry from "./BulkBundleEntry";
import BundleReview from "./BundleReview";
import ScanBundleBill from "./ScanBundleBill";
import { parseBundleInput, serializeBundleWeights } from "./bundleUtils";

type Tab = "quick" | "bulk" | "review" | "scan";

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function BundleIntake({ value, onChange, disabled = false }: Props) {
  const [tab, setTab] = useState<Tab>("quick");
  const weights = useMemo(() => parseBundleInput(value), [value]);

  function updateWeights(next: number[]) {
    onChange(serializeBundleWeights(next));
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "quick", label: "Quick Entry" },
    { id: "bulk", label: "Bulk Paste" },
    { id: "review", label: `Review (${weights.length})` },
    { id: "scan", label: "Scan Bill" },
  ];

  return (
    <div className="mt-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-2">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition sm:text-sm ${
                tab === item.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        {tab === "quick" && (
          <QuickBundleEntry weights={weights} onChange={updateWeights} disabled={disabled} />
        )}
        {tab === "bulk" && (
          <BulkBundleEntry weights={weights} onChange={updateWeights} disabled={disabled} />
        )}
        {tab === "review" && (
          <BundleReview weights={weights} onChange={updateWeights} disabled={disabled} />
        )}
        {tab === "scan" && (
          <ScanBundleBill currentWeights={weights} onConfirm={updateWeights} disabled={disabled} />
        )}
      </div>

      {weights.length > 0 && tab !== "review" && (
        <button
          type="button"
          onClick={() => setTab("review")}
          className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Review {weights.length} Bundles Before Save
        </button>
      )}
    </div>
  );
}
