"use client";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type {
  Category,
  Product,
  ProductType,
  Subcategory,
} from "./productTypes";

import {
  calculateWeights,
  cleanWeightEntries,
  parseWeights,
} from "./productUtils";

type Props = {
  open: boolean;
  form: Product;
  editingId: number | null;
  saving: boolean;

  categories: Category[];
  subcategories: Subcategory[];

  setForm: React.Dispatch<
    React.SetStateAction<Product>
  >;

  onClose: () => void;

  onSubmit: (
    event: FormEvent<HTMLFormElement>
  ) => void;
};

export default function ProductModal({
  open,
  form,
  editingId,
  saving,
  categories,
  subcategories,
  setForm,
  onClose,
  onSubmit,
}: Props) {
  const [quickWeight, setQuickWeight] =
    useState("");

  const [bulkWeights, setBulkWeights] =
    useState("");

  // ====================================================
  // CATEGORY SUBCATEGORIES
  // ====================================================

  const filteredSubcategories =
    useMemo(() => {
      if (!form.categoryId) {
        return [];
      }

      return subcategories.filter(
        (subcategory) =>
          subcategory.categoryId ===
            form.categoryId &&
          subcategory.status ===
            "Active"
      );
    }, [
      form.categoryId,
      subcategories,
    ]);

  // ====================================================
  // WEIGHT CALCULATION
  // ====================================================

  const weight =
    calculateWeights(
      form.weightEntries
    );

  if (!open) {
    return null;
  }

  // ====================================================
  // UPDATE FORM
  // ====================================================

  function updateForm<
    K extends keyof Product
  >(
    field: K,
    value: Product[K]
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  // ====================================================
  // CHANGE PRODUCT TYPE
  // ====================================================

  function changeType(
    type: ProductType
  ) {
    setForm(
      (current) => ({
        ...current,

        type,

        unit:
          type === "weight"
            ? "KG"
            : "PCS",

        quantity:
          type === "weight"
            ? 0
            : current.quantity,

        weightEntries:
          type === "weight"
            ? current.weightEntries
            : "",
      })
    );

    setQuickWeight("");
    setBulkWeights("");
  }

  // ====================================================
  // CHANGE CATEGORY
  // ====================================================

  function changeCategory(
    value: string
  ) {
    const id =
      Number(value);

    const category =
      categories.find(
        (item) =>
          item.id === id
      );

    setForm(
      (current) => ({
        ...current,

        categoryId:
          category?.id ??
          null,

        categoryName:
          category?.name ??
          "",

        // Category change hone par old subcategory remove.
        subcategoryId:
          null,

        subcategoryName:
          "",
      })
    );
  }

  // ====================================================
  // CHANGE SUBCATEGORY
  // ====================================================

  function changeSubcategory(
    value: string
  ) {
    if (!value) {
      setForm(
        (current) => ({
          ...current,
          subcategoryId:
            null,
          subcategoryName:
            "",
        })
      );

      return;
    }

    const id =
      Number(value);

    const subcategory =
      filteredSubcategories.find(
        (item) =>
          item.id === id
      );

    setForm(
      (current) => ({
        ...current,

        subcategoryId:
          subcategory?.id ??
          null,

        subcategoryName:
          subcategory?.name ??
          "",
      })
    );
  }

  // ====================================================
  // QUICK BUNDLE
  // ====================================================

  function addQuickWeight() {
    const value =
      Number(quickWeight);

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      alert(
        "Enter valid bundle weight."
      );

      return;
    }

    const current =
      parseWeights(
        form.weightEntries
      );

    const next = [
      ...current,
      value,
    ];

    updateForm(
      "weightEntries",
      next.join("+")
    );

    setQuickWeight("");
  }

  // ====================================================
  // BULK BUNDLES
  // ====================================================

  function addBulkWeights() {
    const incoming =
      parseWeights(
        bulkWeights
      );

    if (
      incoming.length === 0
    ) {
      alert(
        "Enter valid bundle weights.\nExample: 82+115+67+94"
      );

      return;
    }

    const current =
      parseWeights(
        form.weightEntries
      );

    updateForm(
      "weightEntries",
      [
        ...current,
        ...incoming,
      ].join("+")
    );

    setBulkWeights("");
  }

  // ====================================================
  // REMOVE BUNDLE
  // ====================================================

  function removeWeight(
    index: number
  ) {
    const current =
      parseWeights(
        form.weightEntries
      );

    current.splice(
      index,
      1
    );

    updateForm(
      "weightEntries",
      current.join("+")
    );
  }

  // ====================================================
  // CLEAR WEIGHTS
  // ====================================================

  function clearWeights() {
    if (
      weight.quantity === 0
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Remove all bundle weights?"
      );

    if (!confirmed) {
      return;
    }

    updateForm(
      "weightEntries",
      ""
    );
  }

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {editingId !== null
                ? "Edit Product"
                : "Add Product"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Product master, category,
              subcategory and opening stock.
            </p>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl"
          >
            ×
          </button>
        </div>

        {/* FORM */}

        <form
          onSubmit={onSubmit}
          className="space-y-6 p-6"
        >

          {/* ============================================
              BASIC INFORMATION
          ============================================ */}

          <section className="rounded-2xl border p-5">
            <h3 className="font-bold text-slate-900">
              Basic Information
            </h3>

            <div className="mt-5 grid gap-4 md:grid-cols-2">

              <Input
                label="Product Name"
                value={form.name}
                required
                onChange={(value) =>
                  updateForm(
                    "name",
                    value
                  )
                }
              />

              {/* CATEGORY */}

              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  Category
                </span>

                <select
                  required
                  value={
                    form.categoryId ??
                    ""
                  }
                  onChange={(event) =>
                    changeCategory(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value="">
                    Select Category
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {
                          category.name
                        }
                      </option>
                    )
                  )}
                </select>
              </label>

              {/* SUBCATEGORY */}

              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  Subcategory
                </span>

                <select
                  value={
                    form.subcategoryId ??
                    ""
                  }
                  disabled={
                    !form.categoryId
                  }
                  onChange={(event) =>
                    changeSubcategory(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border px-4 py-3 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">
                    {form.categoryId
                      ? "Select Subcategory"
                      : "Select Category First"}
                  </option>

                  {filteredSubcategories.map(
                    (subcategory) => (
                      <option
                        key={
                          subcategory.id
                        }
                        value={
                          subcategory.id
                        }
                      >
                        {
                          subcategory.name
                        }
                      </option>
                    )
                  )}
                </select>

                {form.categoryId &&
                  filteredSubcategories.length ===
                    0 && (
                    <p className="mt-2 text-xs text-amber-600">
                      Is category mein abhi
                      koi active subcategory
                      nahi hai.
                    </p>
                  )}
              </label>

              {/* TYPE */}

              <Select
                label="Product Type"
                value={form.type}
                options={[
                  "quantity",
                  "weight",
                  "size",
                ]}
                onChange={(value) =>
                  changeType(
                    value as ProductType
                  )
                }
              />

              {/* PURCHASE PRICE */}

              <Input
                label={
                  form.type === "weight"
                    ? "Purchase Price / KG"
                    : "Purchase Price / PCS"
                }
                type="number"
                value={
                  form.purchasePrice
                }
                onChange={(value) =>
                  updateForm(
                    "purchasePrice",
                    Math.max(
                      0,
                      Number(value) ||
                        0
                    )
                  )
                }
              />

              {/* SELLING PRICE */}

              <Input
                label={
                  form.type === "weight"
                    ? "Selling Price / KG"
                    : "Selling Price / PCS"
                }
                type="number"
                value={
                  form.sellingPrice
                }
                onChange={(value) =>
                  updateForm(
                    "sellingPrice",
                    Math.max(
                      0,
                      Number(value) ||
                        0
                    )
                  )
                }
              />
            </div>
          </section>

          {/* ============================================
              SPECIFICATIONS
          ============================================ */}

          <section className="rounded-2xl border p-5">
            <h3 className="font-bold text-slate-900">
              Specifications
            </h3>

            <div className="mt-5 grid gap-4 md:grid-cols-2">

              <Input
                label="Brand"
                value={form.brand}
                onChange={(value) =>
                  updateForm(
                    "brand",
                    value
                  )
                }
              />

              <Input
                label="Model"
                value={form.model}
                onChange={(value) =>
                  updateForm(
                    "model",
                    value
                  )
                }
              />

              <Input
                label="Quality"
                value={form.quality}
                onChange={(value) =>
                  updateForm(
                    "quality",
                    value
                  )
                }
              />

              <Input
                label="Material"
                value={form.material}
                onChange={(value) =>
                  updateForm(
                    "material",
                    value
                  )
                }
              />

              <Input
                label="Size"
                value={form.size}
                onChange={(value) =>
                  updateForm(
                    "size",
                    value
                  )
                }
              />

              <Input
                label="Color"
                value={form.color}
                onChange={(value) =>
                  updateForm(
                    "color",
                    value
                  )
                }
              />
            </div>
          </section>

          {/* ============================================
              PCS OPENING STOCK
          ============================================ */}

          {form.type !==
            "weight" && (
            <section className="rounded-2xl border bg-slate-50 p-5">
              <div>
                <h3 className="font-bold text-slate-900">
                  Opening Stock
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Supplier ka normal stock
                  Purchases module se enter
                  karein.
                </p>
              </div>

              <div className="mt-4 max-w-sm">
                <Input
                  label="Quantity (PCS)"
                  type="number"
                  value={
                    form.quantity
                  }
                  onChange={(value) =>
                    updateForm(
                      "quantity",
                      Math.max(
                        0,
                        Number(
                          value
                        ) || 0
                      )
                    )
                  }
                />
              </div>
            </section>
          )}

          {/* ============================================
              WEIGHT OPENING STOCK
          ============================================ */}

          {form.type ===
            "weight" && (
            <section className="space-y-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Bundle Opening Stock
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Har physical cotton
                    bundle ka exact weight
                    separately save hoga.
                  </p>
                </div>

                {weight.quantity >
                  0 && (
                  <button
                    type="button"
                    onClick={
                      clearWeights
                    }
                    className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* TOTALS */}

              <div className="grid gap-4 sm:grid-cols-2">

                <div className="rounded-2xl border bg-white p-5">
                  <p className="text-sm text-slate-500">
                    Total Bundles
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {
                      weight.quantity
                    }
                  </p>
                </div>

                <div className="rounded-2xl border bg-white p-5">
                  <p className="text-sm text-slate-500">
                    Total Weight
                  </p>

                  <p className="mt-2 text-3xl font-bold text-blue-700">
                    {weight.totalWeight.toFixed(
                      2
                    )}{" "}
                    KG
                  </p>
                </div>
              </div>

              {/* QUICK ENTRY */}

              <div className="rounded-2xl border bg-white p-5">
                <h4 className="font-bold text-slate-900">
                  Quick Bundle Entry
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Ek bundle ka weight enter
                  karein aur Add Bundle
                  press karein.
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={
                      quickWeight
                    }
                    onChange={(event) =>
                      setQuickWeight(
                        event.target
                          .value
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                        "Enter"
                      ) {
                        event.preventDefault();

                        addQuickWeight();
                      }
                    }}
                    placeholder="Example: 82"
                    className="min-w-0 flex-1 rounded-xl border px-4 py-3 text-lg font-semibold outline-none focus:border-blue-500"
                  />

                  <button
                    type="button"
                    onClick={
                      addQuickWeight
                    }
                    className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
                  >
                    + Add Bundle
                  </button>
                </div>
              </div>

              {/* BULK ENTRY */}

              <div className="rounded-2xl border bg-white p-5">
                <h4 className="font-bold text-slate-900">
                  Bulk Bundle Entry
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Multiple weights +,
                  comma, space ya new line
                  se enter kar sakte hain.
                </p>

                <textarea
                  rows={4}
                  value={
                    bulkWeights
                  }
                  onChange={(event) =>
                    setBulkWeights(
                      event.target
                        .value
                    )
                  }
                  placeholder={
                    "82+115+67+94\n\nor\n\n82, 115, 67, 94"
                  }
                  className="mt-4 w-full rounded-xl border px-4 py-3 font-semibold outline-none focus:border-blue-500"
                />

                <button
                  type="button"
                  onClick={
                    addBulkWeights
                  }
                  className="mt-3 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
                >
                  Add Bulk Weights
                </button>
              </div>

              {/* CURRENT BUNDLES */}

              <div className="rounded-2xl border bg-white p-5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">
                    Bundle List
                  </h4>

                  <span className="text-sm font-semibold text-slate-500">
                    {
                      weight.quantity
                    }{" "}
                    Bundles
                  </span>
                </div>

                {weight.weights.length ===
                0 ? (
                  <div className="mt-4 rounded-xl border border-dashed p-8 text-center text-sm text-slate-400">
                    No bundle weights
                    entered.
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {weight.weights.map(
                      (
                        bundleWeight,
                        index
                      ) => (
                        <div
                          key={`${index}-${bundleWeight}`}
                          className="rounded-xl border bg-slate-50 p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs text-slate-400">
                                Bundle{" "}
                                {String(
                                  index +
                                    1
                                ).padStart(
                                  2,
                                  "0"
                                )}
                              </p>

                              <p className="mt-1 text-lg font-bold text-slate-900">
                                {
                                  bundleWeight
                                }{" "}
                                KG
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeWeight(
                                  index
                                )
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-sm font-bold text-red-600"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* SOURCE OF TRUTH */}

              <div className="rounded-xl border border-blue-200 bg-blue-100/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Saved Weight Entries
                </p>

                <p className="mt-2 break-all font-mono text-sm font-semibold text-slate-700">
                  {cleanWeightEntries(
                    form.weightEntries
                  ) || "—"}
                </p>
              </div>
            </section>
          )}

          {/* ============================================
              ACTIONS
          ============================================ */}

          <div className="flex justify-end gap-3 border-t pt-6">

            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-xl border px-5 py-3 font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId !==
                    null
                  ? "Update Product"
                  : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ======================================================
// INPUT
// ======================================================

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string | number;

  onChange: (
    value: string
  ) => void;

  type?:
    | "text"
    | "number";

  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">
        {label}
      </span>

      <input
        required={required}
        type={type}
        min={
          type === "number"
            ? 0
            : undefined
        }
        step={
          type === "number"
            ? "any"
            : undefined
        }
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
      />
    </label>
  );
}

// ======================================================
// SELECT
// ======================================================

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];

  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border px-4 py-3"
      >
        {options.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          )
        )}
      </select>
    </label>
  );
}