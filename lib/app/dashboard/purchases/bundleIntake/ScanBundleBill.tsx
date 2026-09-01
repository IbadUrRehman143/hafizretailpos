"use client";

import { useMemo, useRef, useState } from "react";

type ScanCandidate = {
  value: number;
  confidence?: number;
  uncertain?: boolean;
};

type Props = {
  currentWeights: number[];
  onConfirm: (weights: number[]) => void;
  disabled?: boolean;
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

export default function ScanBundleBill({ currentWeights, onConfirm, disabled = false }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [candidates, setCandidates] = useState<ScanCandidate[]>([]);
  const [mode, setMode] = useState<"replace" | "append">("replace");

  const total = useMemo(
    () => candidates.reduce((sum, item) => sum + (Number.isFinite(item.value) ? item.value : 0), 0),
    [candidates],
  );

  function chooseFile(nextFile?: File) {
    if (!nextFile) return;
    if (!nextFile.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (nextFile.size > 10 * 1024 * 1024) {
      setError("Image is too large. Maximum size is 10 MB.");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setCandidates([]);
    setError("");
  }

  async function scanBill() {
    if (!file || scanning || disabled) return;
    setScanning(true);
    setError("");

    try {
      const imageDataUrl = await fileToDataUrl(file);
      const response = await fetch("/api/purchases/scan-bundle-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(String(payload?.error || "Bundle bill scan failed."));
      }

      const nextCandidates = Array.isArray(payload?.weights)
        ? payload.weights
            .map((item: unknown) => {
              if (typeof item === "number") return { value: item, confidence: 1, uncertain: false };
              if (!item || typeof item !== "object") return null;
              const record = item as Record<string, unknown>;
              const value = Number(record.value);
              if (!Number.isFinite(value) || value <= 0) return null;
              const confidence = Number(record.confidence);
              return {
                value,
                confidence: Number.isFinite(confidence) ? confidence : undefined,
                uncertain: Boolean(record.uncertain),
              } satisfies ScanCandidate;
            })
            .filter((item: ScanCandidate | null): item is ScanCandidate => item !== null)
        : [];

      if (nextCandidates.length === 0) {
        throw new Error("No bundle weights were detected. Try a clearer photo or enter weights manually.");
      }

      setCandidates(nextCandidates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bundle bill scan failed.");
    } finally {
      setScanning(false);
    }
  }

  function updateCandidate(index: number, raw: string) {
    const value = Number(raw);
    setCandidates((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, value: Number.isFinite(value) ? value : 0, uncertain: false }
          : item,
      ),
    );
  }

  function removeCandidate(index: number) {
    setCandidates((items) => items.filter((_, itemIndex) => itemIndex !== index));
  }

  function confirmImport() {
    const clean = candidates.map((item) => item.value).filter((value) => Number.isFinite(value) && value > 0);
    if (clean.length === 0) {
      setError("Review the detected weights before confirming.");
      return;
    }
    onConfirm(mode === "append" ? [...currentWeights, ...clean] : clean);
    setError("");
  }

  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="font-bold text-slate-900">Scan Bundle Bill</h4>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Upload a supplier bill photo. Detected weights are shown for review first — stock is never saved directly from the scan.
          </p>
        </div>
        <span className="w-fit rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">Review Required</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        capture="environment"
        className="hidden"
        onChange={(event) => chooseFile(event.target.files?.[0])}
      />

      <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr]">
        <div>
          <button
            type="button"
            disabled={disabled || scanning}
            onClick={() => inputRef.current?.click()}
            className="flex min-h-44 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-violet-200 bg-white text-center text-sm font-semibold text-violet-700 hover:border-violet-300 disabled:opacity-50"
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Bundle bill preview" className="h-44 w-full object-contain" />
            ) : (
              <span className="px-4">Choose / Take Bill Photo</span>
            )}
          </button>

          <button
            type="button"
            disabled={!file || scanning || disabled}
            onClick={scanBill}
            className="mt-3 w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {scanning ? "Reading Bill..." : "Scan Weights"}
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          {candidates.length === 0 ? (
            <div className="flex min-h-44 items-center justify-center text-center text-sm text-slate-500">
              Scan results will appear here for manual checking.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">Detected Bundles: {candidates.length}</p>
                  <p className="mt-1 text-xs text-slate-500">Total detected weight: {total.toLocaleString("en-PK", { maximumFractionDigits: 2 })} KG</p>
                </div>
                <select
                  value={mode}
                  onChange={(event) => setMode(event.target.value === "append" ? "append" : "replace")}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  <option value="replace">Replace Current List</option>
                  <option value="append">Append to Current List</option>
                </select>
              </div>

              <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
                {candidates.map((item, index) => (
                  <div
                    key={`${index}-${item.value}`}
                    className={`grid grid-cols-[68px_1fr_auto] items-center gap-2 rounded-xl border p-2 ${
                      item.uncertain ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-500">B-{String(index + 1).padStart(3, "0")}</span>
                    <div>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.value || ""}
                        onChange={(event) => updateCandidate(index, event.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-violet-400"
                      />
                      {item.uncertain && <p className="mt-1 text-[11px] font-semibold text-amber-700">Please verify this reading.</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCandidate(index)}
                      className="rounded-lg px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                disabled={disabled || scanning || candidates.length === 0}
                onClick={confirmImport}
                className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Confirm Import After Review
              </button>
            </>
          )}
        </div>
      </div>

      {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</p>}
    </div>
  );
}
