import type { FormEvent } from "react";
import type {
  Product,
  PurchaseForm,
  PurchaseStatus,
  Supplier,
} from "./purchaseTypes";
import { formatCurrency, normalizePaymentMethod } from "./purchaseUtils";
import { Input, Select, StatusBadge, SummaryBox } from "./purchaseUi";
import BundleIntake from "./bundleIntake/BundleIntake";

export default function PurchaseModal({
  open,
  editingId,
  saving,
  form,
  suppliers,
  products,
  selectedSupplier,
  selectedProduct,
  bundleWeights,
  totalBundleWeight,
  quantity,
  purchasePrice,
  totalAmount,
  paidAmount,
  remainingAmount,
  currentStatus,
  onClose,
  onSubmit,
  updateForm,
  onSupplierChange,
  onProductChange,
}: {
  open: boolean;
  editingId: number | null;
  saving: boolean;
  form: PurchaseForm;
  suppliers: Supplier[];
  products: Product[];
  selectedSupplier?: Supplier;
  selectedProduct?: Product;
  bundleWeights: number[];
  totalBundleWeight: number;
  quantity: number;
  purchasePrice: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currentStatus: PurchaseStatus;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  updateForm: <K extends keyof PurchaseForm>(field: K, value: PurchaseForm[K]) => void;
  onSupplierChange: (value: string) => void;
  onProductChange: (value: string) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4">
      <div className="flex min-h-full items-start justify-center py-4 sm:items-center">
        <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {editingId !== null ? "Edit Purchase" : "New Purchase"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">Add supplier purchase and receive stock.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600 hover:bg-slate-200"
            >
              ×
            </button>
          </div>

          <form onSubmit={onSubmit} className="max-h-[calc(100vh-120px)] space-y-6 overflow-y-auto p-6">
            <section className="rounded-2xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900">Purchase Information</h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Input
                  label="Purchase Date"
                  type="date"
                  value={form.date}
                  onChange={(value) => updateForm("date", value)}
                />

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Supplier</span>
                  <select
                    value={form.supplierId}
                    onChange={(event) => onSupplierChange(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={String(supplier.id)}>
                        {supplier.name}{supplier.phone ? ` - ${supplier.phone}` : ""}
                      </option>
                    ))}
                    <option value="ADD_NEW_SUPPLIER">+ Add New Supplier</option>
                  </select>
                  {selectedSupplier && (
                    <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                      Selected: <strong>{selectedSupplier.name}</strong>
                      {selectedSupplier.phone ? ` • ${selectedSupplier.phone}` : ""}
                    </div>
                  )}
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Product</span>
                  <select
                    value={form.productId}
                    onChange={(event) => onProductChange(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product.id} value={String(product.id)}>
                        {product.name} ({product.type === "weight" ? "KG" : product.unit})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5">
              <h3 className="font-bold text-slate-900">Product Details</h3>

              {selectedProduct ? (
                <>
                  <div className="mt-4 rounded-xl bg-white p-4">
                    <p className="text-xs font-medium uppercase text-slate-400">Selected Product</p>
                    <p className="mt-1 font-bold text-slate-900">{selectedProduct.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Category: {selectedProduct.category || "-"} • Type: {selectedProduct.type}
                    </p>
                  </div>

                  {selectedProduct.type === "weight" ? (
                    <div className="mt-5">
                      <div className="rounded-xl bg-white p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-bold text-slate-900">Bundle Intake</p>
                            <p className="mt-1 text-xs text-slate-500">
                              Add bundles one-by-one or paste many weights together.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                              {bundleWeights.length} Bundles
                            </span>
                            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                              {totalBundleWeight.toLocaleString("en-PK", { maximumFractionDigits: 2 })} KG
                            </span>
                          </div>
                        </div>
                      </div>

                      <BundleIntake
                        value={form.bundleWeights}
                        onChange={(value) => updateForm("bundleWeights", value)}
                        disabled={saving}
                      />
                    </div>
                  ) : (
                    <div className="mt-5">
                      <Input
                        label="Quantity (PCS)"
                        type="number"
                        value={form.quantity}
                        onChange={(value) => updateForm("quantity", value)}
                        placeholder="10"
                      />
                    </div>
                  )}

                  <div className="mt-4">
                    <Input
                      label={selectedProduct.type === "weight" ? "Purchase Price / KG" : "Purchase Price / Unit"}
                      type="number"
                      value={form.purchasePrice}
                      onChange={(value) => updateForm("purchasePrice", value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl bg-white p-4">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Purchase</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {quantity.toLocaleString("en-PK", { maximumFractionDigits: 2 })} {selectedProduct.type === "weight" ? "KG" : "PCS"} × {formatCurrency(purchasePrice)}
                      </p>
                    </div>
                    <span className="text-xl font-bold text-slate-900">{formatCurrency(totalAmount)}</span>
                  </div>
                </>
              ) : (
                <div className="mt-4 rounded-xl bg-white p-5 text-center text-sm text-slate-500">
                  Select a product first.
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-orange-200 bg-orange-50/40 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Payment</h3>
                <StatusBadge status={currentStatus} />
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Input
                  label="Paid Amount"
                  type="number"
                  value={form.paidAmount}
                  onChange={(value) => updateForm("paidAmount", value)}
                  placeholder="0"
                />
                <Select
                  label="Payment Method"
                  value={form.paymentMethod}
                  onChange={(value) => updateForm("paymentMethod", normalizePaymentMethod(value))}
                  options={[
                    { value: "Cash", label: "Cash" },
                    { value: "Bank", label: "Bank" },
                    { value: "Credit", label: "Credit" },
                    { value: "Other", label: "Other" },
                  ]}
                />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <SummaryBox title="Purchase Total" value={formatCurrency(totalAmount)} />
                <SummaryBox title="Paid" value={formatCurrency(paidAmount)} success />
                <SummaryBox
                  title="Remaining Payable"
                  value={formatCurrency(remainingAmount)}
                  danger={remainingAmount > 0}
                />
              </div>
            </section>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Notes</span>
              <textarea
                value={form.notes}
                onChange={(event) => updateForm("notes", event.target.value)}
                rows={3}
                placeholder="Optional notes..."
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
              />
            </label>

            <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saving
                  ? editingId !== null
                    ? "Updating..."
                    : "Saving..."
                  : editingId !== null
                    ? "Update Purchase"
                    : "Save Purchase"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
