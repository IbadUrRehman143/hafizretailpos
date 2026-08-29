"use client";

import type {
  FormEvent,
} from "react";

import {
  categories,
  Product,
  ProductType,
} from "./productTypes";

import {
  calculateWeights,
} from "./productUtils";

type Props = {
  open: boolean;
  form: Product;
  editingId: number | null;
  saving: boolean;

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
  setForm,
  onClose,
  onSubmit,
}: Props) {
  if (!open) {
    return null;
  }

  const weight =
    calculateWeights(
      form.weightEntries
    );

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
  }

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4">

      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

        <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-6 py-5">

          <div>
            <h2 className="text-xl font-bold">
              {editingId !== null
                ? "Edit Product"
                : "Add Product"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Product will be saved in PostgreSQL.
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

        <form
          onSubmit={onSubmit}
          className="space-y-6 p-6"
        >

          <section className="rounded-2xl border p-5">

            <h3 className="font-bold">
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

              <Select
                label="Category"
                value={form.category}
                options={categories}
                onChange={(value) =>
                  updateForm(
                    "category",
                    value
                  )
                }
              />

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

              <Input
                label="Purchase Price"
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

              <Input
                label="Selling Price"
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

          <section className="rounded-2xl border p-5">

            <h3 className="font-bold">
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

          {form.type !==
            "weight" && (

            <section className="rounded-2xl border bg-slate-50 p-5">

              <h3 className="font-bold">
                Stock Quantity
              </h3>

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
                        Number(value) ||
                          0
                      )
                    )
                  }
                />

              </div>

            </section>

          )}

          {form.type ===
            "weight" && (

            <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

              <h3 className="font-bold">
                Weight Stock
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Har weight ko + sign se separate karein.
              </p>

              <input
                type="text"
                value={
                  form.weightEntries
                }
                onChange={(event) =>
                  updateForm(
                    "weightEntries",
                    event.target.value
                  )
                }
                placeholder="12+13+15+16"
                className="mt-5 w-full rounded-xl border bg-white px-4 py-3 text-lg font-semibold outline-none"
              />

              <div className="mt-5 grid gap-4 sm:grid-cols-2">

                <div className="rounded-xl bg-white p-5">
                  <p className="text-sm text-slate-500">
                    Quantity
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {weight.quantity}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-5">
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

            </section>

          )}

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