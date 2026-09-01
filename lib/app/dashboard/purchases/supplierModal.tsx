import type {
  Dispatch,
  FormEvent,
  SetStateAction,
} from "react";

import type {
  SupplierForm,
} from "./purchaseTypes";

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

  setForm: Dispatch<
    SetStateAction<SupplierForm>
  >;

  saving: boolean;

  onClose: () => void;

  onSubmit: (
    event: FormEvent<HTMLFormElement>
  ) => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/50 p-4">
      <div className="flex min-h-full items-start justify-center py-6 sm:items-center">
        <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
          {/* HEADER */}

          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Add Supplier
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add a new supplier for purchases.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ×
            </button>
          </div>

          {/* FORM */}

          <form
            onSubmit={onSubmit}
            className="space-y-5 p-6"
          >
            {/* SUPPLIER NAME */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Supplier Name
              </label>

              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  setForm(
                    (previous) => ({
                      ...previous,

                      name:
                        event.target.value,
                    })
                  )
                }
                placeholder="e.g. Khan"
                autoFocus
                disabled={saving}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 disabled:bg-slate-100"
              />
            </div>

            {/* PHONE */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Phone
              </label>

              <input
                type="text"
                value={form.phone}
                onChange={(event) =>
                  setForm(
                    (previous) => ({
                      ...previous,

                      phone:
                        event.target.value,
                    })
                  )
                }
                placeholder="e.g. 03003003003"
                disabled={saving}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 disabled:bg-slate-100"
              />
            </div>

            {/* INFO */}

            <div className="rounded-xl bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-700">
              Supplier save hone ke baad automatically Purchase form mein select ho jayega.
            </div>

            {/* BUTTONS */}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Add Supplier"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}