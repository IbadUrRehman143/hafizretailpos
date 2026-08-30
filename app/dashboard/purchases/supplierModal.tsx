import type { FormEvent } from "react";
import type { SupplierForm } from "./purchaseTypes";
import { Input } from "./purchaseUi";

export default function SupplierModal({
  open,
  form,
  setForm,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  form: SupplierForm;
  setForm: (form: SupplierForm) => void;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Add New Supplier</h2>
            <p className="mt-1 text-sm text-slate-500">Supplier will be saved permanently.</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">×</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 p-6">
          <Input
            label="Supplier Name"
            value={form.name}
            onChange={(value) => setForm({ ...form, name: value })}
            placeholder="Khan Traders"
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(value) => setForm({ ...form, phone: value })}
            placeholder="03001234567"
          />
          <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
            Save ke baad supplier automatically current purchase mein select ho jayega.
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? "Saving..." : "Save Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
