"use client";

import { useMemo, useState } from "react";
import { parseBundleInput, sumBundleWeights } from "./bundleUtils";

type Props = {
  weights: number[];
  onChange: (weights: number[]) => void;
  disabled?: boolean;
};

export default function BulkBundleEntry({ weights, onChange, disabled = false }: Props) {
  const [text, setText] = useState("");
  const preview = useMemo(() => parseBundleInput(text), [text]);
  const previewWeight = useMemo(() => sumBundleWeights(preview), [preview]);

  function importWeights(mode: "append" | "replace") {
    if (preview.length === 0) {
      alert("No valid bundle weights found. Paste weights first.");
      return;
    }

    onChange(mode === "replace" ? preview : [...weights, ...preview]);
    setText("");
  }

  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4">
      <div>
        <h4 className="text-sm font-bold text-slate-900">Bulk Paste</h4>
        <p className="mt-1 text-xs text-slate-500">
          Paste Excel, WhatsApp, space, comma, + sign, semicolon, or multiline weights.
        </p>
      </div>

      <textarea
        value={text}
        disabled={disabled}
        onChange={(event) => setText(event.target.value)}
        rows={5}
        placeholder={"34+60+70+56+56\nor\n34 60 70 56 56"}
        className="mt-4 w-full resize-y rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400 disabled:bg-slate-100"
      />

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-white px-4 py-3">
          <p className="text-xs text-slate-400">Detected Bundles</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{preview.length}</p>
        </div>
        <div className="rounded-xl bg-white px-4 py-3">
          <p className="text-xs text-slate-400">Detected Weight</p>
          <p className="mt-1 text-lg font-bold text-violet-700">
            {previewWeight.toLocaleString("en-PK", { maximumFractionDigits: 2 })} KG
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={disabled || preview.length === 0}
          onClick={() => importWeights("replace")}
          className="rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Replace Current List
        </button>
        <button
          type="button"
          disabled={disabled || preview.length === 0}
          onClick={() => importWeights("append")}
          className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add to Current List
        </button>
      </div>
    </div>
  );
}
