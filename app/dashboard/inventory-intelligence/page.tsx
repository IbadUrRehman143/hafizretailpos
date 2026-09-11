"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Risk = "SAFE" | "WATCH" | "HIGH_RISK" | "OUT_OF_STOCK";

type Item = {
  productId: number;
  productName: string;
  unit: string;
  currentStock: number;
  sold7Days: number;
  sold30Days: number;
  weightedDailyVelocity: number;
  daysRemaining: number | null;
  risk: Risk;
  riskReason: string;
  reorderRequired: boolean;
  recommendedReorder: number;
  estimatedPurchaseCost: number;
};

type Summary = {
  generatedAt: string;
  targetStockDays: number;
  products: number;
  safe: number;
  watch: number;
  highRisk: number;
  outOfStock: number;
  reorderProducts: number;
  estimatedPurchaseCost: number;
  items: Item[];
};

const money = (n: number) =>
  `Rs. ${Number(n || 0).toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;

const number = (n: number) =>
  Number(n || 0).toLocaleString("en-PK", { maximumFractionDigits: 2 });

const riskClass: Record<Risk, string> = {
  SAFE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  WATCH: "bg-amber-50 text-amber-700 border-amber-200",
  HIGH_RISK: "bg-orange-50 text-orange-700 border-orange-200",
  OUT_OF_STOCK: "bg-red-50 text-red-700 border-red-200",
};

export default function InventoryIntelligencePage() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [targetDays, setTargetDays] = useState(30);
  const [filter, setFilter] = useState<"ALL" | Risk>("ALL");

  async function load(days = targetDays) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/inventory-intelligence?targetDays=${days}`, {
        cache: "no-store",
        credentials: "include",
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to load.");
      setData(payload.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load inventory intelligence.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = useMemo(() => {
    if (!data) return [];
    return filter === "ALL" ? data.items : data.items.filter((x) => x.risk === filter);
  }, [data, filter]);

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
        >
          <span aria-hidden="true">←</span>
          Back to Dashboard
        </Link>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                Phase 6 · Verified Intelligence
              </p>
              <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
                Inventory AI Intelligence
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Sales velocity, stock coverage, risk detection, reorder planning and purchase recommendations from real POS data.
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <label className="text-xs font-semibold text-slate-600">
                Target stock days
                <select
                  value={targetDays}
                  onChange={(e) => setTargetDays(Number(e.target.value))}
                  className="mt-1 block rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  {[14, 21, 30, 45, 60].map((d) => <option key={d} value={d}>{d} days</option>)}
                </select>
              </label>
              <button
                onClick={() => void load(targetDays)}
                disabled={loading}
                className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {loading ? "Calculating..." : "Recalculate"}
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {data && (
          <>
            <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
              {[
                ["Products", data.products],
                ["Safe", data.safe],
                ["Watch", data.watch],
                ["High Risk", data.highRisk],
                ["Out", data.outOfStock],
                ["Reorder", data.reorderProducts],
                ["Purchase Need", money(data.estimatedPurchaseCost)],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500">{label}</p>
                  <p className="mt-2 break-words text-xl font-black text-slate-950">{value}</p>
                </div>
              ))}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-black text-slate-950">Product Intelligence</h2>
                  <p className="text-xs text-slate-500">7-day demand gets 65% weight; 30-day baseline gets 35%.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["ALL", "OUT_OF_STOCK", "HIGH_RISK", "WATCH", "SAFE"] as const).map((value) => (
                    <button
                      key={value}
                      onClick={() => setFilter(value)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                        filter === value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      {value.replaceAll("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 p-4 lg:hidden">
                {items.map((item) => (
                  <article key={item.productId} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-950">{item.productName}</p>
                        <p className="text-xs text-slate-500">ID {item.productId} · {item.unit}</p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${riskClass[item.risk]}`}>
                        {item.risk.replaceAll("_", " ")}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <Info label="Stock" value={`${number(item.currentStock)} ${item.unit}`} />
                      <Info label="Daily velocity" value={`${number(item.weightedDailyVelocity)} ${item.unit}`} />
                      <Info label="Days remaining" value={item.daysRemaining === null ? "No recent demand" : `${item.daysRemaining} days`} />
                      <Info label="Reorder" value={`${number(item.recommendedReorder)} ${item.unit}`} />
                    </div>
                    <p className="mt-3 text-xs text-slate-500">{item.riskReason}</p>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1000px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      {["Product","Stock","Sold 7D","Sold 30D","Daily Velocity","Days Left","Risk","Reorder","Est. Cost"].map((h) => (
                        <th key={h} className="px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.productId} className="border-t border-slate-100">
                        <td className="px-4 py-4 font-bold text-slate-950">{item.productName}</td>
                        <td className="px-4 py-4">{number(item.currentStock)} {item.unit}</td>
                        <td className="px-4 py-4">{number(item.sold7Days)}</td>
                        <td className="px-4 py-4">{number(item.sold30Days)}</td>
                        <td className="px-4 py-4">{number(item.weightedDailyVelocity)}</td>
                        <td className="px-4 py-4">{item.daysRemaining === null ? "—" : item.daysRemaining}</td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${riskClass[item.risk]}`}>
                            {item.risk.replaceAll("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-bold">{number(item.recommendedReorder)} {item.unit}</td>
                        <td className="px-4 py-4">{money(item.estimatedPurchaseCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 font-bold text-slate-800">{value}</p>
    </div>
  );
}
