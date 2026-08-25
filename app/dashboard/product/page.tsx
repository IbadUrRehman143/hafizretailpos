"use client";

import { useMemo, useState } from "react";

type ProductType = "weight" | "quantity" | "size";

type Bundle = {
  id: number;
  name: string;
  weight: string;
};

type Product = {
  id: number;
  name: string;
  category: string;
  type: ProductType;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  size: string;
  material: string;
  brand: string;
  model: string;
  quality: string;
  color: string;
  bundles: Bundle[];
};

const categories = [
  "Cotton",
  "Electronics",
  "Beds",
  "Furniture",
  "Appliances",
  "Bamboo",
  "Other",
];

const initialProducts: Product[] = [
  {
    id: 1,
    name: "Cotton",
    category: "Cotton",
    type: "weight",
    unit: "KG",
    purchasePrice: 180,
    sellingPrice: 220,
    quantity: 0,
    size: "",
    material: "",
    brand: "",
    model: "",
    quality: "Premium",
    color: "",
    bundles: [
      { id: 1, name: "B-001", weight: "82" },
      { id: 2, name: "B-002", weight: "115" },
      { id: 3, name: "B-003", weight: "67" },
    ],
  },
  {
    id: 2,
    name: "Washing Machine",
    category: "Appliances",
    type: "quantity",
    unit: "PCS",
    purchasePrice: 45000,
    sellingPrice: 50000,
    quantity: 5,
    size: "",
    material: "",
    brand: "Dawlance",
    model: "DW-123",
    quality: "A Grade",
    color: "White",
    bundles: [],
  },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [form, setForm] = useState<Product>({
    id: 0,
    name: "",
    category: "Electronics",
    type: "quantity",
    unit: "PCS",
    purchasePrice: 0,
    sellingPrice: 0,
    quantity: 1,
    size: "",
    material: "",
    brand: "",
    model: "",
    quality: "",
    color: "",
    bundles: [],
  });

  const totalBundleWeight = useMemo(() => {
    return form.bundles.reduce(
      (total, bundle) => total + (Number(bundle.weight) || 0),
      0
    );
  }, [form.bundles]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.category.toLowerCase().includes(search.toLowerCase()) ||
        product.brand.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        categoryFilter === "All" || product.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  function resetForm() {
    setForm({
      id: 0,
      name: "",
      category: "Electronics",
      type: "quantity",
      unit: "PCS",
      purchasePrice: 0,
      sellingPrice: 0,
      quantity: 1,
      size: "",
      material: "",
      brand: "",
      model: "",
      quality: "",
      color: "",
      bundles: [],
    });

    setEditingId(null);
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    resetForm();
  }

  function handleChange(
    field: keyof Product,
    value: string | number
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleTypeChange(type: ProductType) {
    let unit = "PCS";

    if (type === "weight") {
      unit = "KG";
    }

    if (type === "size") {
      unit = "PCS";
    }

    setForm((prev) => ({
      ...prev,
      type,
      unit,
      bundles: type === "weight" ? prev.bundles : [],
    }));
  }

  function addBundle() {
    const nextNumber = form.bundles.length + 1;

    setForm((prev) => ({
      ...prev,
      bundles: [
        ...prev.bundles,
        {
          id: Date.now(),
          name: `B-${String(nextNumber).padStart(3, "0")}`,
          weight: "",
        },
      ],
    }));
  }

  function updateBundle(
    id: number,
    field: "name" | "weight",
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      bundles: prev.bundles.map((bundle) =>
        bundle.id === id
          ? { ...bundle, [field]: value }
          : bundle
      ),
    }));
  }

  function removeBundle(id: number) {
    setForm((prev) => ({
      ...prev,
      bundles: prev.bundles.filter((bundle) => bundle.id !== id),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Product name is required.");
      return;
    }

    if (form.type === "weight" && form.bundles.length === 0) {
      alert("Please add at least one bundle.");
      return;
    }

    if (editingId !== null) {
      setProducts((prev) =>
        prev.map((product) =>
          product.id === editingId
            ? {
                ...form,
                id: editingId,
              }
            : product
        )
      );
    } else {
      setProducts((prev) => [
        ...prev,
        {
          ...form,
          id: Date.now(),
        },
      ]);
    }

    closeForm();
  }

  function editProduct(product: Product) {
    setForm({
      ...product,
      bundles: product.bundles.map((bundle) => ({
        ...bundle,
      })),
    });

    setEditingId(product.id);
    setShowForm(true);
  }

  function deleteProduct(id: number) {
    const product = products.find((item) => item.id === id);

    if (!product) return;

    const confirmed = window.confirm(
      `Delete "${product.name}"?`
    );

    if (!confirmed) return;

    setProducts((prev) =>
      prev.filter((product) => product.id !== id)
    );
  }

  function getTotalStock(product: Product) {
    if (product.type === "weight") {
      return product.bundles.reduce(
        (total, bundle) => total + (Number(bundle.weight) || 0),
        0
      );
    }

    return product.quantity;
  }

  function getTypeLabel(type: ProductType) {
    if (type === "weight") return "Weight";
    if (type === "quantity") return "Quantity";
    return "Size";
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Products
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage products, stock and product specifications.
            </p>
          </div>

          <button
            onClick={openAddForm}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Add Product
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Total Products"
            value={products.length}
          />

          <StatCard
            title="Weight Products"
            value={
              products.filter(
                (product) => product.type === "weight"
              ).length
            }
          />

          <StatCard
            title="Quantity Products"
            value={
              products.filter(
                (product) => product.type === "quantity"
              ).length
            }
          />

          <StatCard
            title="Categories"
            value={new Set(products.map((p) => p.category)).size}
          />
        </div>

        {/* Search / Filter */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                🔎
              </span>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product, category or brand..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value)
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
            >
              <option value="All">All Categories</option>

              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-237.5">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Purchase</TableHead>
                  <TableHead>Selling</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Actions</TableHead>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      No products found.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {product.name}
                          </p>

                          {product.brand && (
                            <p className="mt-1 text-xs text-slate-500">
                              {product.brand}
                              {product.model
                                ? ` • ${product.model}`
                                : ""}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {product.category}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            product.type === "weight"
                              ? "bg-blue-50 text-blue-700"
                              : product.type === "quantity"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-purple-50 text-purple-700"
                          }`}
                        >
                          {getTypeLabel(product.type)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {getTotalStock(product)}
                        </div>

                        <div className="text-xs text-slate-500">
                          {product.type === "weight"
                            ? "KG"
                            : product.unit}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        Rs. {product.purchasePrice.toLocaleString()}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                        Rs. {product.sellingPrice.toLocaleString()}
                      </td>

                      <td className="px-5 py-4">
                        <div className="max-w-45 text-xs text-slate-500">
                          {product.size && (
                            <div>Size: {product.size}</div>
                          )}

                          {product.material && (
                            <div>
                              Material: {product.material}
                            </div>
                          )}

                          {product.quality && (
                            <div>
                              Quality: {product.quality}
                            </div>
                          )}

                          {product.bundles.length > 0 && (
                            <div>
                              Bundles: {product.bundles.length}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => editProduct(product)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              deleteProduct(product.id)
                            }
                            className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingId !== null
                    ? "Edit Product"
                    : "Add Product"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Select product type to show the required fields.
                </p>
              </div>

              <button
                onClick={closeForm}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600 hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Basic Information */}
                <section className="rounded-2xl border border-slate-200 p-5">
                  <SectionTitle title="Basic Information" />

                  <div className="mt-5 grid gap-4">
                    <Input
                      label="Product Name"
                      required
                      value={form.name}
                      onChange={(value) =>
                        handleChange("name", value)
                      }
                      placeholder="e.g. Cotton"
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Select
                        label="Category"
                        value={form.category}
                        onChange={(value) =>
                          handleChange("category", value)
                        }
                        options={categories}
                      />

                      <Select
                        label="Product Type"
                        value={form.type}
                        onChange={(value) =>
                          handleTypeChange(
                            value as ProductType
                          )
                        }
                        options={[
                          "quantity",
                          "weight",
                          "size",
                        ]}
                        labels={{
                          quantity: "Quantity Based",
                          weight: "Weight Based",
                          size: "Size Based",
                        }}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label="Purchase Price"
                        type="number"
                        value={form.purchasePrice}
                        onChange={(value) =>
                          handleChange(
                            "purchasePrice",
                            Number(value)
                          )
                        }
                        placeholder="0"
                      />

                      <Input
                        label="Selling Price"
                        type="number"
                        value={form.sellingPrice}
                        onChange={(value) =>
                          handleChange(
                            "sellingPrice",
                            Number(value)
                          )
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>
                </section>

                {/* Specifications */}
                <section className="rounded-2xl border border-slate-200 p-5">
                  <SectionTitle title="Specifications" />

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Brand"
                      value={form.brand}
                      onChange={(value) =>
                        handleChange("brand", value)
                      }
                      placeholder="e.g. Dawlance"
                    />

                    <Input
                      label="Model"
                      value={form.model}
                      onChange={(value) =>
                        handleChange("model", value)
                      }
                      placeholder="e.g. DW-123"
                    />

                    <Input
                      label="Quality"
                      value={form.quality}
                      onChange={(value) =>
                        handleChange("quality", value)
                      }
                      placeholder="e.g. A Grade"
                    />

                    <Input
                      label="Material"
                      value={form.material}
                      onChange={(value) =>
                        handleChange("material", value)
                      }
                      placeholder="Wood / Iron / Steel"
                    />

                    <Input
                      label="Size"
                      value={form.size}
                      onChange={(value) =>
                        handleChange("size", value)
                      }
                      placeholder="e.g. 6 x 3"
                    />

                    <Input
                      label="Color"
                      value={form.color}
                      onChange={(value) =>
                        handleChange("color", value)
                      }
                      placeholder="e.g. White"
                    />
                  </div>
                </section>
              </div>

              {/* Quantity Based */}
              {form.type === "quantity" && (
                <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
                  <SectionTitle title="Quantity Stock" />

                  <div className="mt-5 max-w-sm">
                    <Input
                      label={`Quantity (${form.unit})`}
                      type="number"
                      value={form.quantity}
                      onChange={(value) =>
                        handleChange(
                          "quantity",
                          Number(value)
                        )
                      }
                      placeholder="0"
                    />
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    Example: Washing Machine = 10 PCS,
                    Pedestal Fan = 25 PCS.
                  </p>
                </section>
              )}

              {/* Weight Based */}
              {form.type === "weight" && (
                <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/40 p-5">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <SectionTitle title="Bundles / Weight Stock" />

                      <p className="mt-1 text-xs text-slate-500">
                        Every bundle can have a different weight.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addBundle}
                      className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      + Add Bundle
                    </button>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <div>Bundle</div>
                      <div>Weight (KG)</div>
                      <div></div>
                    </div>

                    {form.bundles.length === 0 ? (
                      <div className="px-5 py-10 text-center text-sm text-slate-500">
                        No bundles added yet.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {form.bundles.map((bundle) => (
                          <div
                            key={bundle.id}
                            className="grid grid-cols-[1fr_1fr_auto] items-center gap-3 px-4 py-3"
                          >
                            <input
                              value={bundle.name}
                              onChange={(e) =>
                                updateBundle(
                                  bundle.id,
                                  "name",
                                  e.target.value
                                )
                              }
                              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                            />

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={bundle.weight}
                              onChange={(e) =>
                                updateBundle(
                                  bundle.id,
                                  "weight",
                                  e.target.value
                                )
                              }
                              placeholder="e.g. 82"
                              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                removeBundle(bundle.id)
                              }
                              className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl bg-white px-5 py-4 shadow-sm">
                    <span className="text-sm font-medium text-slate-600">
                      Total Weight
                    </span>

                    <span className="text-xl font-bold text-blue-700">
                      {totalBundleWeight.toFixed(2)} KG
                    </span>
                  </div>
                </section>
              )}

              {/* Size Based */}
              {form.type === "size" && (
                <section className="mt-6 rounded-2xl border border-purple-200 bg-purple-50/40 p-5">
                  <SectionTitle title="Size Based Product" />

                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Input
                      label="Size"
                      value={form.size}
                      onChange={(value) =>
                        handleChange("size", value)
                      }
                      placeholder="e.g. 6 x 3"
                    />

                    <Input
                      label="Material"
                      value={form.material}
                      onChange={(value) =>
                        handleChange("material", value)
                      }
                      placeholder="Wood / Iron"
                    />

                    <Input
                      label="Quantity"
                      type="number"
                      value={form.quantity}
                      onChange={(value) =>
                        handleChange(
                          "quantity",
                          Number(value)
                        )
                      }
                      placeholder="0"
                    />
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    Example: Charpai 6×3, Metal, Quantity 5.
                  </p>
                </section>
              )}

              {/* Footer */}
              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                >
                  {editingId !== null
                    ? "Update Product"
                    : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------------
   Reusable Components
-------------------------------- */

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h3 className="text-base font-bold text-slate-900">
      {title}
    </h3>
  );
}

function TableHead({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </span>

      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  labels,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels?.[option] ??
              option.charAt(0).toUpperCase() +
                option.slice(1)}
          </option>
        ))}
      </select>
    </label>
  );
}