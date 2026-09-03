"use client";

import {
  ArrowLeft,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

export default function SalesHeader({
  onAdd,
}: {
  onAdd: () => void;
}) {
  const router =
    useRouter();

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

      {/* LEFT SIDE */}
      <div className="flex min-w-0 items-start gap-3">

        {/* BACK TO DASHBOARD */}
        <button
          type="button"
          onClick={() =>
            router.push(
              "/dashboard"
            )
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          aria-label="Back to Dashboard"
          title="Back to Dashboard"
        >
          <ArrowLeft
            size={19}
          />
        </button>

        {/* TITLE */}
        <div className="min-w-0">

          <h1 className="text-2xl font-bold text-slate-900">
            Sales
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage sales, invoices and customer payments.
          </p>

        </div>

      </div>

      {/* NEW SALE */}
      <button
        type="button"
        onClick={onAdd}
        className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 md:w-auto"
      >
        + New Sale
      </button>

    </div>
  );
}