"use client";

export default function SalesHeader({
  onAdd,
}: {
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

      <div>

        <h1 className="text-2xl font-bold text-slate-900">
          Sales
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage sales, invoices and customer payments.
        </p>

      </div>

      <button
        onClick={onAdd}
        className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
      >
        + New Sale
      </button>

    </div>
  );
}